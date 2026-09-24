import ExpoModulesCore
import UIKit

/// The system's liquid glass, laid behind a control React Native draws.
///
/// On iOS 26 the system's controls sit on glass that bends and tints what is
/// behind it, which only UIKit makes. This is that glass and nothing else, the
/// size of whatever holds it and rounded to match; the control's words and
/// icons are drawn over it by React Native. Taking no touches, it leaves the
/// press to the control above it.
///
/// Where the phone has no liquid glass it is a thin blur, though a client asks
/// for it only where the phone does.
public class ValenceGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceGlass")

    View(ValenceGlassView.self) {
      Prop("tint") { (view: ValenceGlassView, tint: UIColor?) in
        view.tint = tint
      }

      Prop("roundness") { (view: ValenceGlassView, roundness: Double) in
        view.roundness = roundness
      }

      Prop("isShown") { (view: ValenceGlassView, isShown: Bool?) in
        view.isShown = isShown ?? true
      }
    }
  }
}

/// Glass, tinted where asked, filling its bounds with rounded corners.
public class ValenceGlassView: ExpoView {
  private let surface = UIVisualEffectView()

  var tint: UIColor? {
    didSet {
      applyTheGlass()
    }
  }

  /// Whether the glass is there. It comes and goes by easing its own effect in and out, since glass
  /// drawn under a layer that is being faded does not render at all.
  var isShown = true {
    didSet {
      guard isShown != oldValue else {
        return
      }

      UIView.animate(withDuration: 0.26) {
        self.applyTheGlass()
      }
    }
  }

  var roundness: Double = 0 {
    didSet {
      setNeedsLayout()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    isUserInteractionEnabled = false
    surface.clipsToBounds = true
    addSubview(surface)
    applyTheGlass()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    surface.frame = bounds
    surface.layer.cornerRadius = min(roundness, Double(bounds.height) / 2)
  }

  private func applyTheGlass() {
    guard isShown else {
      surface.effect = nil

      return
    }

    if #available(iOS 26.0, *) {
      let glass = UIGlassEffect()

      glass.tintColor = tint
      surface.effect = glass

      return
    }

    surface.effect = UIBlurEffect(style: .systemThinMaterial)
  }
}
