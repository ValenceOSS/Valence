package app.valence.modules.notificationservice

import android.app.PendingIntent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/**
 * Shows what a push woke the phone to say. Valence's push relay never carries a notification's
 * words, only an identifier for it, so this reads them from the server the phone is signed in to,
 * with the session the app shared, and shows them, as the Apple side's notification service
 * extension does. Where the server cannot be reached, or the delivery is not this phone's, nothing
 * is shown, since an Android push from the relay has no words of its own to fall back on.
 *
 * Any push that is not Valence's is handed on to Expo's own handling.
 */
class ValenceMessagingService : ExpoFirebaseMessagingService() {
  private data class Delivery(
    val event: String,
    val title: String,
    val body: String,
    val link: String?,
  )

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val deliveryId = remoteMessage.data["d"]

    if (remoteMessage.data["valence"] != "1" || deliveryId == null) {
      super.onMessageReceived(remoteMessage)
      return
    }

    if (!deliveryId.all { it.isLetterOrDigit() || it == '-' }) {
      return
    }

    val held = SharedSignIn.read(this) ?: return
    val delivery = read(held, deliveryId) ?: return

    show(deliveryId, delivery)
  }

  /** Reads what the server says the delivery is, or nothing where it cannot be read. */
  private fun read(held: SharedSignIn.Held, deliveryId: String): Delivery? {
    val asking =
      runCatching {
          URL("${held.address}/api/notifications/deliveries/$deliveryId").openConnection()
            as HttpURLConnection
        }
        .getOrNull() ?: return null

    return try {
      asking.connectTimeout = TIMEOUT_MS
      asking.readTimeout = TIMEOUT_MS
      asking.setRequestProperty("Cookie", held.cookie)
      asking.setRequestProperty("Accept", "application/json")

      if (asking.responseCode != HttpURLConnection.HTTP_OK) {
        return null
      }

      val read = JSONObject(asking.inputStream.bufferedReader().use { it.readText() })

      Delivery(
        event = read.getString("event"),
        title = read.getJSONObject("title").getString("message"),
        body = read.getJSONObject("body").getString("message"),
        link = if (read.isNull("link")) null else read.getString("link"),
      )
    } catch (_: Exception) {
      null
    } finally {
      asking.disconnect()
    }
  }

  /** Shows the delivery on the channel the app made for Valence's notifications. */
  private fun show(deliveryId: String, delivery: Delivery) {
    val about =
      packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
    val channel = about?.getString(CHANNEL_KEY) ?: return
    val opening = packageManager.getLaunchIntentForPackage(packageName) ?: return

    delivery.link?.let { opening.putExtra("link", it) }

    val tapped =
      PendingIntent.getActivity(
        this,
        deliveryId.hashCode(),
        opening,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
    val colour = resources.getIdentifier("notification_icon_color", "color", packageName)
    val notification =
      NotificationCompat.Builder(this, channel)
        .setSmallIcon(R.drawable.valence_notification)
        .setContentTitle(delivery.title)
        .setContentText(delivery.body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(delivery.body))
        .setGroup(delivery.event)
        .setAutoCancel(true)
        .setContentIntent(tapped)
        .apply { if (colour != 0) setColor(getColor(colour)) }
        .build()

    try {
      NotificationManagerCompat.from(this).notify(deliveryId.hashCode(), notification)
    } catch (_: SecurityException) {}
  }

  private companion object {
    const val TIMEOUT_MS = 15_000

    const val CHANNEL_KEY = "com.google.firebase.messaging.default_notification_channel_id"
  }
}
