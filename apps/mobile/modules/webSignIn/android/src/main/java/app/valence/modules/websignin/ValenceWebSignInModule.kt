package app.valence.modules.websignin

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Opens a page of the Valence web client in a Chrome Custom Tab over the app, which is Android's
 * own browser sheet.
 *
 * A passkey belongs to a website, and an app may only use one for a website that vouches for that
 * app's signing certificate. A server at an address of its owner's choosing does not know the app's,
 * so the tab — which is the website — asks for the passkey instead, as the sheet does on an iPhone.
 *
 * Only the opening is done here. The page ends by sending the tab to `valence://`, which Android
 * hands back to the app as a link, and the app listens for that itself.
 */
class ValenceWebSignInModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceWebSignIn")

    AsyncFunction("openInATab") { address: String, promise: Promise ->
      val activity = appContext.currentActivity

      if (activity == null) {
        promise.reject("ERR_WEB_SIGN_IN", "There is nothing to open the tab over.", null)
        return@AsyncFunction
      }

      activity.runOnUiThread {
        runCatching {
          CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
            .launchUrl(activity, Uri.parse(address))
        }
          .onSuccess { promise.resolve(null) }
          .onFailure { promise.reject("ERR_WEB_SIGN_IN", it.message ?: "The tab would not open.", it) }
      }
    }
  }
}
