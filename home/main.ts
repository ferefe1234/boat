import "../shared/app";
// Home page script: init the locale layer, then wire the share dialog.
import { initI18n } from "../shared/i18n";
import { wireShareDialog } from "../shared/share-dialog";

await initI18n();

document.getElementById("share-open")?.addEventListener("click", wireShareDialog());
