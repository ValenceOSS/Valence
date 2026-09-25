import CoreImage
import ExpoModulesCore
import UIKit

public class ValenceSoftFocusModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceSoftFocus")

    View(ValenceSoftFocusView.self) {
      Prop("radius") { (view: ValenceSoftFocusView, radius: Double) in
        view.radius = radius
      }
    }
  }
}

/// Whatever React Native puts inside it, out of focus by as much as asked, as
/// the web blurs a line of words with a CSS filter.
///
/// iOS has no public way to blur a view by itself, so the contents are drawn
/// into a picture, the picture is blurred, and it is shown in their place while
/// they are hidden. Only the drawing happens on the main thread; the blurring
/// happens away from it, at a single point to a pixel since a blurred picture
/// has no detail to lose, so a page of words opening all at once does not hold
/// the phone up. Changing how blurred it is cross-fades from one to the next.
public class ValenceSoftFocusView: ExpoView {
  private static let blurring = CIContext()

  private static let work = DispatchQueue(label: "app.valence.softFocus", qos: .userInitiated)

  private let blurred = CALayer()

  private var drawnAt: CGSize = .zero

  private var asked = 0

  var radius: Double = 0 {
    didSet {
      if oldValue != radius {
        refocus()
      }
    }
  }

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    clipsToBounds = false
    blurred.zPosition = 1
    blurred.isHidden = true
    layer.addSublayer(blurred)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()

    if bounds.size != drawnAt {
      drawnAt = bounds.size
      refocus()
    }
  }

  public override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)

    drawnAt = .zero
    setNeedsLayout()
  }

  public override func willRemoveSubview(_ subview: UIView) {
    super.willRemoveSubview(subview)

    subview.layer.isHidden = false
  }

  /// Shows the contents sharp, or starts a blurred picture of them on its way to replace them.
  private func refocus() {
    asked += 1

    let sharp = subviews
    let fades = window != nil

    guard radius > 0.1, bounds.width > 0, bounds.height > 0, let flat = picture(of: sharp) else {
      show(nil, over: sharp, fades: fades)

      return
    }

    if blurred.contents == nil {
      sharp.forEach { $0.layer.isHidden = true }
    }

    let mine = asked
    let radius = radius

    ValenceSoftFocusView.work.async { [weak self] in
      let spread = radius * 3
      let input = CIImage(cgImage: flat)
      let output = input
        .applyingGaussianBlur(sigma: radius)
        .cropped(to: input.extent.insetBy(dx: -spread, dy: -spread))
      let made = ValenceSoftFocusView.blurring.createCGImage(output, from: output.extent)

      DispatchQueue.main.async {
        guard let self, self.asked == mine, let made else {
          return
        }

        self.show((made, spread), over: self.subviews, fades: fades)
      }
    }
  }

  /// Puts a blurred picture in place of the contents, or the contents back where there is none.
  private func show(_ picture: (CGImage, Double)?, over sharp: [UIView], fades: Bool) {
    if fades {
      let fade = CATransition()

      fade.type = .fade
      fade.duration = 0.4
      layer.add(fade, forKey: "focus")
    }

    CATransaction.begin()
    CATransaction.setDisableActions(true)

    if let (made, spread) = picture {
      blurred.frame = bounds.insetBy(dx: -spread, dy: -spread)
      blurred.contents = made
      blurred.isHidden = false
      sharp.forEach { $0.layer.isHidden = true }
    } else {
      blurred.isHidden = true
      blurred.contents = nil
      sharp.forEach { $0.layer.isHidden = false }
    }

    CATransaction.commit()
  }

  /// Draws the contents at a single pixel to a point, hidden or not.
  private func picture(of sharp: [UIView]) -> CGImage? {
    let format = UIGraphicsImageRendererFormat()

    format.scale = 1
    format.opaque = false

    let drawn = UIGraphicsImageRenderer(bounds: bounds, format: format).image { context in
      sharp.forEach { view in
        let wasHidden = view.layer.isHidden

        view.layer.isHidden = false
        view.layoutIfNeeded()
        ready(view.layer)
        context.cgContext.saveGState()
        context.cgContext.translateBy(x: view.frame.minX, y: view.frame.minY)
        view.layer.render(in: context.cgContext)
        context.cgContext.restoreGState()
        view.layer.isHidden = wasHidden
      }
    }

    return drawn.cgImage
  }

  /// Has a layer and everything in it draw what it has yet to, so the picture is not taken blank.
  private func ready(_ layer: CALayer) {
    layer.displayIfNeeded()
    layer.sublayers?.forEach(ready)
  }
}
