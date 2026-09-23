package app.valence.tv.glass

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Offers JavaScript a view that draws a pane of glass behind whatever it holds. */
class ValenceGlassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceGlass")

    View(ValenceGlassView::class) {
      Prop("cornerRadius") { view: ValenceGlassView, radius: Float -> view.cornerRadius = radius }
    }
  }
}
