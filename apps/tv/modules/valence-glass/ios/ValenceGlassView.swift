import ExpoModulesCore
import UIKit

/// Draws the system's Liquid Glass behind whatever it holds — refracting and tinting what lies behind
/// it and catching the light along its edge — where the television has it, from tvOS 26, and Apple's
/// dark frosted blur where it does not. The glass is kept beneath the views React Native puts in, and
/// rounded to the given radius, or into a capsule where the radius is more than half its height.
final class ValenceGlassView: ExpoView {
  var cornerRadius: CGFloat = 0 {
    didSet { setNeedsLayout() }
  }

  private let glass: UIVisualEffectView = {
    if #available(tvOS 26.0, iOS 26.0, *) {
      return UIVisualEffectView(effect: UIGlassEffect())
    }

    return UIVisualEffectView(effect: UIBlurEffect(style: .dark))
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    glass.isUserInteractionEnabled = false
    glass.clipsToBounds = true
    glass.layer.zPosition = -1
    addSubview(glass)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    glass.frame = bounds
    glass.layer.cornerRadius = min(cornerRadius, bounds.height / 2)
    glass.layer.cornerCurve = .continuous
  }
}
