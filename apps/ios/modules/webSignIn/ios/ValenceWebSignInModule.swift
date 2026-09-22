import AuthenticationServices
import ExpoModulesCore

/// Signs somebody in on the Valence web page, in the system's browser sheet, and brings back the
/// address that page sends the sheet to.
///
/// A passkey belongs to a website, and an app may only use one for a website that names it in an
/// associated domains file. A server at an address of its owner's choosing has no way to name an
/// app it has never heard of, so the app cannot ask for the passkey itself. The browser sheet is
/// the website, so it can.
///
/// The sheet is private: it neither reads nor keeps the cookies Safari has, so what it hands back
/// is somebody signing in now rather than whoever Safari last remembered.
///
/// Whatever answers to `valence://` ends the sheet and is resolved with, and closing the sheet is
/// resolved with nothing rather than rejected, because nobody who changed their mind wants an
/// error for it.
public class ValenceWebSignInModule: Module {
  private var signingIn: ASWebAuthenticationSession?
  private let theWindow = TheWindow()

  public func definition() -> ModuleDefinition {
    Name("ValenceWebSignIn")

    AsyncFunction("signInOnTheWeb") { (address: URL, promise: Promise) in
      self.signingIn?.cancel()

      let session = ASWebAuthenticationSession(
        url: address,
        callback: .customScheme("valence")
      ) { [weak self] came, error in
        self?.signingIn = nil

        if let came {
          promise.resolve(came.absoluteString)

          return
        }

        if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
          promise.resolve(nil)

          return
        }

        promise.reject("ERR_WEB_SIGN_IN", error?.localizedDescription ?? "The sheet closed.")
      }

      session.prefersEphemeralWebBrowserSession = true
      session.presentationContextProvider = self.theWindow
      self.signingIn = session

      if !session.start() {
        self.signingIn = nil
        promise.reject("ERR_WEB_SIGN_IN", "The sheet would not open.")
      }
    }.runOnQueue(.main)
  }
}

/// Tells the browser sheet which window to rise over, which is whichever one somebody is looking at.
private final class TheWindow: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow) ?? ASPresentationAnchor()
  }
}
