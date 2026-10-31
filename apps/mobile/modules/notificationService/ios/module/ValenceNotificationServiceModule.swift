import ExpoModulesCore

/// Hands the notification service extension the server the phone is signed in to and the session it
/// holds there, so the extension can read what a push woke the phone to say.
public class ValenceNotificationServiceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceNotificationService")

    Function("shareSignIn") { (address: String, cookie: String) -> Bool in
      SharedSignIn.write(SharedSignIn.Held(address: address, cookie: cookie))
    }

    Function("forgetSignIn") {
      SharedSignIn.forget()
    }
  }
}
