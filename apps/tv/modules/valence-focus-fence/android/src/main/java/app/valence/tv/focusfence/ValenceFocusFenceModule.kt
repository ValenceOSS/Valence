package app.valence.tv.focusfence

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Offers JavaScript a view that keeps the remote out of whatever it holds while it is shut. */
class ValenceFocusFenceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceFocusFence")

    View(ValenceFocusFenceView::class) {
      Prop("isShut") { view: ValenceFocusFenceView, isShut: Boolean ->
        view.isShut = isShut
      }
    }
  }
}
