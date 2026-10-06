package app.valence.tv.tvkind

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val FIRE_TV = "amazon.hardware.fire_tv"

/**
 * Says which kind of Android television this is: a Fire TV, which runs Amazon's Fire OS, or any other
 * Android TV. Amazon asks apps to tell by the feature every Fire TV declares rather than by its model,
 * since televisions made by others run Fire OS too.
 */
class ValenceTvKindModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceTvKind")

    Function("isFireTv") {
      appContext.reactContext?.packageManager?.hasSystemFeature(FIRE_TV) == true
    }
  }
}
