import CarPlay
internal import ValenceCarPlay

/// A window with no scene, holding React Native started for a car while the phone shows nothing.
private var heldForTheCar: UIWindow?

/// The car's screen, made by the system when the phone connects to CarPlay.
///
/// A car can open the application before anybody has on the phone, and then no JavaScript is
/// running to say what music there is. React Native is started into a window nobody sees, and let
/// go once the phone makes its own, which starts it again on the same JavaScript. What the car
/// draws is the CarPlay module's; this only tells it when a car comes and goes.
class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
  func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didConnect interfaceController: CPInterfaceController
  ) {
    startReactNativeUnseen()
    ValenceCarPlayCentre.shared.connected(interfaceController)
  }

  func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didDisconnectInterfaceController interfaceController: CPInterfaceController
  ) {
    ValenceCarPlayCentre.shared.disconnected()
  }

  /// Starts React Native with nothing on the phone to show it, unless the phone already does.
  private func startReactNativeUnseen() {
    let phoneIsShowing = UIApplication.shared.connectedScenes.contains { $0 is UIWindowScene }

    guard !phoneIsShowing, heldForTheCar == nil,
      let application = UIApplication.shared.delegate as? AppDelegate,
      let factory = application.reactNativeFactory
    else {
      return
    }

    let holding = UIWindow(frame: UIScreen.main.bounds)

    heldForTheCar = holding
    factory.startReactNative(withModuleName: application.reactNativeFactoryModuleName, in: holding, launchOptions: nil)

    NotificationCenter.default.addObserver(
      forName: UIScene.willConnectNotification,
      object: nil,
      queue: .main
    ) { note in
      guard note.object is UIWindowScene else {
        return
      }

      heldForTheCar?.rootViewController = nil
      heldForTheCar = nil
    }
  }
}
