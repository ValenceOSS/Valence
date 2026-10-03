import ExpoModulesCore
import Foundation

/// Reads the cookies this phone would send a server, from the cookie storage `fetch` keeps them in.
///
/// Requests made through the system's networking read that storage themselves. An `AVURLAsset`, a
/// socket and an upload are not told to, so they are handed what it holds as one `Cookie` header.
public class ValenceCookiesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceCookies")

    AsyncFunction("cookieHeaderFor") { (address: URL) -> String? in
      let held = HTTPCookieStorage.shared.cookies(for: address) ?? []

      return held.isEmpty ? nil : HTTPCookie.requestHeaderFields(with: held)["Cookie"]
    }
  }
}
