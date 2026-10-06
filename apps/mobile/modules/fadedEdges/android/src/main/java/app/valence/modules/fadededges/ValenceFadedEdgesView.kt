package app.valence.modules.fadededges

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
 * Draws its contents and then wipes them out towards its edges, by a gradient laid over them that
 * keeps only as much of each pixel as it is opaque: clear at the edge, whole by the length asked.
 *
 * Leading and trailing follow the reading direction across, so a row read right to left fades on
 * the right first; upright, they are the top and the bottom.
 */
class ValenceFadedEdgesView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  var leading: Double = 0.0
    set(value) {
      field = value
      invalidate()
    }

  var trailing: Double = 0.0
    set(value) {
      field = value
      invalidate()
    }

  var isUpright: Boolean = false
    set(value) {
      field = value
      invalidate()
    }

  private val mask = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
  }

  override fun dispatchDraw(canvas: Canvas) {
    val wide = width.toFloat()
    val high = height.toFloat()
    val length = if (isUpright) high else wide

    if (length <= 0f || (leading <= 0.0 && trailing <= 0.0)) {
      super.dispatchDraw(canvas)

      return
    }

    val density = resources.displayMetrics.density
    val isReversed = !isUpright && layoutDirection == LAYOUT_DIRECTION_RTL
    val first = (if (isReversed) trailing else leading) * density
    val last = (if (isReversed) leading else trailing) * density
    val start = (first.toFloat() / length).coerceIn(0f, HALF)
    val end = (last.toFloat() / length).coerceIn(0f, HALF)
    val saved = canvas.saveLayer(0f, 0f, wide, high, null)

    super.dispatchDraw(canvas)

    mask.shader = LinearGradient(
      0f,
      0f,
      if (isUpright) 0f else wide,
      if (isUpright) high else 0f,
      intArrayOf(Color.TRANSPARENT, Color.BLACK, Color.BLACK, Color.TRANSPARENT),
      floatArrayOf(0f, start, 1f - end, 1f),
      Shader.TileMode.CLAMP,
    )
    canvas.drawRect(0f, 0f, wide, high, mask)
    canvas.restoreToCount(saved)
  }

  private companion object {
    const val HALF = 0.5f
  }
}
