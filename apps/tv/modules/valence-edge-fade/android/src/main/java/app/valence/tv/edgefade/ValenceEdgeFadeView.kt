package app.valence.tv.edgefade

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Shader
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Fades what it holds from nothing at one edge to whole at a share of the way across, so a picture
 * melts into whatever is behind it instead of into a painted colour. What it holds is drawn into a
 * layer of its own and that layer is then masked by the fade, so only this view's pixels change.
 */
class ValenceEdgeFadeView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var edge = "left"
    set(value) {
      field = value
      invalidate()
    }
  var reach = 0.5f
    set(value) {
      field = value
      invalidate()
    }

  private val mask = Paint().apply { xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN) }

  init {
    setWillNotDraw(false)
  }

  override fun dispatchDraw(canvas: Canvas) {
    val w = width.toFloat()
    val h = height.toFloat()
    val kept = canvas.saveLayer(0f, 0f, w, h, null)

    super.dispatchDraw(canvas)

    val (fromX, fromY, toX, toY) = when (edge) {
      "right" -> listOf(w, 0f, 0f, 0f)
      "top" -> listOf(0f, 0f, 0f, h)
      "bottom" -> listOf(0f, h, 0f, 0f)
      else -> listOf(0f, 0f, w, 0f)
    }

    mask.shader = LinearGradient(
      fromX,
      fromY,
      toX,
      toY,
      intArrayOf(Color.TRANSPARENT, Color.BLACK),
      floatArrayOf(0f, reach.coerceIn(0.001f, 1f)),
      Shader.TileMode.CLAMP,
    )
    canvas.drawRect(0f, 0f, w, h, mask)
    canvas.restoreToCount(kept)
  }
}
