package app.valence.tv.glass

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

private val PANE = Color.argb(204, 28, 28, 30)

private val EDGE = Color.argb(46, 255, 255, 255)

/**
 * A dark pane behind whatever it holds, standing in for Apple's Liquid Glass: Android cannot blur
 * what lies behind a view, so this is the frosted look's colour and its thin catch of light along
 * the edge, rounded to the given radius, or into a capsule where that is more than half its height.
 */
class ValenceGlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var cornerRadius = 0f
    set(value) {
      field = value
      shape()
    }

  private val density = resources.displayMetrics.density

  private val pane = GradientDrawable().apply {
    setColor(PANE)
    setStroke(density.toInt().coerceAtLeast(1), EDGE)
  }

  init {
    background = pane
  }

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    shape()
  }

  /** Rounds the pane to its radius, or into a capsule where that is more than half its height. */
  private fun shape() {
    pane.cornerRadius = (cornerRadius * density).coerceAtMost(height / 2f)
  }
}
