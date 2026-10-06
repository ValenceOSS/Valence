package app.valence.tv.remotekeys

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.ScrollView

/**
 * Keeps the remote off a scrolling list that has things in it to land on.
 *
 * React Native makes a scrolling list on Android focusable itself whenever it can scroll, so the
 * remote can scroll a list with nothing in it to land on. A list of shelves has plenty, and there the
 * list itself becomes a stop of its own: pressing up from its first row lands on the list, which
 * shows nothing, and only a second press reaches what is above it. tvOS never lands on a list. So
 * whenever the screen is laid out, a list holding something focusable stops being focusable itself,
 * and one holding nothing keeps it, for the remote to scroll a page of words.
 */
object ScrollsPassFocusOn {
  /**
   * Has an activity's lists pass the remote on to what they hold, from now on.
   *
   * @param activity The activity React Native draws in.
   */
  fun keep(activity: Activity) {
    val root = activity.window?.decorView ?: return

    root.viewTreeObserver.addOnGlobalLayoutListener { passOn(root) }
  }

  /** Makes every list inside a view that holds something focusable unfocusable itself. */
  private fun passOn(view: View) {
    if (view is ScrollView || view is HorizontalScrollView) {
      val holds = (view as ViewGroup).getChildAt(0)?.hasFocusable() == true

      if (view.isFocusable == holds) {
        view.isFocusable = !holds
      }
    }

    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        passOn(view.getChildAt(index))
      }
    }
  }
}
