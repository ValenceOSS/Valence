package app.valence.tv.remotekeys

import android.app.Activity
import android.view.View
import java.lang.ref.WeakReference

private const val REMEMBERED = 24

/**
 * Hands the remote back to what last had it when whatever has it now goes away, as tvOS does.
 *
 * When the view holding the remote is taken off the screen — a panel closing, a page gone back from
 * — Android either lets go of the remote altogether, until a key is pressed and it picks something
 * of its own, or hands it straight to the first thing on the page. tvOS puts it back where it was
 * before: on the button that opened the panel, or the card the page was opened from. So the views
 * that have had the remote are remembered, newest last, and when the remote is let go, or Android
 * hands it on by itself rather than because a key moved it, or a page is put in place of another
 * and nothing has the remote at all, the newest of them still on the screen takes it back.
 */
object FocusComesBack {
  /**
   * Has an activity's window give the remote back this way, from now on.
   *
   * @param activity The activity React Native draws in.
   */
  fun keep(activity: Activity) {
    val root = activity.window?.decorView ?: return
    val held = ArrayDeque<WeakReference<View>>()

    root.viewTreeObserver.addOnGlobalFocusChangeListener { was, now ->
      if (now != null && was != null) {
        remember(held, now)
      }

      root.post {
        val isGone = was != null && !was.isAttachedToWindow
        val isAndroidsPick = now != null && (was == null || isGone) && root.findFocus() === now

        if (now == null || isAndroidsPick) {
          if (isGone) {
            held.removeAll { it.get() === now }
          }

          giveBack(root, held)
        }

        root.findFocus()?.let { remember(held, it) }
      }
    }

    root.viewTreeObserver.addOnGlobalLayoutListener {
      if (root.hasWindowFocus() && root.findFocus() == null) {
        root.post {
          if (root.findFocus() == null) {
            giveBack(root, held)
          }
        }
      }
    }
  }

  /** Puts a view at the newest end of the ones that have had the remote. */
  private fun remember(held: ArrayDeque<WeakReference<View>>, view: View) {
    held.removeAll { it.get() == null || it.get() === view }
    held.addLast(WeakReference(view))

    while (held.size > REMEMBERED) {
      held.removeFirst()
    }
  }

  /**
   * Puts the remote on the newest view that had it and can still take it, where the remote is now
   * nowhere or somewhere Android chose for it; and where none can, as on a page that has just
   * opened, on the first thing on the screen that can, as tvOS always has the remote somewhere.
   */
  private fun giveBack(root: View, held: ArrayDeque<WeakReference<View>>) {
    val now = root.findFocus()

    for (remembered in held.reversed()) {
      val view = remembered.get() ?: continue

      if (view === now) {
        return
      }

      if (view.isAttachedToWindow && view.isShown && view.isFocusable && view.requestFocus()) {
        return
      }
    }

    if (now == null) {
      root.requestFocus()
    }
  }
}
