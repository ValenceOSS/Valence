import ExpoModulesCore
import UIKit

/// A view whose contents fade out at its leading and trailing edges.
///
/// A row that scrolls sideways fades out where it runs under whatever sits
/// beside it, rather than being cut off square. The fade has to be of the
/// contents themselves — glass, pictures and all — not a colour painted over
/// them, so it is a gradient used as the view's mask: opaque across the middle
/// and clear at either edge, over as many points as asked.
public class ValenceFadedEdgesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceFadedEdges")

    View(ValenceFadedEdgesView.self) {
      Prop("leading") { (view: ValenceFadedEdgesView, points: Double) in
        view.leading = points
      }

      Prop("trailing") { (view: ValenceFadedEdgesView, points: Double) in
        view.trailing = points
      }
    }
  }
}

/// Holds whatever React Native puts inside it, masked by a sideways gradient.
///
/// The mask is laid on again at every layout, because React Native clears a view's mask when it
/// updates the view, and a mask set once would be gone after the first update.
public class ValenceFadedEdgesView: ExpoView {
  private let fade = CAGradientLayer()

  var leading: Double = 0 {
    didSet {
      setNeedsLayout()
    }
  }

  var trailing: Double = 0 {
    didSet {
      setNeedsLayout()
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    fade.startPoint = CGPoint(x: 0, y: 0.5)
    fade.endPoint = CGPoint(x: 1, y: 0.5)
    fade.colors = [
      UIColor.clear.cgColor,
      UIColor.black.cgColor,
      UIColor.black.cgColor,
      UIColor.clear.cgColor,
    ]
    layer.mask = fade
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    let width = max(Double(bounds.width), 1)
    let start = min(leading / width, 0.5)
    let end = max(1 - trailing / width, 0.5)

    CATransaction.begin()
    CATransaction.setDisableActions(true)

    if layer.mask !== fade {
      layer.mask = fade
    }

    fade.frame = bounds
    fade.locations = [0, NSNumber(value: start), NSNumber(value: end), 1]
    CATransaction.commit()
  }
}
