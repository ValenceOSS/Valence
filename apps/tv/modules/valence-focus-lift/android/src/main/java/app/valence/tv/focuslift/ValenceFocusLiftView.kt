package app.valence.tv.focuslift

import android.content.Context
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import android.view.animation.DecelerateInterpolator
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

private const val LIFT_MS = 200L

private const val RAISED_DP = 12f

/**
 * Lifts what it holds as the remote lands on anything inside it, and lets it down as the remote
 * leaves, hearing the move from Android's own focus system rather than waiting on JavaScript.
 *
 * The lift is a scale on the view as drawn, so the frame React Native lays out is never changed
 * beneath it, and it is raised above its neighbours while lifted so a grown card is not drawn under
 * the one beside it. A shadow, where asked for, is cast from the top of what it holds down to the
 * given height, so a card's picture casts it and not the words beneath. A row in a list grows from
 * its left edge rather than its middle, so its words stay in line with the rows around it.
 */
class ValenceFocusLiftView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var scale = 1.1f
  var isAnchoredLeft = false
  var shadowHeight = 0f
    set(value) {
      field = value
      invalidateOutline()
    }
  var cornerRadius = 0f
    set(value) {
      field = value
      invalidateOutline()
    }

  private var isLifted = false

  private val density = resources.displayMetrics.density

  private val hearFocus = ViewTreeObserver.OnGlobalFocusChangeListener { _, now ->
    val isComing = now != null && holds(now)

    if (isComing != isLifted) {
      isLifted = isComing
      lift(isComing)
    }
  }

  init {
    clipChildren = false
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        val height = (shadowHeight * density).toInt().coerceAtMost(view.height)

        outline.setRoundRect(0, 0, view.width, height, cornerRadius * density)
        outline.alpha = if (shadowHeight > 0f) 0.55f else 0f
      }
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnGlobalFocusChangeListener(hearFocus)
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnGlobalFocusChangeListener(hearFocus)
    super.onDetachedFromWindow()
  }

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    pivotX = if (isAnchoredLeft) 0f else width / 2f
    pivotY = height / 2f
  }

  /** Whether a view is this one or somewhere inside it. */
  private fun holds(view: View): Boolean {
    var at: View? = view

    while (at != null) {
      if (at === this) {
        return true
      }

      at = at.parent as? View
    }

    return false
  }

  /** Grows what it holds and raises it, or lets it back down. */
  private fun lift(isUp: Boolean) {
    pivotX = if (isAnchoredLeft) 0f else width / 2f
    animate()
      .scaleX(if (isUp) scale else 1f)
      .scaleY(if (isUp) scale else 1f)
      .translationZ(if (isUp) RAISED_DP * density else 0f)
      .setDuration(LIFT_MS)
      .setInterpolator(DecelerateInterpolator())
      .start()
  }
}
