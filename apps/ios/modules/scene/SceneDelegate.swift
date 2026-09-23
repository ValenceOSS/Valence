import React
import UIKit

/// The window this application draws into, made by the system rather than by the application.
///
/// iOS 27 refuses to run an application that has not adopted the scene lifecycle: it starts the
/// process, finds no `UIWindowSceneDelegate`, and kills it before any JavaScript runs. React Native
/// still builds its window in `didFinishLaunchingWithOptions`, which is the old way and no longer
/// allowed, so the window is made here instead and handed to the same factory.
///
/// Declaring the manifest alone does not satisfy the check. There has to be a delegate, and it has
/// to be the thing that owns the window.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let application = UIApplication.shared.delegate as? AppDelegate
    else {
      return
    }

    let made = UIWindow(windowScene: windowScene)

    window = made
    application.window = made
    application.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: made,
      launchOptions: application.launchedWith
    )
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    guard let context = contexts.first else {
      return
    }

    RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
