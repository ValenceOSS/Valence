package app.valence.tv.remotekeys

import android.app.Activity
import android.graphics.Rect
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.HorizontalScrollView
import android.widget.ScrollView
import com.facebook.react.ReactRootView

private val ARROWS = mapOf(
  KeyEvent.KEYCODE_DPAD_UP to View.FOCUS_UP,
  KeyEvent.KEYCODE_DPAD_DOWN to View.FOCUS_DOWN,
  KeyEvent.KEYCODE_DPAD_LEFT to View.FOCUS_LEFT,
  KeyEvent.KEYCODE_DPAD_RIGHT to View.FOCUS_RIGHT,
)

private val MEDIA_KEYS = setOf(
  KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
  KeyEvent.KEYCODE_MEDIA_PLAY,
  KeyEvent.KEYCODE_MEDIA_PAUSE,
  KeyEvent.KEYCODE_MEDIA_REWIND,
  KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
  KeyEvent.KEYCODE_MEDIA_NEXT,
  KeyEvent.KEYCODE_MEDIA_PREVIOUS,
  KeyEvent.KEYCODE_MEDIA_STOP,
)

/**
 * Hands the remote's keys to React Native the way tvOS does: whatever has focus, and only there for
 * the media keys.
 *
 * Android gives a key to the view that has focus and to the views it sits inside, and to nothing
 * else. React Native hears the remote's buttons where it is drawn, at its root, so while nothing
 * holds focus — the player with its controls tucked away, where there is nothing to land on — the
 * root is never handed a key and a press to bring the controls back goes unheard. So while nothing
 * has focus, each key goes to the root first, and then on to the window as it would have anyway,
 * which is where Android moves focus onto something if there is anything to move it to.
 *
 * A media key nothing in the window takes is handed on to whatever is playing, so Play/Pause would
 * be answered twice — by the screen, and by the player's own media session — and the two would
 * cancel out. So while the app is in front its media keys go to React Native and stop there, as the
 * Siri Remote's do; with the app behind, the system hands them to the media session as before.
 *
 * A list that scrolls takes an arrow pressed towards something outside it and scrolls itself by
 * half a screen, letting the remote leave only once it has reached its end, so leaving it can take
 * two presses or more. tvOS moves the remote at once. So where a list takes an arrow and the remote
 * has not moved, though there was somewhere for it to go, it is moved there.
 *
 * Left and right move only to something level with what has the remote and wholly to that side of
 * it, as on tvOS: Android would otherwise carry the remote from the end of a row to whatever lies
 * furthest that way anywhere on the screen, up into the bar or down into another row, and from the
 * middle of a row scrolled up beneath the bar into the bar itself, which it counts as beside
 * whatever lies under it. Where nothing level is there, the remote stays.
 *
 * A keyboard's Escape — a keyboard plugged into the television, or the computer's running an
 * emulator — goes back, as the remote's Back button does.
 */
object HeardWithoutFocus {
  /**
   * Has an activity's window hand keys to React Native this way, once.
   *
   * @param activity The activity React Native draws in.
   */
  fun keep(activity: Activity) {
    val window = activity.window ?: return
    val callback = window.callback ?: return

    if (callback !is Hearing) {
      window.callback = Hearing(callback, window)
    }
  }

  /** The window's own callback, with keys handed to React Native's root as tvOS would. */
  private class Hearing(
    private val within: Window.Callback,
    private val window: Window,
  ) : Window.Callback by within {
    override fun dispatchKeyEvent(pressed: KeyEvent): Boolean {
      val event =
        if (pressed.keyCode == KeyEvent.KEYCODE_ESCAPE) {
          KeyEvent(
            pressed.downTime,
            pressed.eventTime,
            pressed.action,
            KeyEvent.KEYCODE_BACK,
            pressed.repeatCount,
            pressed.metaState,
          )
        } else {
          pressed
        }
      val root = rootIn(window.decorView)

      if (root != null && event.keyCode in MEDIA_KEYS) {
        root.dispatchKeyEvent(event)

        return true
      }

      if (window.currentFocus == null) {
        root?.dispatchKeyEvent(event)
      }

      val was = window.currentFocus
      val direction = ARROWS[event.keyCode]
      val next =
        if (was != null && direction != null && event.action == KeyEvent.ACTION_DOWN) {
          was.focusSearch(direction)?.takeIf { it !== was && !isInsideTheListOf(was, it) && !isTrapped(was, it, direction) }
        } else {
          null
        }
      val isSideways = direction == View.FOCUS_LEFT || direction == View.FOCUS_RIGHT

      if (isSideways && was != null && direction != null && event.action == KeyEvent.ACTION_DOWN) {
        val wouldGo = was.focusSearch(direction)

        if (wouldGo != null && wouldGo !== was && !isBeside(was, wouldGo, direction)) {
          val beside = besideOf(was, direction)

          ScrollsGlide.around(window.decorView, event.repeatCount > 0) {
            beside?.requestFocus(direction) == true
          }

          return true
        }
      }

      val isTaken = within.dispatchKeyEvent(event)

      if (!isTaken && isSideways && was != null && window.currentFocus === was) {
        val wouldGo = was.focusSearch(direction)

        if (wouldGo != null && wouldGo !== was && !isLevel(was, wouldGo)) {
          return true
        }
      }

      if (isTaken && next != null && direction != null && window.currentFocus === was) {
        next.requestFocus(direction)
      }

      return isTaken
    }

    /**
     * Whether a panel around the remote keeps it in — one set to hold the remote until it closes —
     * and the other view lies outside it. Such a panel answers a search for where the remote goes
     * next only from among what it holds.
     */
    private fun isTrapped(focused: View, other: View, direction: Int): Boolean {
      var at = focused.parent

      while (at is ViewGroup) {
        if (!holds(at, other)) {
          val kept = at.focusSearch(focused, direction)

          if (kept == null || holds(at, kept)) {
            return true
          }
        }

        at = at.parent
      }

      return false
    }

    /**
     * The nearest thing the remote can land on that lies wholly to one side of the view it is on and
     * level with it, outside any panel that keeps the remote in.
     */
    private fun besideOf(focused: View, direction: Int): View? {
      val top = focused.rootView as? ViewGroup ?: return null
      val from = rectIn(top, focused)
      val found = ArrayList<View>()

      top.addFocusables(found, direction)

      return found
        .filter {
          it !== focused &&
            it.isShown &&
            !holds(it, focused) &&
            isBeside(focused, it, direction) &&
            isLevel(focused, it)
        }
        .sortedBy {
          val to = rectIn(top, it)
          val across = if (direction == View.FOCUS_RIGHT) to.left - from.right else from.left - to.right
          val off = to.centerY() - from.centerY()

          13L * across * across + off.toLong() * off
        }
        .firstOrNull { !isTrapped(focused, it, direction) }
    }

    /**
     * Whether one view lies wholly to the given side of another. Android counts a wide target as
     * beside a view where it only begins further along, such as the bar laid over a row scrolled up
     * beneath it, and would carry the remote up into it from the middle of the row.
     */
    private fun isBeside(focused: View, other: View, direction: Int): Boolean {
      val top = focused.rootView as? ViewGroup ?: return true
      val from = rectIn(top, focused)
      val to = rectIn(top, other)

      return if (direction == View.FOCUS_RIGHT) to.left >= from.right - 1 else to.right <= from.left + 1
    }

    /** Where a view is laid out within the window's top view, as Android's own focus search reads it. */
    private fun rectIn(top: ViewGroup, view: View): Rect {
      val rect = Rect()

      view.getDrawingRect(rect)
      top.offsetDescendantRectToMyCoords(view, rect)

      return rect
    }

    /** Whether two views share any of the screen's height, so moving between them is moving level. */
    private fun isLevel(one: View, other: View): Boolean {
      val first = Rect()
      val second = Rect()

      one.getGlobalVisibleRect(first)
      other.getGlobalVisibleRect(second)

      return first.top < second.bottom && second.top < first.bottom
    }

    /** Whether a view lies in the same scrolling list as the one the remote is on. */
    private fun isInsideTheListOf(focused: View, other: View): Boolean {
      var at = focused.parent

      while (at is View) {
        if (at is ScrollView || at is HorizontalScrollView) {
          return holds(at, other)
        }

        at = at.parent
      }

      return true
    }

    /** Whether a view is inside another. */
    private fun holds(outer: View, inner: View): Boolean {
      var at: Any? = inner

      while (at is View) {
        if (at === outer) {
          return true
        }

        at = at.parent
      }

      return false
    }
  }

  /** The first React Native root inside a view, if there is one. */
  private fun rootIn(view: View): ReactRootView? {
    if (view is ReactRootView) {
      return view
    }

    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        rootIn(view.getChildAt(index))?.let { return it }
      }
    }

    return null
  }
}
