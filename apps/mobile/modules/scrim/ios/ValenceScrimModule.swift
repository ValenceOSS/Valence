import ExpoModulesCore
import UIKit

/// The darkening and blur the web lays over artwork so that words can sit on it.
///
/// Two gradients, as the web's scrim draws them: one rising from the foot, from nearly black to
/// clear by seven tenths of the way up, and one coming in from the leading edge, where the words
/// begin. Beneath them a blur that is whole at the foot and fades out as it rises, which is the
/// blur the system's own apps put under a title — made by masking a blur with a gradient, since
/// nothing lets a blur's strength itself vary.
public class ValenceScrimModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceScrim")

    View(ValenceScrimView.self) {
      Prop("blurReach") { (view: ValenceScrimView, reach: Double) in
        view.blurReach = reach
      }
    }
  }
}

/// Lays the blur and both gradients over whatever is behind it, and takes no touches.
public class ValenceScrimView: ExpoView {
  private let blur = UIVisualEffectView(effect: UIBlurEffect(style: .dark))
  private let blurShape = UIView()
  private let blurGradient = CAGradientLayer()
  private let rising = CAGradientLayer()
  private let leading = CAGradientLayer()

  var blurReach: Double = 0.45 {
    didSet {
      shapeTheBlur()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    isUserInteractionEnabled = false
    clipsToBounds = true

    blurShape.layer.addSublayer(blurGradient)
    blur.mask = blurShape
    addSubview(blur)

    rising.colors = [
      UIColor.black.withAlphaComponent(0.82).cgColor,
      UIColor.black.withAlphaComponent(0.4).cgColor,
      UIColor.clear.cgColor,
    ]
    rising.locations = [0, 0.38, 0.72]
    rising.startPoint = CGPoint(x: 0.5, y: 1)
    rising.endPoint = CGPoint(x: 0.5, y: 0)
    layer.addSublayer(rising)

    leading.colors = [
      UIColor.black.withAlphaComponent(0.7).cgColor,
      UIColor.black.withAlphaComponent(0.15).cgColor,
      UIColor.clear.cgColor,
    ]
    leading.locations = [0, 0.45, 0.7]
    leading.startPoint = CGPoint(x: 0, y: 0.5)
    leading.endPoint = CGPoint(x: 1, y: 0.5)
    layer.addSublayer(leading)

    shapeTheBlur()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    blur.frame = bounds
    blurShape.frame = bounds
    blurGradient.frame = bounds
    rising.frame = bounds
    leading.frame = bounds
    CATransaction.commit()
  }

  private func shapeTheBlur() {
    let reach = NSNumber(value: min(max(blurReach, 0), 1))

    blurGradient.colors = [UIColor.black.cgColor, UIColor.black.cgColor, UIColor.clear.cgColor]
    blurGradient.locations = [0, NSNumber(value: reach.doubleValue * 0.4), reach]
    blurGradient.startPoint = CGPoint(x: 0.5, y: 1)
    blurGradient.endPoint = CGPoint(x: 0.5, y: 0)
  }
}
