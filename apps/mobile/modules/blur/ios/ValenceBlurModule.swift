import ExpoModulesCore
import UIKit

public class ValenceBlurModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceBlur")

    View(ValenceBlurView.self) {
      Prop("isDark") { (view: ValenceBlurView, isDark: Bool) in
        view.isDark = isDark
      }

      Prop("isOn") { (view: ValenceBlurView, isOn: Bool) in
        view.isOn = isOn
      }

      Prop("changesOver") { (view: ValenceBlurView, seconds: Double) in
        view.changesOver = seconds
      }
    }
  }
}

/// The system's blur over everything behind it, evenly, dark or light to match the page — for a
/// picture that should colour a page rather be looked at.
///
/// It comes and goes by animating the blur itself rather than fading the view, since a blur that is
/// faded draws wrongly until it is fully there and then snaps into place.
public class ValenceBlurView: ExpoView {
  private let blur = UIVisualEffectView(effect: nil)

  var isDark = true {
    didSet {
      show(animated: false)
    }
  }

  var isOn = false {
    didSet {
      show(animated: oldValue != isOn)
    }
  }

  var changesOver = 0.9

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    isUserInteractionEnabled = false
    addSubview(blur)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    blur.frame = bounds
  }

  /// Sets the blur to what it should be, over time where it is coming or going.
  private func show(animated: Bool) {
    let wanted = isOn ? UIBlurEffect(style: isDark ? .regular : .light) : nil

    guard animated else {
      blur.effect = wanted
      return
    }

    UIView.animate(withDuration: changesOver, delay: 0, options: [.curveEaseInOut]) {
      self.blur.effect = wanted
    }
  }
}
