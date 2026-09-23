import ExpoModulesCore

/// Offers JavaScript a view that fades what it holds out towards one of its edges.
public class ValenceEdgeFadeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ValenceEdgeFade")

    View(ValenceEdgeFadeView.self) {
      Prop("edge") { (view: ValenceEdgeFadeView, edge: String) in
        view.edge = edge
      }

      Prop("reach") { (view: ValenceEdgeFadeView, reach: Double) in
        view.reach = CGFloat(reach)
      }
    }
  }
}
