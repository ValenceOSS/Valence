import ExpoModulesCore

/// Offers JavaScript a view that keeps the remote out of whatever it holds while it is shut.
public class ValenceFocusFenceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceFocusFence")

    View(ValenceFocusFenceView.self) {
      Prop("isShut") { (view: ValenceFocusFenceView, isShut: Bool) in
        view.isShut = isShut
      }
    }
  }
}
