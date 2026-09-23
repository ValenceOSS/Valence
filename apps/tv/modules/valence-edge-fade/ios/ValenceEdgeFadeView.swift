import ExpoModulesCore
import UIKit

/// A layer that keeps the mask it is given to hold, since React Native clears every view's mask
/// whenever it refreshes how the view looks.
final class MaskKeepingLayer: CALayer {
  var kept: CALayer?

  override var mask: CALayer? {
    get { super.mask }
    set { super.mask = newValue ?? kept }
  }
}

/// Fades what it holds from nothing at one edge to whole at a share of the way across, so a picture
/// melts into whatever is behind it instead of into a painted colour.
final class ValenceEdgeFadeView: ExpoView {
  var edge = "left" {
    didSet { setNeedsLayout() }
  }
  var reach: CGFloat = 0.5 {
    didSet { setNeedsLayout() }
  }

  private let fade = CAGradientLayer()

  override class var layerClass: AnyClass { MaskKeepingLayer.self }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    fade.colors = [UIColor.clear.cgColor, UIColor.black.cgColor]
    (layer as? MaskKeepingLayer)?.kept = fade
    layer.mask = fade
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    fade.frame = bounds
    fade.locations = [0, NSNumber(value: Double(reach))]

    switch edge {
    case "bottom":
      fade.startPoint = CGPoint(x: 0.5, y: 1)
      fade.endPoint = CGPoint(x: 0.5, y: 0)
    case "right":
      fade.startPoint = CGPoint(x: 1, y: 0.5)
      fade.endPoint = CGPoint(x: 0, y: 0.5)
    case "top":
      fade.startPoint = CGPoint(x: 0.5, y: 0)
      fade.endPoint = CGPoint(x: 0.5, y: 1)
    default:
      fade.startPoint = CGPoint(x: 0, y: 0.5)
      fade.endPoint = CGPoint(x: 1, y: 0.5)
    }

    CATransaction.commit()
  }
}
