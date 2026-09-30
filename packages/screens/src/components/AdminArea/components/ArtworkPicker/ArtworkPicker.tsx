import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import { chooseArtwork } from '@ValenceClient/library/chooseArtwork';
import { fetchArtworkChoices } from '@ValenceClient/library/fetchArtworkChoices';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { ArtworkTile } from './components/ArtworkTile/ArtworkTile';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { ArtworkPickerProps } from './ArtworkPicker.types';

const KINDS = [
  { id: 'poster', label: 'Poster' },
  { id: 'backdrop', label: 'Backdrop' },
  { id: 'logo', label: 'Logo' },
] as const;

const COLUMNS = {
  poster: 'grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]',
  backdrop: 'grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]',
  logo: 'grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]',
} as const;

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' });

/**
 * Names the language a picture's lettering is in, for the note on its tile.
 *
 * @param language - The catalogue's two-letter code, or null for a picture with no lettering.
 * @returns The language's name, or a word saying there is none.
 */
const languageOf = (language: string | null): string => {
  if (language === null) {
    return 'No text';
  }

  try {
    return LANGUAGES.of(language) ?? language.toUpperCase();
  } catch {
    return language.toUpperCase();
  }
};

/**
 * Chooses the poster, backdrop and logo a film or programme is drawn with, from everything the
 * catalogue holds for it, for when its own pick is the wrong one — lettering in a language nobody in
 * the house reads, a poster from another country, a backdrop that gives the ending away. The first
 * tile goes back to the catalogue's pick. A choice reaches every file of the title and outlives every
 * scan after it; a programme's backdrop is its own, and each episode keeps its still.
 *
 * @param subject - The title being dressed, or null when the picker is closed.
 * @param onClose - Told it was dismissed.
 * @param onChanged - Told a choice was made, with the job restoring the catalogue's pick where one was
 *   needed.
 */
const ArtworkPicker = ({ subject, onClose, onChanged }: ArtworkPickerProps) => {
  const cache = useQueryClient();
  const [kind, setKind] = useState<ArtworkKind>('poster');
  const [busy, setBusy] = useState<string | null>(null);
  const mediaId = subject?.mediaId ?? '';
  const choices = useQuery({
    queryKey: ['artwork-choices', mediaId],
    queryFn: () => fetchArtworkChoices(mediaId),
    enabled: subject !== null,
    staleTime: 60_000,
  });

  const choose = async (url: string | null, key: string) => {
    if (subject === null) {
      return;
    }

    setBusy(key);

    const outcome = await chooseArtwork(subject.mediaId, kind, url);

    setBusy(null);

    if ('problem' in outcome) {
      notify.failed(outcome.problem);

      return;
    }

    artworkRevisions.bump([subject.mediaId, ...subject.mediaIds]);
    await cache.invalidateQueries({ queryKey: ['artwork-choices', subject.mediaId] });
    await cache.invalidateQueries({ queryKey: libraryQueries.key });
    notify.worked(url === null ? 'Back to the catalogue’s own picture.' : 'Chosen.');
    onChanged(outcome.jobId);
  };

  const read = choices.data;
  const offered = read === undefined || 'problem' in read ? [] : read.options[kind];
  const chosen = read === undefined || 'problem' in read ? null : read.chosen[kind];

  return (
    <DialogCompanion label={subject?.name ?? 'Artwork'} isOpen={subject !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={subject?.name ?? 'Artwork'}
        detail={
          subject?.isSeries === true
            ? 'Reaches every episode and outlives every scan. Episodes keep their stills.'
            : 'Draws this film everywhere, and every scan keeps it.'
        }
      />

      <DialogContent className="flex flex-col gap-5">
        <SegmentedRow
          label="Which picture"
          items={KINDS}
          value={kind}
          onSelect={(next) => {
            setKind(next === 'backdrop' ? 'backdrop' : next === 'logo' ? 'logo' : 'poster');
          }}
        />

        {choices.isPending ? (
          <Spinner isCentered label="Asking the catalogue what it has" />
        ) : read === undefined || 'problem' in read ? (
          <p className="font-body text-sm text-text-muted">
            {read?.problem ?? 'The catalogue could not be asked what it has.'}
          </p>
        ) : (
          <ul className={`grid gap-3 ${COLUMNS[kind]}`}>
            <li>
              <ArtworkTile
                kind={kind}
                label={`Use the catalogue’s own ${kind}`}
                previewUrl={null}
                note="Automatic"
                isChosen={chosen === null}
                isBusy={busy === 'automatic'}
                onChoose={() => {
                  void choose(null, 'automatic');
                }}
              />
            </li>

            {offered.map((option, at) => (
              <li key={option.url}>
                <ArtworkTile
                  kind={kind}
                  label={`Use ${kind} ${(at + 1).toString()}, ${languageOf(option.language)}`}
                  previewUrl={option.previewUrl}
                  note={languageOf(option.language)}
                  isChosen={chosen === option.url}
                  isBusy={busy === option.url}
                  onChoose={() => {
                    void choose(option.url, option.url);
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {read !== undefined && !('problem' in read) && offered.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            The catalogue has no {kind === 'logo' ? 'logos' : `${kind}s`} for this.
          </p>
        ) : null}
      </DialogContent>

      <DialogFooter dismiss={{ onChoose: onClose }} />
    </DialogCompanion>
  );
};

ArtworkPicker.displayName = 'ArtworkPicker';

export { ArtworkPicker };
