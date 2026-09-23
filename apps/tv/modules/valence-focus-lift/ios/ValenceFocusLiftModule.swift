import ExpoModulesCore

/// Offers JavaScript a view that lifts what it holds as the remote lands on it.
public class ValenceFocusLiftModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceFocusLift")

    View(ValenceFocusLiftView.self) {
      Prop("scale") { (view: ValenceFocusLiftView, scale: Double) in
        view.scale = CGFloat(scale)
      }

      Prop("shadowHeight") { (view: ValenceFocusLiftView, height: Double) in
        view.shadowHeight = CGFloat(height)
      }

      Prop("isAnchoredLeft") { (view: ValenceFocusLiftView, isAnchoredLeft: Bool) in
        view.isAnchoredLeft = isAnchoredLeft
      }

      Prop("cornerRadius") { (view: ValenceFocusLiftView, cornerRadius: Double) in
        view.cornerRadius = CGFloat(cornerRadius)
      }
    }
  }
}
