package app.valence.modules.music

import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.Player

/**
 * A speaker as the lock screen, the notification and a pair of headphones see it: every button
 * they press is passed on to the app rather than acted on here, since the app keeps the queue and a
 * book's chapters and decides what each one means, as it does on an iPhone. Next and previous are
 * always offered, because the app, not this one-file player, knows whether there is a next — for a
 * book they are the chapter after and before — and a book is offered fifteen seconds back and
 * thirty on as well.
 *
 * @param player - The player that actually plays.
 * @param isBook - Whether it plays a book, which offers going back and on by seconds.
 * @param passOn - Told which button was pressed, and by how much or where to.
 */
internal class ThePassedOnPlayer(
  player: Player,
  private val isBook: Boolean,
  private val passOn: (command: String, seconds: Double?) -> Unit,
) : ForwardingPlayer(player) {
  override fun getAvailableCommands(): Player.Commands {
    val offered = super.getAvailableCommands()
      .buildUpon()
      .add(Player.COMMAND_SEEK_TO_NEXT)
      .add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
      .add(Player.COMMAND_SEEK_TO_PREVIOUS)
      .add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)

    if (isBook) {
      offered.add(Player.COMMAND_SEEK_BACK).add(Player.COMMAND_SEEK_FORWARD)
    }

    return offered.build()
  }

  override fun isCommandAvailable(command: Int): Boolean = availableCommands.contains(command)

  override fun play() = passOn("play", null)

  override fun pause() = passOn("pause", null)

  override fun setPlayWhenReady(playWhenReady: Boolean) = passOn(if (playWhenReady) "play" else "pause", null)

  override fun seekToNext() = passOn("next", null)

  override fun seekToNextMediaItem() = passOn("next", null)

  override fun seekToPrevious() = passOn("previous", null)

  override fun seekToPreviousMediaItem() = passOn("previous", null)

  override fun seekBack() = passOn("back", 15.0)

  override fun seekForward() = passOn("forward", 30.0)

  override fun seekTo(positionMs: Long) = passOn("seek", positionMs / 1000.0)

  override fun seekTo(mediaItemIndex: Int, positionMs: Long) = passOn("seek", positionMs / 1000.0)
}
