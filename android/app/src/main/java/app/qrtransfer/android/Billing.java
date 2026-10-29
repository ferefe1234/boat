package app.qrtransfer.android;

import android.app.Activity;
import android.util.Base64;
import com.android.billingclient.api.*;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

/** Play owns subscription validity. No web/localStorage flag grants access. */
final class Billing implements PurchasesUpdatedListener {
    static final String PLUS = "qrtransfer_plus_monthly";
    static final String PRO = "qrtransfer_pro_monthly";
    private final Activity activity;
    private final Runnable changed;
    private final java.util.function.Consumer<String> message;
    private final BillingClient client;
    private volatile String plan = "free";
    private volatile String prices = "{}";
    private String oldToken;
    private boolean connecting;

    Billing(Activity activity, Runnable changed, java.util.function.Consumer<String> message) {
        this.activity = activity; this.changed = changed; this.message = message;
        client = BillingClient.newBuilder(activity).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }
    String getPlan() { return plan; }
    String getProducts() { return prices; }
    void refresh() {
        if (BuildConfig.PLAY_PUBLIC_KEY.isEmpty()) { changed.run(); return; }
        if (client.isReady()) { queryOwned(); queryProducts(null); return; }
        if (connecting) return;
        connecting = true;
        client.startConnection(new BillingClientStateListener() {
            public void onBillingSetupFinished(BillingResult result) {
                connecting = false;
                if (ok(result)) { queryOwned(); queryProducts(null); }
                else message.accept("Google Play is unavailable. You can keep using free transfers.");
            }
            public void onBillingServiceDisconnected() { connecting = false; }
        });
    }
    private boolean ok(BillingResult r) { return r.getResponseCode() == BillingClient.BillingResponseCode.OK; }
    private void queryOwned() {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (result, purchases) -> { if (ok(result)) applyPurchases(purchases); });
    }
    private boolean verified(Purchase p) {
        try {
            byte[] bytes = Base64.decode(BuildConfig.PLAY_PUBLIC_KEY, Base64.DEFAULT);
            Signature signature = Signature.getInstance("SHA1withRSA");
            signature.initVerify(KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(bytes)));
            signature.update(p.getOriginalJson().getBytes(StandardCharsets.UTF_8));
            return signature.verify(Base64.decode(p.getSignature(), Base64.DEFAULT));
        } catch (Exception e) { return false; }
    }
    private void applyPurchases(List<Purchase> purchases) {
        String next = "free";
        String token = null;
        for (Purchase p : purchases) {
            if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || p.isSuspended() || !verified(p)) continue;
            boolean pro = p.getProducts().contains(PRO);
            boolean plus = p.getProducts().contains(PLUS);
            if (!pro && !plus) continue;
            if (pro || next.equals("free")) { next = pro ? "pro" : "plus"; token = p.getPurchaseToken(); }
            if (!p.isAcknowledged()) client.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(),
                result -> { if (!ok(result)) message.accept("Purchase acknowledgement is pending. Reopen QRtransfer online to retry."); });
        }
        plan = next; oldToken = token; changed.run();
    }
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (ok(result)) queryOwned();
        else if (result.getResponseCode() != BillingClient.BillingResponseCode.USER_CANCELED)
            message.accept("Purchase could not be completed. Try Restore purchases or retry later.");
        else message.accept("Purchase cancelled. Your plan has not changed.");
    }
    void purchase(String product) {
        if (!PLUS.equals(product) && !PRO.equals(product)) return;
        if (BuildConfig.PLAY_PUBLIC_KEY.isEmpty() || !client.isReady()) {
            message.accept("Purchases are not available yet."); refresh(); return;
        }
        if ((PLUS.equals(product) && plan.equals("plus")) || (PRO.equals(product) && plan.equals("pro"))) {
            message.accept("You already have this plan."); return;
        }
        // Refresh ProductDetails for each checkout; Play warns against caching them.
        queryProducts(product);
    }
    private ProductDetails.SubscriptionOfferDetails monthly(ProductDetails p) {
        if (p.getSubscriptionOfferDetails() == null) return null;
        for (ProductDetails.SubscriptionOfferDetails o : p.getSubscriptionOfferDetails()) {
            if (!o.getBasePlanId().equals("monthly") || o.getOfferId() != null) continue;
            for (ProductDetails.PricingPhase phase : o.getPricingPhases().getPricingPhaseList())
                if (phase.getBillingPeriod().equals("P1M") && phase.getRecurrenceMode() == ProductDetails.RecurrenceMode.INFINITE_RECURRING) return o;
        }
        return null;
    }
    private void queryProducts(String checkout) {
        List<QueryProductDetailsParams.Product> requested = new ArrayList<>();
        for (String id : Arrays.asList(PLUS, PRO)) requested.add(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(id).setProductType(BillingClient.ProductType.SUBS).build());
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(requested).build(), (result, response) -> {
            if (!ok(result)) { message.accept("Unable to load subscription prices."); return; }
            JSONObject display = new JSONObject();
            ProductDetails selected = null;
            ProductDetails.SubscriptionOfferDetails offer = null;
            for (ProductDetails p : response.getProductDetailsList()) {
                ProductDetails.SubscriptionOfferDetails o = monthly(p);
                if (o == null) continue;
                try { display.put(p.getProductId(), o.getPricingPhases().getPricingPhaseList().get(0).getFormattedPrice()); }
                catch (Exception ignored) { }
                if (p.getProductId().equals(checkout)) { selected = p; offer = o; }
            }
            prices = display.toString(); changed.run();
            if (checkout == null) return;
            if (selected == null) { message.accept("This plan is not available in Google Play yet."); return; }
            BillingFlowParams.Builder flow = BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(selected).setOfferToken(offer.getOfferToken()).build()));
            if (oldToken != null) flow.setSubscriptionUpdateParams(BillingFlowParams.SubscriptionUpdateParams.newBuilder()
                .setOldPurchaseToken(oldToken)
                .setSubscriptionReplacementMode(BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.WITH_TIME_PRORATION).build());
            activity.runOnUiThread(() -> {
                BillingResult launched = client.launchBillingFlow(activity, flow.build());
                if (!ok(launched)) message.accept("Google Play could not open checkout.");
            });
        });
    }
    void close() { client.endConnection(); }
}
