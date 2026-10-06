package app.valence.modules.fadededges

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** A view whose contents fade out at its leading and trailing edges, or at its top and bottom. */
class ValenceFadedEdgesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceFadedEdges")

    View(ValenceFadedEdgesView::class) {
      Prop("leading") { view: ValenceFadedEdgesView, points: Double ->
        view.leading = points
      }

      Prop("trailing") { view: ValenceFadedEdgesView, points: Double ->
        view.trailing = points
      }

      Prop("isUpright") { view: ValenceFadedEdgesView, isUpright: Boolean ->
        view.isUpright = isUpright
      }
    }
  }
}
