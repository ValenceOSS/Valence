package app.valence.modules.notificationservice

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Hands the messaging service the server the phone is signed in to and the session it holds there,
 * so it can read what a push woke the phone to say, as the Apple side hands them to its
 * notification service extension.
 */
class ValenceNotificationServiceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceNotificationService")

    Function("shareSignIn") { address: String, cookie: String ->
      val context = appContext.reactContext ?: return@Function false

      SharedSignIn.write(context, SharedSignIn.Held(address, cookie))
    }

    Function("forgetSignIn") {
      appContext.reactContext?.let { SharedSignIn.forget(it) }
    }
  }
}
