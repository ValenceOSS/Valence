import { Bin as BinIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { startListening } from '@ValenceClient/books/startListening';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { describeKeptListening } from '@ValenceClient/downloads/describeKeptListening';
import { sourceOfKeptMusic } from '@ValenceClient/downloads/sourceOfKeptMusic';
import { standingOfKeptListening } from '@ValenceClient/downloads/standingOfKeptListening';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { useKeptListening } from '@ValenceClient/downloads/useKeptListening';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';
import { say } from '@ValenceI18n/say';

/**
 * The albums, playlists, liked songs and audiobooks this device keeps, each with how far it has
 * got, a way to play it, to pause or carry on fetching it, and to take it off. Nothing is drawn
 * where none is kept.
 */
const KeptListeningList = () => {
  const shelf = useKeptListening();
  const { player } = useMusicPlayer();

  if (shelf.here.length === 0) {
    return null;
  }

  const play = (kept: KeptListening) => {
    if (kept.kind === 'audiobook' && kept.book !== null) {
      void startListening({ book: kept.book, chapters: kept.chapters }, theAudiobookPlayer());

      return;
    }

    player.play(kept.tracks, 0, { source: sourceOfKeptMusic(kept) });
  };

  return (
    <section className="flex flex-col">
      <header className="px-5 pb-2 pt-5">
        <h3 className="text-xs font-medium text-text-muted">
          {say('screens.keptListeningList.musicAndAudiobooks')}
        </h3>
      </header>

      <SettingList>
        {shelf.here.map((kept) => {
          const standing = standingOfKeptListening(
            shelf,
            kept,
            platformInUse().listeningFiles.canPlay,
          );
          const description = describeKeptListening(standing);

          return (
            <SettingRow
              key={`${kept.kind}-${kept.id}`}
              title={kept.title}
              description={[
                kept.byline,
                description.says,
                standing.bytes > 0 ? formatBytes(standing.bytes) : null,
              ]
                .filter((part) => part !== null)
                .join(' · ')}
            >
              {standing.state === 'here' ? null : (
                <ProgressBar
                  value={standing.filesInAll === 0 ? 0 : standing.filesHere / standing.filesInAll}
                  max={1}
                  label={say('common.howFarTitleHasDownloaded', { title: kept.title })}
                  className="w-28"
                />
              )}

              {standing.filesHere === 0 ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={say('common.playTitle', { title: kept.title })}
                  onClick={() => {
                    play(kept);
                  }}
                >
                  <Icon of={PlayFilledIcon} size={16} />
                </Button>
              )}

              {description.next === 'remove' ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={
                    description.next === 'pause'
                      ? say('common.pauseTitle', { title: kept.title })
                      : say('common.carryOnFetchingTitle', { title: kept.title })
                  }
                  onClick={() => {
                    void theKeptListening().pause(kept.kind, kept.id, description.next === 'pause');
                  }}
                >
                  <Icon
                    of={description.next === 'pause' ? PauseFilledIcon : PlayFilledIcon}
                    size={16}
                  />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                label={say('common.removeTitleFromThisDevice', { title: kept.title })}
                onClick={() => {
                  void theKeptListening().drop(kept.kind, kept.id);
                }}
              >
                <Icon of={BinIcon} size={16} />
              </Button>
            </SettingRow>
          );
        })}
      </SettingList>
    </section>
  );
};

KeptListeningList.displayName = 'KeptListeningList';

export { KeptListeningList };
