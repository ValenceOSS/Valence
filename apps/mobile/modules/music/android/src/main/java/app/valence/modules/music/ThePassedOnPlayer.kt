package app.valence.modules.music

import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.Player

/**
 * The player as the lock screen, the notification and a pair of headphones see it: every button
 * they press is passed on to the app rather than acted on here, since the app keeps the queue and
 * decides what each one means, as it does on an iPhone. Next and previous are always offered,
 * because the app, not this one-track player, knows whether there is a next.
 *
 * @param player - The player that actually plays.
 * @param passOn - Told which button was pressed, and where to for a seek.
 */
internal class ThePassedOnPlayer(
  player: Player,
  private val passOn: (command: String, seconds: Double?) -> Unit,
) : ForwardingPlayer(player) {
  override fun getAvailableCommands(): Player.Commands =
    super.getAvailableCommands()
      .buildUpon()
      .add(Player.COMMAND_SEEK_TO_NEXT)
      .add(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)
      .add(Player.COMMAND_SEEK_TO_PREVIOUS)
      .add(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)
      .build()

  override fun isCommandAvailable(command: Int): Boolean = availableCommands.contains(command)

  override fun play() = passOn("play", null)

  override fun pause() = passOn("pause", null)

  override fun setPlayWhenReady(playWhenReady: Boolean) = passOn(if (playWhenReady) "play" else "pause", null)

  override fun seekToNext() = passOn("next", null)

  override fun seekToNextMediaItem() = passOn("next", null)

  override fun seekToPrevious() = passOn("previous", null)

  override fun seekToPreviousMediaItem() = passOn("previous", null)

  override fun seekTo(positionMs: Long) = passOn("seek", positionMs / 1000.0)

  override fun seekTo(mediaItemIndex: Int, positionMs: Long) = passOn("seek", positionMs / 1000.0)
}
