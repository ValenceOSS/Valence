import AVFoundation
import AVKit
import ExpoModulesCore

/// The system's AirPlay picker: pressed, it lists the speakers and screens
/// nearby, and whatever plays afterwards follows the one chosen.
///
/// It is the system's own button, icon and sheet, so it looks and behaves as
/// AirPlay does everywhere else on the phone. While something is playing over
/// AirPlay it is drawn as every other button that is on: in a circle of its
/// colour, the icon cut out of it in its active colour.
public class ValenceAirPlayModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceAirPlay")

    View(ValenceAirPlayView.self) {
      Prop("colour") { (view: ValenceAirPlayView, colour: UIColor) in
        view.picker.tintColor = colour
        view.lit.backgroundColor = colour
      }

      Prop("activeColour") { (view: ValenceAirPlayView, colour: UIColor) in
        view.picker.activeTintColor = colour
      }
    }
  }
}

/// Holds an `AVRoutePickerView` the size of the view, preferring screens, over
/// a circle shown while the sound is going out over AirPlay.
public class ValenceAirPlayView: ExpoView {
  let picker = AVRoutePickerView()

  let lit = UIView()

  private var routing: NSObjectProtocol?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    picker.prioritizesVideoDevices = true
    lit.isUserInteractionEnabled = false
    addSubview(lit)
    addSubview(picker)
    showWhereItPlays()

    routing = NotificationCenter.default.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.showWhereItPlays()
    }
  }

  deinit {
    if let routing {
      NotificationCenter.default.removeObserver(routing)
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    picker.frame = bounds
    lit.frame = bounds
    lit.layer.cornerRadius = min(bounds.width, bounds.height) / 2
  }

  /// Shows the circle while the sound is going out over AirPlay, and hides it otherwise.
  private func showWhereItPlays() {
    let isAway = AVAudioSession.sharedInstance().currentRoute.outputs.contains {
      $0.portType == .airPlay
    }

    UIView.animate(withDuration: 0.2) {
      self.lit.alpha = isAway ? 1 : 0
    }
  }
}
