import ExpoModulesCore

/// Offers JavaScript a view that draws Liquid Glass behind what it holds.
public class ValenceGlassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceGlass")

    View(ValenceGlassView.self) {
      Prop("cornerRadius") { (view: ValenceGlassView, cornerRadius: Double) in
        view.cornerRadius = CGFloat(cornerRadius)
      }
    }
  }
}
