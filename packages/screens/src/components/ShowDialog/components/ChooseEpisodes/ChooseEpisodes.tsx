import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { nameSeason } from '@ValenceClient/library/nameSeason';
import type { ChooseEpisodesProps } from './ChooseEpisodes.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Picks which episodes of a programme to download: every season with its episodes under it, a
 * season picked or let go of whole with its own box, and one download for whatever is picked.
 *
 * What is already on this device is shown, so the list reads as the programme does, and cannot be
 * picked again.
 *
 * @param isOpen - Whether it is up.
 * @param title - The programme.
 * @param seasons - Its seasons, each with the episodes the library holds.
 * @param held - The episodes already on this device.
 * @param onClose - Told it was put away without downloading anything.
 * @param onChosen - Told which episodes to download.
 */
const ChooseEpisodes = ({
  isOpen,
  title,
  seasons,
  held,
  onClose,
  onChosen,
}: ChooseEpisodesProps) => {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  const flip = (ids: readonly string[], isOn: boolean) => {
    setPicked((was) => {
      const next = new Set(was);

      for (const id of ids) {
        if (isOn) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }

      return next;
    });
  };

  const close = () => {
    setPicked(new Set());
    onClose();
  };

  return (
    <Dialog
      label={say('screens.chooseEpisodes.dialogLabel', { title })}
      isOpen={isOpen}
      onClose={close}
    >
      <DialogTitle title={say('screens.chooseEpisodes.title')} detail={title} />

      <DialogContent className="flex flex-col gap-6">
        {seasons.map((season) => {
          const open = season.episodes
            .filter((episode) => !held.has(episode.id))
            .map((episode) => episode.id);
          const chosen = open.filter((id) => picked.has(id)).length;

          return (
            <section key={season.seasonNumber ?? 'other'} className="flex flex-col gap-2">
              <Checkbox
                label={nameSeason(season.seasonNumber)}
                checked={open.length > 0 && chosen === open.length}
                isMixed={chosen > 0 && chosen < open.length}
                disabled={open.length === 0}
                onCheckedChange={(isOn) => {
                  flip(open, isOn);
                }}
                className="font-medium"
              />

              <ul className="flex flex-col gap-1 pl-6">
                {season.episodes.map((episode) => (
                  <li key={episode.id}>
                    <Checkbox
                      label={`${episode.episodeNumber === null || episode.episodeNumber === undefined ? '' : `${episode.episodeNumber.toString()}. `}${episode.title}`}
                      {...(held.has(episode.id)
                        ? { description: say('screens.chooseEpisodes.onThisDevice') }
                        : {})}
                      checked={picked.has(episode.id)}
                      disabled={held.has(episode.id)}
                      onCheckedChange={(isOn) => {
                        flip([episode.id], isOn);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: close }}
        confirm={{
          label:
            picked.size === 0
              ? say('screens.chooseEpisodes.pickSome')
              : sayCount('screens.chooseEpisodes.download', picked.size),
          isDisabled: picked.size === 0,
          onChoose: () => {
            const ids = [...picked];

            setPicked(new Set());
            onChosen(ids);
          },
        }}
      />
    </Dialog>
  );
};

ChooseEpisodes.displayName = 'ChooseEpisodes';

export { ChooseEpisodes };
