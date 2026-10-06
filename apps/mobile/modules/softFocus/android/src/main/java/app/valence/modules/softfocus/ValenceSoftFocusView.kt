package app.valence.modules.softfocus

import android.content.Context
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Blurs its own contents, as the web blurs a line of words with a CSS filter, by the system's render
 * effect where the phone has one — Android 12 and later. An older phone dims them instead, which
 * says the same thing less softly.
 */
class ValenceSoftFocusView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  var radius: Double = 0.0
    set(value) {
      field = value
      focus()
    }

  private fun focus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val pixels = (radius * resources.displayMetrics.density).toFloat()

      val blur =
        if (pixels > 0f) RenderEffect.createBlurEffect(pixels, pixels, Shader.TileMode.DECAL) else null

      setRenderEffect(blur)
    } else {
      alpha = if (radius > 0) DIMMED else 1f
    }
  }

  private companion object {
    const val DIMMED = 0.5f
  }
}
