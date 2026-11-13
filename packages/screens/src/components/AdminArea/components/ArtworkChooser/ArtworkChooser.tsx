import { useState } from 'react';
import { PICTURE_LIMITS } from '@ValenceContracts/constants/PICTURE_LIMITS';
import { FramePictureDialog } from '@ValenceScreens/components/FramePictureDialog/FramePictureDialog';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import { chooseArtwork } from '@ValenceClient/library/chooseArtwork';
import { fetchArtworkChoices } from '@ValenceClient/library/fetchArtworkChoices';
import { ownArtworkUrl } from '@ValenceClient/library/ownArtworkUrl';
import { uploadArtwork } from '@ValenceClient/library/uploadArtwork';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { ArtworkTile } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/components/ArtworkTile/ArtworkTile';
import { ARTWORK_ORDERS } from './ARTWORK_ORDERS';
import { orderArtwork } from './orderArtwork';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { ArtworkChooserProps } from './ArtworkChooser.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';

const KINDS = [
  { id: 'poster', label: say('screens.adminArea.artworkPicker.poster') },
  { id: 'backdrop', label: say('screens.adminArea.artworkPicker.backdrop') },
  { id: 'logo', label: say('screens.adminArea.artworkPicker.logo') },
] as const;

const ORDERS = [
  { id: 'catalogue', label: say('screens.adminArea.artworkChooser.asTheCatalogueRanksThem') },
  { id: 'votes', label: say('screens.adminArea.artworkChooser.mostVotesFirst') },
  { id: 'largest', label: say('screens.adminArea.artworkChooser.largestFirst') },
  { id: 'bare', label: say('screens.adminArea.artworkChooser.noLetteringFirst') },
];

const COLUMNS = {
  poster: 'grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]',
  backdrop: 'grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]',
  logo: 'grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]',
} as const;

const WORDS = {
  poster: {
    own: 'screens.adminArea.artworkPicker.useTheCataloguesOwnPoster',
    numbered: 'screens.adminArea.artworkPicker.usePosterNumberLanguage',
    none: 'screens.adminArea.artworkPicker.theCatalogueHasNoPosters',
  },
  backdrop: {
    own: 'screens.adminArea.artworkPicker.useTheCataloguesOwnBackdrop',
    numbered: 'screens.adminArea.artworkPicker.useBackdropNumberLanguage',
    none: 'screens.adminArea.artworkPicker.theCatalogueHasNoBackdrops',
  },
  logo: {
    own: 'screens.adminArea.artworkPicker.useTheCataloguesOwnLogo',
    numbered: 'screens.adminArea.artworkPicker.useLogoNumberLanguage',
    none: 'screens.adminArea.artworkPicker.theCatalogueHasNoLogos',
  },
} as const satisfies Record<ArtworkKind, Record<'own' | 'numbered' | 'none', StringKey>>;

const UPLOADED = /^valence-upload:/u;

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' });

/**
 * Names the language a picture's lettering is in, for the note on its tile.
 *
 * @param language - The catalogue's two-letter code, or null for a picture with no lettering.
 * @returns The language's name, or a word saying there is none.
 */
const languageOf = (language: string | null): string => {
  if (language === null) {
    return say('screens.adminArea.artworkPicker.noText');
  }

  try {
    return LANGUAGES.of(language) ?? language.toUpperCase();
  } catch {
    return language.toUpperCase();
  }
};

/**
 * Chooses the poster, backdrop and logo a film or programme is drawn with: the catalogue's own pick,
 * any of the catalogue's other pictures in the order asked for, a picture beside its files on the
 * disk, or one uploaded from this computer. It says which is in use and where it came from, and goes
 * back to the catalogue's pick in one press. A choice reaches every file of the title and outlives
 * every scan after it; a programme's backdrop is its own, and each episode keeps its still.
 *
 * @param subject - The title being dressed.
 * @param onChanged - Told a choice was made, with the job restoring the catalogue's pick where one was
 *   needed.
 * @param part - A season, or an episode, whose own picture is chosen rather than the title's: a
 *   season's poster or an episode's still, from the catalogue's alone.
 */
const ArtworkChooser = ({ subject, onChanged, part }: ArtworkChooserProps) => {
  const cache = useQueryClient();
  const [kind, setKind] = useState<ArtworkKind>(
    part === undefined || part.episode === null ? 'poster' : 'backdrop',
  );
  const [order, setOrder] = useState<(typeof ARTWORK_ORDERS)[number]>('catalogue');
  const [busy, setBusy] = useState<string | null>(null);
  const [framing, setFraming] = useState<File | null>(null);
  const { mediaId } = subject;
  const choices = useQuery({
    queryKey: ['artwork-choices', mediaId, part ?? null],
    queryFn: () => fetchArtworkChoices(mediaId, part),
    staleTime: 60_000,
  });

  /**
   * Tells everything drawing the title that its pictures changed, and says so.
   *
   * @param said - What to say.
   * @param jobId - The job the change started, if any.
   */
  const changed = async (said: string, jobId: string | null) => {
    artworkRevisions.bump([mediaId, ...subject.mediaIds]);
    await cache.invalidateQueries({ queryKey: ['artwork-choices', mediaId, part ?? null] });
    await cache.invalidateQueries({ queryKey: libraryQueries.key });
    notify.worked(said);
    onChanged(jobId);
  };

  const choose = async (url: string | null, key: string) => {
    setBusy(key);

    const outcome = await chooseArtwork(mediaId, kind, url, part);

    setBusy(null);

    if ('problem' in outcome) {
      notify.failed(outcome.problem);

      return;
    }

    await changed(
      url === null
        ? say('screens.adminArea.artworkPicker.backToTheCataloguesOwnPicture')
        : say('screens.adminArea.artworkPicker.chosen'),
      outcome.jobId,
    );
  };

  const upload = async (file: File, frame: PhotoFrame | null = null) => {
    setBusy('upload');

    const outcome = await uploadArtwork(mediaId, kind, file, frame);

    setBusy(null);

    if ('problem' in outcome) {
      notify.failed(outcome.problem);

      return;
    }

    await changed(say('screens.adminArea.artworkChooser.uploadedAndChosen'), outcome.jobId);
  };

  const read = choices.data;
  const readOk = read === undefined || 'problem' in read ? null : read;
  const offered = orderArtwork(readOk?.options[kind] ?? [], order);
  const onDisk = readOk?.onDisk ?? [];
  const chosen = readOk?.chosen[kind] ?? null;
  const byDefault = readOk?.defaults[kind] ?? null;
  const chosenOnDisk = onDisk.find((one) => one.url === chosen);
  const chosenOption = offered.find(({ option }) => option.url === chosen);
  const inUse =
    chosen === null
      ? say('screens.adminArea.artworkChooser.inUseTheCataloguesPick')
      : UPLOADED.test(chosen)
        ? say('screens.adminArea.artworkChooser.inUseAnUploadedPicture')
        : chosenOnDisk === undefined
          ? say('screens.adminArea.artworkChooser.inUseOneFromTheCatalogue')
          : say('screens.adminArea.artworkChooser.inUseNameFromTheDisk', {
              name: chosenOnDisk.name,
            });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SegmentedRow
          label={say('screens.adminArea.artworkPicker.whichPicture')}
          items={
            part === undefined
              ? KINDS
              : part.episode === null
                ? [{ id: 'poster', label: say('screens.adminArea.artworkChooser.seasonPoster') }]
                : [{ id: 'backdrop', label: say('screens.adminArea.artworkChooser.episodeStill') }]
          }
          value={kind}
          onSelect={(next) => {
            setKind(next === 'backdrop' ? 'backdrop' : next === 'logo' ? 'logo' : 'poster');
          }}
        />
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            label={say('common.order')}
            isLabelHidden
            size="sm"
            options={ORDERS}
            value={order}
            onSelect={(next) => {
              setOrder(ARTWORK_ORDERS.find((one) => one === next) ?? 'catalogue');
            }}
          />
          {part === undefined ? (
            <FilePicker
              label={say('screens.adminArea.artworkChooser.uploadAPicture')}
              accept="image/jpeg,image/png,image/webp"
              variant="secondary"
              size="sm"
              isLoading={busy === 'upload'}
              onPick={(file) => {
                if (kind === 'logo') {
                  void upload(file);
                } else {
                  setFraming(file);
                }
              }}
            >
              {say('screens.adminArea.artworkChooser.uploadAPicture')}
            </FilePicker>
          ) : null}
          <FramePictureDialog
            file={framing}
            limits={PICTURE_LIMITS.artwork}
            aspect={kind === 'backdrop' ? PICTURE_ASPECTS.backdrop : PICTURE_ASPECTS.poster}
            onClose={() => {
              setFraming(null);
            }}
            onUse={(file, frame) => {
              setFraming(null);
              void upload(file, frame);
            }}
          />
        </div>
      </div>

      {choices.isPending ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.artworkPicker.askingTheCatalogueWhatItHas')}
        />
      ) : readOk === null ? (
        <p className="font-body text-sm text-text-muted">
          {read !== undefined && 'problem' in read
            ? read.problem
            : say('error.library.catalogueCouldNotBeAsked')}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-sm text-text">{inUse}</p>
            {chosen === null ? null : (
              <Button
                variant="ghost"
                size="sm"
                isLoading={busy === 'automatic'}
                onClick={() => {
                  void choose(null, 'automatic');
                }}
              >
                {say('screens.adminArea.artworkChooser.goBackToTheCataloguesPick')}
              </Button>
            )}
          </div>

          <ul className={`grid gap-3 ${COLUMNS[kind]}`}>
            <li>
              <ArtworkTile
                kind={kind}
                label={say(WORDS[kind].own)}
                previewUrl={byDefault}
                note={say('screens.artworkPicker.artworkTile.theCataloguesPick')}
                isChosen={chosen === null}
                isBusy={busy === 'automatic'}
                onChoose={() => {
                  void choose(null, 'automatic');
                }}
              />
            </li>
            {chosen === null ? null : (
              <li>
                <ArtworkTile
                  kind={kind}
                  label={inUse}
                  previewUrl={
                    chosenOption === undefined
                      ? ownArtworkUrl(mediaId, chosen)
                      : chosenOption.option.previewUrl
                  }
                  note={
                    UPLOADED.test(chosen)
                      ? say('screens.adminArea.artworkChooser.uploaded')
                      : (chosenOnDisk?.name ?? languageOf(chosenOption?.option.language ?? null))
                  }
                  isChosen
                  isBusy={false}
                  onChoose={() => {}}
                />
              </li>
            )}
          </ul>

          {onDisk.length === 0 ? null : (
            <section className="flex flex-col gap-2">
              <h3 className="font-body text-sm font-medium text-text-muted">
                {say('screens.adminArea.artworkChooser.besideItsFiles')}
              </h3>
              <ul className={`grid gap-3 ${COLUMNS[kind]}`}>
                {onDisk.map((one) => (
                  <li key={one.url} className="flex flex-col gap-1">
                    <ArtworkTile
                      kind={kind}
                      label={say('screens.adminArea.artworkChooser.useNameFromTheDisk', {
                        name: one.name,
                      })}
                      previewUrl={ownArtworkUrl(mediaId, one.url)}
                      note={one.name}
                      isChosen={chosen === one.url}
                      isBusy={busy === one.url}
                      onChoose={() => {
                        void choose(one.url, one.url);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="font-body text-sm font-medium text-text-muted">
              {say('screens.adminArea.artworkChooser.fromTheCatalogue')}
            </h3>
            {offered.length === 0 ? (
              <p className="font-body text-sm text-text-muted">{say(WORDS[kind].none)}</p>
            ) : (
              <ul className={`grid gap-3 ${COLUMNS[kind]}`}>
                {offered.map(({ option, rank }) => (
                  <li key={option.url} className="flex flex-col gap-1">
                    <ArtworkTile
                      kind={kind}
                      label={say(WORDS[kind].numbered, {
                        number: rank.toString(),
                        language: languageOf(option.language),
                      })}
                      previewUrl={option.previewUrl}
                      note={languageOf(option.language)}
                      isChosen={chosen === option.url}
                      isBusy={busy === option.url}
                      onChoose={() => {
                        void choose(option.url, option.url);
                      }}
                    />
                    <span className="font-body text-xs tabular-nums text-text-muted">
                      {say('screens.adminArea.artworkChooser.pictureSize', {
                        width: option.width.toString(),
                        height: option.height.toString(),
                      })}
                      {' · '}
                      {option.source === 'fanart'
                        ? say('screens.adminArea.artworkChooser.fromFanartTv')
                        : sayCount('common.count.votes', option.votes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

ArtworkChooser.displayName = 'ArtworkChooser';

export { ArtworkChooser };
