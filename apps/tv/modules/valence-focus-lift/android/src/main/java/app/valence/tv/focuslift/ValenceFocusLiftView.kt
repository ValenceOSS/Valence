package app.valence.tv.focuslift

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.RectF
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import android.view.animation.DecelerateInterpolator
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

private const val LIFT_MS = 200L

private const val RAISED_DP = 12f

private const val SHADOW_BLUR_DP = 28f

private const val SHADOW_DROP_DP = 18f

private const val SHADOW_OPACITY = 0.55f

/**
 * Lifts what it holds as the remote lands on anything inside it, and lets it down as the remote
 * leaves, hearing the move from Android's own focus system rather than waiting on JavaScript.
 *
 * The lift is a scale on the view as drawn, so the frame React Native lays out is never changed
 * beneath it, and it is raised above its neighbours while lifted so a grown card is not drawn under
 * the one beside it. What it holds may draw past its edges — a button's focus ring sits just outside
 * the button, as on tvOS — so nothing it holds is clipped to its box.
 *
 * A shadow, where asked for, is cast as tvOS casts it — blurred 28 points, dropped 18, at 55% — from
 * the top of what it holds down to the given height, so a card's picture casts it and not the words
 * beneath, fading in and out with the lift. It is drawn here rather than left to Android's elevation,
 * whose shadow is too faint on a dark page to say which card the remote is on.
 *
 * A row in a list grows from its left edge rather than its middle, so its words stay in line with
 * the rows around it.
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

  private var shadowShown = 0f

  private var fading: ValueAnimator? = null

  private val shade = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK }

  private val outlineOfThePicture = RectF()

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
    clipToPadding = false
    setWillNotDraw(false)
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        val height = (shadowHeight * density).toInt().coerceAtMost(view.height)

        outline.setRoundRect(0, 0, view.width, height, cornerRadius * density)
        outline.alpha = 0f
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
    fadeTheShadow(isUp)
  }

  /** Takes the size React Native measured, rather than measuring what it holds as a row would. */
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec),
    )
  }

  /** Leaves what it holds where React Native put it, rather than laying it out in a row. */
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  /** Draws the shadow beneath what it holds, as far in as the lift has faded it. */
  override fun dispatchDraw(canvas: Canvas) {
    if (shadowShown > 0f && shadowHeight > 0f && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val opacity = (SHADOW_OPACITY * shadowShown * 255).toInt()

      shade.setShadowLayer(
        SHADOW_BLUR_DP * density,
        0f,
        SHADOW_DROP_DP * density,
        Color.argb(opacity, 0, 0, 0),
      )
      shade.alpha = opacity
      outlineOfThePicture.set(0f, 0f, width.toFloat(), (shadowHeight * density).coerceAtMost(height.toFloat()))
      canvas.drawRoundRect(outlineOfThePicture, cornerRadius * density, cornerRadius * density, shade)
    }

    super.dispatchDraw(canvas)
  }

  /** Fades the shadow in or out over the lift's own time. */
  private fun fadeTheShadow(isUp: Boolean) {
    if (shadowHeight <= 0f) {
      return
    }

    fading?.cancel()
    fading = ValueAnimator.ofFloat(shadowShown, if (isUp) 1f else 0f).apply {
      duration = LIFT_MS
      interpolator = DecelerateInterpolator()
      addUpdateListener {
        shadowShown = it.animatedValue as Float
        invalidate()
      }
      start()
    }
  }
}
