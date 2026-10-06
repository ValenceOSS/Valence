package app.valence.modules.softfocus

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Whatever React Native puts inside it, out of focus by as much as asked. */
class ValenceSoftFocusModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceSoftFocus")

    View(ValenceSoftFocusView::class) {
      Prop("radius") { view: ValenceSoftFocusView, radius: Double ->
        view.radius = radius
      }
    }
  }
}
