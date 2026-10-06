package app.valence.tv.topshelf

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileNotFoundException

private val A_PICTURE = Regex("^[A-Za-z0-9-]+\\.jpg$")

/**
 * Lends the television's home screen the pictures Valence fetched for its rows, read-only, since the
 * home screen is another app and cannot sign in to the server to fetch them itself. It hands out the
 * shelf's own pictures by name and nothing else.
 */
class ShelfPictures : ContentProvider() {
  override fun onCreate(): Boolean = true

  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
    val name = uri.lastPathSegment ?: throw FileNotFoundException()
    val shelf = context?.let { shelfIn(it.filesDir) } ?: throw FileNotFoundException()

    if (mode != "r" || !A_PICTURE.matches(name)) {
      throw FileNotFoundException()
    }

    return ParcelFileDescriptor.open(File(shelf, name), ParcelFileDescriptor.MODE_READ_ONLY)
  }

  override fun getType(uri: Uri): String = "image/jpeg"

  override fun query(
    uri: Uri,
    projection: Array<out String>?,
    selection: String?,
    selectionArgs: Array<out String>?,
    sortOrder: String?,
  ): Cursor? = null

  override fun insert(uri: Uri, values: ContentValues?): Uri? = null

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

  override fun update(
    uri: Uri,
    values: ContentValues?,
    selection: String?,
    selectionArgs: Array<out String>?,
  ): Int = 0

  companion object {
    /**
     * Where the shelf's pictures are kept.
     *
     * @param files The app's own files.
     * @return The folder, made if it was not there.
     */
    fun shelfIn(files: File): File = File(files, "topshelf").apply { mkdirs() }
  }
}
