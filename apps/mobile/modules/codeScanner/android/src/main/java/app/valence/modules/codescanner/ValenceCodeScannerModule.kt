package app.valence.modules.codescanner

import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reads one QR code with Google's own code scanner, raised over whatever is on screen.
 *
 * The scanner belongs to Google Play services and hands back only what it read, so the app never
 * holds the camera and asks for no permission to use it. What comes back is always an answer, as
 * on an iPhone: a code was read, somebody closed the scanner, or this phone has no scanner.
 */
class ValenceCodeScannerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ValenceCodeScanner")

    AsyncFunction("scan") { promise: Promise ->
      val activity = appContext.currentActivity

      if (activity == null) {
        promise.resolve(mapOf("kind" to "unable"))
        return@AsyncFunction
      }

      val options = GmsBarcodeScannerOptions.Builder()
        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
        .enableAutoZoom()
        .build()

      GmsBarcodeScanning.getClient(activity, options)
        .startScan()
        .addOnSuccessListener { code ->
          val text = code.rawValue

          promise.resolve(if (text == null) mapOf("kind" to "unable") else mapOf("kind" to "read", "text" to text))
        }
        .addOnCanceledListener { promise.resolve(mapOf("kind" to "closed")) }
        .addOnFailureListener { promise.resolve(mapOf("kind" to "unable")) }
    }
  }
}
