import ExpoModulesCore
import UIKit

/// Lifts what it holds the moment the television moves the remote onto it, in step with the system's
/// own focus animation, rather than once JavaScript has heard about the move and answered.
///
/// The lift is a transform on what it holds rather than on itself, so its frame, which React Native
/// sets, is never changed beneath it. A shadow, where asked for, is a layer of its own, kept beneath
/// whatever React Native puts in the view however it inserts it, drawn from a fixed outline — the
/// top of what it holds, down to the given height, so a card's picture casts it and not the words
/// beneath — which costs nothing to draw each frame. A row in a list grows from its
/// left edge rather than its middle, so its words stay in line with the rows around it.
final class ValenceFocusLiftView: ExpoView {
  var scale: CGFloat = 1.1
  var isAnchoredLeft = false
  var shadowHeight: CGFloat = 0 {
    didSet { setNeedsLayout() }
  }
  var cornerRadius: CGFloat = 0 {
    didSet { setNeedsLayout() }
  }

  private let shade = CALayer()
  private var isLifted = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    shade.shadowColor = UIColor.black.cgColor
    shade.shadowOpacity = 0
    shade.shadowRadius = 28
    shade.shadowOffset = CGSize(width: 0, height: 18)
    shade.zPosition = -1
    layer.insertSublayer(shade, at: 0)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    let outline = CGRect(x: 0, y: 0, width: bounds.width, height: min(shadowHeight, bounds.height))
    shade.frame = bounds
    shade.shadowPath = UIBezierPath(roundedRect: outline, cornerRadius: cornerRadius).cgPath
    CATransaction.commit()
  }

  override func didUpdateFocus(
    in context: UIFocusUpdateContext,
    with coordinator: UIFocusAnimationCoordinator
  ) {
    super.didUpdateFocus(in: context, with: coordinator)
    let isComing = context.nextFocusedView?.isDescendant(of: self) ?? false

    guard isComing != isLifted else { return }

    isLifted = isComing

    if isComing {
      coordinator.addCoordinatedFocusingAnimations({ animation in
        self.lift(to: self.scale, over: animation.duration)
      }, completion: nil)
    } else {
      coordinator.addCoordinatedUnfocusingAnimations({ animation in
        self.lift(to: 1, over: animation.duration)
      }, completion: nil)
    }
  }

  /// Moves what it holds to a size, and the shadow in or out with it, over the system's own time.
  private func lift(to size: CGFloat, over duration: TimeInterval) {
    let grown = CATransform3DMakeScale(size, size, 1)
    let target = isAnchoredLeft
      ? CATransform3DConcat(grown, CATransform3DMakeTranslation(bounds.width / 2 * (size - 1), 0, 0))
      : grown
    let grow = CABasicAnimation(keyPath: "sublayerTransform")
    grow.fromValue = layer.presentation()?.sublayerTransform ?? layer.sublayerTransform
    grow.toValue = target
    grow.duration = duration
    grow.timingFunction = CAMediaTimingFunction(name: .easeOut)
    layer.sublayerTransform = target
    layer.add(grow, forKey: "lift")

    guard shadowHeight > 0 else { return }

    let opacity: Float = size > 1 ? 0.55 : 0
    let fade = CABasicAnimation(keyPath: "shadowOpacity")
    fade.fromValue = shade.presentation()?.shadowOpacity ?? shade.shadowOpacity
    fade.toValue = opacity
    fade.duration = duration
    shade.shadowOpacity = opacity
    shade.add(fade, forKey: "shade")
  }
}
