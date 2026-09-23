package app.valence.tv.focuslift

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Offers JavaScript a view that lifts what it holds as the remote lands on anything inside it. */
class ValenceFocusLiftModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceFocusLift")

    View(ValenceFocusLiftView::class) {
      Prop("scale") { view: ValenceFocusLiftView, scale: Float -> view.scale = scale }
      Prop("shadowHeight") { view: ValenceFocusLiftView, height: Float -> view.shadowHeight = height }
      Prop("cornerRadius") { view: ValenceFocusLiftView, radius: Float -> view.cornerRadius = radius }
      Prop("isAnchoredLeft") { view: ValenceFocusLiftView, isAnchoredLeft: Boolean ->
        view.isAnchoredLeft = isAnchoredLeft
      }
    }
  }
}
