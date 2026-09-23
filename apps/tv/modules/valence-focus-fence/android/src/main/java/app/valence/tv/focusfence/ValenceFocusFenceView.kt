package app.valence.tv.focusfence

import android.content.Context
import android.view.ViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Keeps the remote out of whatever it holds while it is shut, for a page kept mounted but hidden
 * beneath another, so moving about the page on top cannot wander onto buttons nobody can see. What
 * already has the remote keeps it, so the page on top can take the remote from it in its own time.
 */
class ValenceFocusFenceView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  var isShut = false
    set(value) {
      field = value
      descendantFocusability =
        if (value) ViewGroup.FOCUS_BLOCK_DESCENDANTS else ViewGroup.FOCUS_AFTER_DESCENDANTS
    }
}
