package app.valence.tv.remotekeys

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.view.View
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import android.widget.HorizontalScrollView
import android.widget.ScrollView
import java.util.IdentityHashMap
import java.util.WeakHashMap

private const val GLIDE_MS = 320L

private const val HELD_GLIDE_MS = 140L

/**
 * Glides a list or a page to what the remote moved onto, as tvOS does, rather than jumping there.
 *
 * Android scrolls a list to the view that takes focus in the same instant, while tvOS eases it
 * there. So the scroll positions are noted before a press, and any list the press moved is put back
 * and eased to where Android sent it, along the same path. A glide still going when the next press
 * comes is finished at once, so the next press is measured from where the list really is, and a
 * held button glides each step more quickly.
 */
object ScrollsGlide {
  private val gliding = WeakHashMap<View, ValueAnimator>()

  /**
   * Runs a press, gliding whatever it scrolled.
   *
   * @param root The window's top view, inside which every list lies.
   * @param isHeld Whether the button is being held, repeating.
   * @param press What the press does.
   * @returns What the press returned.
   */
  fun around(root: View, isHeld: Boolean, press: () -> Boolean): Boolean {
    for (running in gliding.values.toList()) {
      running.end()
    }

    gliding.clear()

    val before = IdentityHashMap<View, Pair<Int, Int>>()

    listsIn(root) { list -> before[list] = list.scrollX to list.scrollY }

    val taken = press()

    for ((list, was) in before) {
      if (list.isShown && (list.scrollX != was.first || list.scrollY != was.second)) {
        glide(list, was, list.scrollX to list.scrollY, if (isHeld) HELD_GLIDE_MS else GLIDE_MS)
      }
    }

    return taken
  }

  /** Puts a list back where it was and eases it to where it went. */
  private fun glide(list: View, from: Pair<Int, Int>, to: Pair<Int, Int>, durationMs: Long) {
    list.scrollTo(from.first, from.second)

    val animator = ValueAnimator.ofFloat(0f, 1f).setDuration(durationMs)

    animator.interpolator = DecelerateInterpolator(1.6f)
    animator.addUpdateListener { step ->
      val part = step.animatedValue as Float

      list.scrollTo(
        from.first + ((to.first - from.first) * part).toInt(),
        from.second + ((to.second - from.second) * part).toInt(),
      )
    }
    animator.addListener(
      object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: Animator) {
          list.scrollTo(to.first, to.second)

          if (gliding[list] === animation) {
            gliding.remove(list)
          }
        }
      },
    )
    gliding[list] = animator
    animator.start()
  }

  /** Every list shown inside a view, the view itself included. */
  private fun listsIn(view: View, found: (View) -> Unit) {
    if (!view.isShown) {
      return
    }

    if (view is ScrollView || view is HorizontalScrollView) {
      found(view)
    }

    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        listsIn(view.getChildAt(index), found)
      }
    }
  }
}
