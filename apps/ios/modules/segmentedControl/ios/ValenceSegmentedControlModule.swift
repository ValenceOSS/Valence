import ExpoModulesCore
import UIKit

/// The system's own segmented control, for a choice of a few.
///
/// A choice of two or three — what to show, how large to set the words — is
/// drawn by iOS the same way in every app, and from iOS 26 on liquid glass that
/// slides between the choices under a finger. This is that control and nothing
/// more: it shows the choices it is given, marks the one it is told is picked,
/// and says which somebody picked. Its words are set in the app's own typeface.
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

/// A segmented control filling its bounds, saying which segment was chosen.
public class ValenceSegmentedControlView: ExpoView {
  let onChoose = EventDispatcher()

  private let control = UISegmentedControl()

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
    }
  }

  var picked: Int = -1 {
    didSet {
      showPicked()
    }
  }

  var isDark = true {
    didSet {
      overrideUserInterfaceStyle = isDark ? .dark : .light
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    let typeface =
      UIFont(name: "Gilroy-Semibold", size: 14) ?? .systemFont(ofSize: 14, weight: .semibold)

    control.setTitleTextAttributes([.font: typeface], for: .normal)
    control.setTitleTextAttributes([.font: typeface], for: .selected)
    control.addTarget(self, action: #selector(chose), for: .valueChanged)
    overrideUserInterfaceStyle = .dark
    addSubview(control)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    control.frame = bounds
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
