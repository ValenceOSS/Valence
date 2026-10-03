package app.valence.modules.cookies

import android.webkit.CookieManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reads the cookies this phone would send a server, from the system's cookie manager, which React
 * Native's networking keeps them in.
 *
 * Requests made through that networking read the manager themselves. The player, a socket and an
 * upload are not told to, so they are handed what it holds as one `Cookie` header.
 */
class ValenceCookiesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceCookies")

    AsyncFunction("cookieHeaderFor") { address: String ->
      CookieManager.getInstance().getCookie(address)?.takeIf { it.isNotBlank() }
    }
  }
}
