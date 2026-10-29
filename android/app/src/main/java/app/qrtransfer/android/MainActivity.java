package app.qrtransfer.android;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.WebViewAssetLoader;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import org.json.JSONObject;
import java.io.*;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends ComponentActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int CAMERA = 10, PICK = 11, SAVE = 12;
    private WebView web;
    private Billing billing;
    private PermissionRequest cameraRequest;
    private ValueCallback<Uri[]> filePicker;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private File stagedFile;
    private FileOutputStream stagedOutput;
    private String saveId, saveName, saveMime;
    private long saveBytes;
    private boolean saveDialog;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (web == null || isFinishing() || isDestroyed()) return;
                web.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(d){d.close();return true;}return false;})()", value -> {
                    if (web == null || isFinishing() || isDestroyed() || "true".equals(value)) return;
                    if (web.canGoBack()) web.goBack();
                    else {
                        setEnabled(false);
                        try { getOnBackPressedDispatcher().onBackPressed(); }
                        finally { setEnabled(true); }
                    }
                });
            }
        });
        FrameLayout root = new FrameLayout(this);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        web = new WebView(this);
        root.addView(web); setContentView(root);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                if (cameraRequest != null) { cameraRequest.deny(); cameraRequest = null; }
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!trusted(uri)) return blocked();
                if (uri.getPath().endsWith("/")) uri = uri.buildUpon().path(uri.getPath() + "index.html").build();
                WebResourceResponse response = assets.shouldInterceptRequest(uri);
                return response == null ? blocked() : response;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (trusted(request.getUrl())) return false;
                if (request.isForMainFrame()) external(request.getUrl());
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                signal("qrtransfer:billing", null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                if (!trusted(request.getOrigin()) || !Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) { request.deny(); return; }
                if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
                    request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                else { if (cameraRequest != null) cameraRequest.deny(); cameraRequest = request;
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA); }
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) { if (cameraRequest == request) cameraRequest = null; }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePicker != null) filePicker.onReceiveValue(null);
                filePicker = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(intent, PICK); }
                catch (ActivityNotFoundException e) { callback.onReceiveValue(null); filePicker = null; toast("No file picker is available."); }
                return true;
            }
        });
        billing = new Billing(this, () -> signal("qrtransfer:billing", null), text -> signal("qrtransfer:billing-message", text));
        web.addJavascriptInterface(new Bridge(), "QRtransferAndroid");
        // Android 7 supports WebView 119, which supplies the upstream WASM,
        // module workers and CompressionStream APIs. Stock 2016 WebView does not.
        web.loadUrl("https://" + HOST + "/assets/web/index.html");
    }
    private boolean trusted(Uri uri) { return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getPort() == -1; }
    private WebResourceResponse blocked() { return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
    private void external(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (ActivityNotFoundException ignored) { toast("No browser is available."); }
    }
    private void toast(String message) { runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show()); }
    private void signal(String event, String detail) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.dispatchEvent(new CustomEvent(" + JSONObject.quote(event) +
            ",{detail:" + (detail == null ? "null" : JSONObject.quote(detail)) + "}))", null); });
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(code, permissions, grants);
        if (code == CAMERA && cameraRequest != null) {
            if (grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED) cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else cameraRequest.deny();
            cameraRequest = null;
        }
    }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == PICK && filePicker != null) {
            filePicker.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null ? new Uri[]{data.getData()} : null);
            filePicker = null;
        }
        if (code == SAVE) {
            if (result != RESULT_OK || data == null || data.getData() == null) { clearSave(); return; }
            Uri destination = data.getData();
            io.execute(() -> {
                try (InputStream in = new FileInputStream(stagedFile); OutputStream out = getContentResolver().openOutputStream(destination, "wt")) {
                    if (out == null) throw new IOException("No output stream");
                    byte[] buffer = new byte[65536]; int read;
                    while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
                    toast("File saved.");
                } catch (Exception e) { toast("Unable to save file. Check storage and retry."); }
                finally { clearSave(); }
            });
        }
    }
    private synchronized void clearSave() {
        try { if (stagedOutput != null) stagedOutput.close(); } catch (IOException ignored) { }
        if (stagedFile != null) stagedFile.delete();
        stagedFile = null; stagedOutput = null; saveId = null; saveDialog = false; saveBytes = 0;
    }
    private final class Bridge {
        @JavascriptInterface public String getPlan() { return billing.getPlan(); }
        @JavascriptInterface public String getProducts() { return billing.getProducts(); }
        @JavascriptInterface public void purchase(String product) { runOnUiThread(() -> billing.purchase(product)); }
        @JavascriptInterface public void restore() { runOnUiThread(() -> billing.refresh()); }
        @JavascriptInterface public void manageSubscriptions() { runOnUiThread(() -> external(Uri.parse("https://play.google.com/store/account/subscriptions"))); }
        @JavascriptInterface public void setTransferActive(boolean active) { runOnUiThread(() -> {
            if (active) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }); }
        @JavascriptInterface public String beginSave(String name, String mime) {
            synchronized (MainActivity.this) {
                if (saveId != null) return "";
                try {
                    stagedFile = File.createTempFile("qrtransfer-", ".part", getCacheDir());
                    stagedOutput = new FileOutputStream(stagedFile);
                    saveName = name.replaceAll("[\\\\/\\p{Cntrl}]", "_");
                    if (saveName.isEmpty()) saveName = "received-file";
                    saveName = saveName.substring(0, Math.min(180, saveName.length()));
                    saveMime = mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+") ? mime : "application/octet-stream";
                    saveId = UUID.randomUUID().toString(); return saveId;
                } catch (Exception e) { clearSave(); return ""; }
            }
        }
        @JavascriptInterface public boolean appendSave(String id, String base64) {
            synchronized (MainActivity.this) {
                if (!id.equals(saveId) || saveDialog || base64.length() > 65536) return false;
                try {
                    byte[] bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
                    saveBytes += bytes.length;
                    if (saveBytes > 256L * 1024 * 1024) throw new IOException("Export too large");
                    stagedOutput.write(bytes); return true;
                } catch (Exception e) { clearSave(); return false; }
            }
        }
        @JavascriptInterface public void finishSave(String id) {
            synchronized (MainActivity.this) {
                if (!id.equals(saveId) || saveDialog) return;
                try { stagedOutput.close(); stagedOutput = null; saveDialog = true; }
                catch (IOException e) { clearSave(); return; }
                runOnUiThread(() -> {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(saveMime).putExtra(Intent.EXTRA_TITLE, saveName);
                    try { startActivityForResult(intent, SAVE); }
                    catch (ActivityNotFoundException e) { clearSave(); toast("No document provider is available."); }
                });
            }
        }
        @JavascriptInterface public void cancelSave(String id) { synchronized (MainActivity.this) { if (id.equals(saveId) && !saveDialog) clearSave(); } }
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); signal("qrtransfer:resume", null); }
        if (billing != null) billing.refresh();
    }
    @Override protected void onPause() {
        signal("qrtransfer:pause", null);
        if (web != null) web.onPause();
        super.onPause();
    }
    @Override protected void onDestroy() {
        if (billing != null) billing.close();
        if (cameraRequest != null) cameraRequest.deny();
        if (filePicker != null) filePicker.onReceiveValue(null);
        if (web != null) { web.removeJavascriptInterface("QRtransferAndroid"); web.destroy(); web = null; }
        io.execute(this::clearSave); io.shutdown(); super.onDestroy();
    }
}
