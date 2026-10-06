package app.valence.tv.remotekeys

import android.app.Activity
import android.view.View
import java.lang.ref.WeakReference

private const val REMEMBERED = 24

/**
 * Hands the remote back to what last had it when whatever has it now goes away, as tvOS does.
 *
 * Android lets go of the remote when the view holding it is taken off the screen — a panel closing,
 * a page gone back from — and nothing has it until a key is pressed, when Android picks something of
 * its own. tvOS puts it back where it was before: on the button that opened the panel, or the card
 * the page was opened from. So the views that have had the remote are remembered, newest last, and
 * when the remote is let go the newest of them still on the screen takes it back.
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

    root.viewTreeObserver.addOnGlobalFocusChangeListener { _, now ->
      if (now != null) {
        held.removeAll { it.get() == null || it.get() === now }
        held.addLast(WeakReference(now))

        while (held.size > REMEMBERED) {
          held.removeFirst()
        }

        return@addOnGlobalFocusChangeListener
      }

      root.post { giveBack(root, held) }
    }
  }

  /** Puts the remote on the newest view that had it and is still on the screen, if nothing has it. */
  private fun giveBack(root: View, held: ArrayDeque<WeakReference<View>>) {
    if (root.findFocus() != null) {
      return
    }

    val back = held.reversed().firstNotNullOfOrNull { remembered ->
      remembered.get()?.takeIf { it.isAttachedToWindow && it.isShown && it.isFocusable }
    }

    back?.requestFocus()
  }
}
