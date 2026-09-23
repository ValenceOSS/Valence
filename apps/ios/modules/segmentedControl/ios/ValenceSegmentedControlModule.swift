import ExpoModulesCore
import UIKit

private let SEGMENT_ROOM: CGFloat = 32

/// The system's own segmented control, for every choice of one out of several.
///
/// A choice like what to show or how large to set the words is drawn by iOS the
/// same way in every app, and from iOS 26 on liquid glass that slides between
/// the choices under a finger. This is that control: it shows the choices it is
/// given, marks the one it is told is picked, and says which somebody picked —
/// the one already picked too, so a choice that can be put down again, such as a
/// filter, can be. Where the choices are wider than the room, it scrolls across
/// them, each as wide as its words. Its words are set in the app's typeface.
public class ValenceSegmentedControlModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceSegmentedControl")

    View(ValenceSegmentedControlView.self) {
      Events("onChoose")

      Prop("labels") { (view: ValenceSegmentedControlView, labels: [String]) in
        view.labels = labels
      }

      Prop("picked") { (view: ValenceSegmentedControlView, picked: Int) in
        view.picked = picked
      }

      Prop("isDark") { (view: ValenceSegmentedControlView, isDark: Bool) in
        view.isDark = isDark
      }
    }
  }
}

/// A segmented control that also says when the segment already picked is tapped.
final class ReselectingSegmentedControl: UISegmentedControl {
  var onReselect: ((Int) -> Void)?

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    let before = selectedSegmentIndex

    super.touchesEnded(touches, with: event)

    if before != UISegmentedControl.noSegment && before == selectedSegmentIndex {
      onReselect?(before)
    }
  }
}

/// A segmented control filling its bounds, or scrolling across them where it is
/// wider, saying which segment was chosen.
public class ValenceSegmentedControlView: ExpoView {
  let onChoose = EventDispatcher()

  private let across = UIScrollView()

  private let control = ReselectingSegmentedControl()

  var labels: [String] = [] {
    didSet {
      guard labels != oldValue else {
        return
      }

      control.removeAllSegments()

      for (at, label) in labels.enumerated() {
        control.insertSegment(withTitle: label, at: at, animated: false)
      }

      showPicked()
      setNeedsLayout()
    }
  }

  var picked: Int = -1 {
    didSet {
      showPicked()
      setNeedsLayout()
    }
  }

  var isDark = true {
    didSet {
      overrideUserInterfaceStyle = isDark ? .dark : .light
    }
  }

  private let typeface =
    UIFont(name: "Gilroy-Semibold", size: 14) ?? .systemFont(ofSize: 14, weight: .semibold)

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    control.setTitleTextAttributes([.font: typeface], for: .normal)
    control.setTitleTextAttributes([.font: typeface], for: .selected)
    control.addTarget(self, action: #selector(chose), for: .valueChanged)
    control.onReselect = { [weak self] index in
      self?.onChoose(["index": index])
    }
    overrideUserInterfaceStyle = .dark
    across.showsHorizontalScrollIndicator = false
    across.clipsToBounds = false
    across.addSubview(control)
    addSubview(across)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    across.frame = bounds

    let widths = labels.map(widthOf)
    let wanted = widths.reduce(0, +)
    let isWider = wanted > bounds.width

    for (at, width) in widths.enumerated() {
      control.setWidth(isWider ? width : 0, forSegmentAt: at)
    }

    control.frame = CGRect(x: 0, y: 0, width: isWider ? wanted : bounds.width, height: bounds.height)
    across.contentSize = control.frame.size
    across.isScrollEnabled = isWider
    showThePicked(widths)
  }

  /// How wide a segment is drawn where the choices are wider than the room: its words, and room either side.
  private func widthOf(_ label: String) -> CGFloat {
    ceil((label as NSString).size(withAttributes: [.font: typeface]).width) + SEGMENT_ROOM
  }

  /// Scrolls the segment picked into view, with a little of those beside it, where the control scrolls.
  private func showThePicked(_ widths: [CGFloat]) {
    guard across.isScrollEnabled, picked >= 0, picked < widths.count else {
      return
    }

    let start = widths[0..<picked].reduce(0, +)
    let shown = CGRect(x: start, y: 0, width: widths[picked], height: bounds.height)

    across.scrollRectToVisible(shown.insetBy(dx: -SEGMENT_ROOM, dy: 0), animated: true)
  }

  /// Marks the segment it is told is picked, or none where that is not one of them.
  private func showPicked() {
    control.selectedSegmentIndex =
      picked >= 0 && picked < labels.count ? picked : UISegmentedControl.noSegment
  }

  /// Says which segment somebody picked, and marks the one it was told until it is told again.
  @objc private func chose() {
    let chosen = control.selectedSegmentIndex

    showPicked()
    onChoose(["index": chosen])
  }
}
