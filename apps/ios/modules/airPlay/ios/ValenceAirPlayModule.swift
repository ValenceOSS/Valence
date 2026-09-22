import AVKit
import ExpoModulesCore

/// The system's AirPlay picker: pressed, it lists the speakers and screens
/// nearby, and whatever plays afterwards follows the one chosen.
///
/// It is the system's own button, icon and sheet, so it looks and behaves as
/// AirPlay does everywhere else on the phone.
public class ValenceAirPlayModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceAirPlay")

    View(ValenceAirPlayView.self) {
      Prop("colour") { (view: ValenceAirPlayView, colour: UIColor) in
        view.picker.tintColor = colour
      }

      Prop("activeColour") { (view: ValenceAirPlayView, colour: UIColor) in
        view.picker.activeTintColor = colour
      }
    }
  }
}

/// Holds an `AVRoutePickerView` the size of the view, preferring screens.
public class ValenceAirPlayView: ExpoView {
  let picker = AVRoutePickerView()

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    picker.prioritizesVideoDevices = true
    addSubview(picker)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    picker.frame = bounds
  }
}
