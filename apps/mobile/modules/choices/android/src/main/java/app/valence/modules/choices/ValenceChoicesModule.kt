package app.valence.modules.choices

import android.app.AlertDialog
import android.graphics.Color
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * A choice of one from several, asked in the system's list dialog — what Android has where an
 * iPhone has its action sheet, and with no limit on how many choices it lists, as an alert has.
 *
 * It is handed what the iPhone's sheet is handed and answers the same: the position of the choice
 * picked, or of the cancel choice where the dialog was dismissed. The cancel choice is the dialog's
 * own button rather than a row, a choice that cannot be picked is left out, and one that deletes
 * something is written in red.
 */
class ValenceChoicesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceChoices")

    AsyncFunction("ask") {
        title: String?,
        message: String?,
        options: List<String>,
        cancel: Int?,
        destructive: Int?,
        disabled: List<Int>,
        promise: Promise,
      ->
      val activity = appContext.currentActivity

      if (activity == null) {
        promise.resolve(cancel)

        return@AsyncFunction
      }

      activity.runOnUiThread {
        val listed = options.indices.filter { it != cancel && it !in disabled }
        val rows =
          listed.map { at ->
            if (at == destructive) {
              SpannableString(options[at]).apply {
                setSpan(ForegroundColorSpan(DESTRUCTIVE), 0, length, 0)
              }
            } else {
              options[at]
            }
          }
        var isAnswered = false
        val heading = listOfNotNull(title, message).joinToString("\n\n")
        val builder =
          AlertDialog.Builder(activity, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setItems(rows.toTypedArray<CharSequence>()) { _, which ->
              isAnswered = true
              promise.resolve(listed[which])
            }
            .setOnDismissListener {
              if (!isAnswered) {
                isAnswered = true
                promise.resolve(cancel)
              }
            }

        if (heading.isNotEmpty()) {
          builder.setTitle(heading)
        }

        if (cancel != null && cancel in options.indices) {
          builder.setNegativeButton(options[cancel]) { dialog, _ -> dialog.dismiss() }
        }

        builder.show()
      }
    }
  }

  private companion object {
    val DESTRUCTIVE = Color.rgb(255, 69, 58)
  }
}
