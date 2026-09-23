package app.valence.tv.edgefade

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Offers JavaScript a view that fades what it holds out to nothing towards one edge. */
class ValenceEdgeFadeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceEdgeFade")

    View(ValenceEdgeFadeView::class) {
      Prop("edge") { view: ValenceEdgeFadeView, edge: String -> view.edge = edge }
      Prop("reach") { view: ValenceEdgeFadeView, reach: Float -> view.reach = reach }
    }
  }
}
