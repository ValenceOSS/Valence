package app.valence.tv.focusfence

import android.content.Context
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Keeps the remote out of whatever it holds while it is shut, for a page kept mounted but hidden
 * beneath another, so moving about the page on top cannot wander onto buttons nobody can see. What
 * already has the remote keeps it, so the page on top can take the remote from it in its own time.
 *
 * What it holds is drawn whole, past its own edges where it reaches them — a button's focus ring sits
 * just outside the button — as a React Native view draws it, rather than cut off at each one's edge
 * as an Android view is unless told otherwise.
 */
class ValenceFocusFenceView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  init {
    clipChildren = false
  }

  var isShut = false
    set(value) {
      field = value
      descendantFocusability =
        if (value) ViewGroup.FOCUS_BLOCK_DESCENDANTS else ViewGroup.FOCUS_AFTER_DESCENDANTS
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
}
