import { Icon } from '@ValenceUI/Icon';
import { User as UserIcon, X as XIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { ReadMore } from '@ValenceUI/ReadMore';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Skeleton } from '@ValenceUI/Skeleton';
import { hasAnythingToShow } from '@ValenceContracts/schemas/Person';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import type { PersonCredits } from '@ValenceContracts/schemas/Person';
import type { PersonDialogProps } from './PersonDialog.types';
import { say } from '@ValenceI18n/say';

const NOTHING: PersonCredits = { films: [], shows: [], episodes: [] };

/**
 * Writes a birth date the way somebody says it rather than the way a catalogue stores it, and leaves
 * an unreadable one out rather than showing the raw string back.
 *
 * @param bornOn - The date as the catalogue gave it.
 * @returns The date in words, or null where it could not be read.
 */
const describeBirth = (bornOn: string | null): string | null => {
  if (bornOn === null) {
    return null;
  }

  const at = Date.parse(bornOn);

  return Number.isNaN(at)
    ? null
    : new Date(at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

/**
 * Everything Valence knows about somebody in its cast, and everything of theirs this server can play.
 * Opened from a name in a cast list, which is the moment the question arises — somebody recognises a
 * face and wants to know what else of theirs is here.
 *
 * Only what is held: a filmography naming forty films of which thirty-seven cannot be played is a
 * list of things to be disappointed by. What the catalogue says about them is shown where it says
 * anything and left out entirely where it does not, rather than drawn as empty fields.
 *
 * @param personId - Who to open, or null while nobody is open.
 * @param role - The part they played in whatever this was opened from, where it was opened from one.
 * @param onClose - Told when the dialog was dismissed.
 * @param onPlay - Told to start something of theirs, and where from.
 * @param onInspect - Told to open the page about something of theirs.
 * @param onOpenShow - Told to open a programme of theirs.
 */
const PersonDialog = ({
  personId,
  role,
  onClose,
  onPlay,
  onInspect,
  onOpenShow,
}: PersonDialogProps) => {
  const [lastOpened, setLastOpened] = useState<number | null>(null);

  const asked = useQuery(libraryQueries.person(personId));
  const theirs = useQuery(libraryQueries.credits(personId));

  const person = personId === null ? null : (asked.data ?? null);
  const credits = personId === null ? NOTHING : (theirs.data ?? NOTHING);
  const isLoading = personId !== null && (asked.isPending || theirs.isPending);

  useEffect(() => {
    if (personId !== null) {
      setLastOpened(personId);
    }
  }, [personId]);

  const shown = personId ?? lastOpened;

  if (shown === null) {
    return null;
  }

  const born = describeBirth(person?.bornOn ?? null);
  const said = [born, person?.bornIn ?? null].filter((one) => one !== null);
  const couldNotRead = personId !== null && (asked.isError || theirs.isError);
  const isEmpty = !isLoading && !couldNotRead && !hasAnythingToShow(person, credits);

  return (
    <Dialog
      label={person?.name ?? say('screens.personDialog.somebodyInTheCast')}
      isOpen={personId !== null}
      onClose={onClose}
      size="stage"
    >
      <DialogContent className="p-0">
        <div className="absolute right-4 top-4 z-10">
          <Button isIconOnly variant="overlay" label={say('common.close')} onClick={onClose}>
            <Icon of={XIcon} size={18} />
          </Button>
        </div>

        <DialogSections key={personId ?? 'nobody'} className="flex flex-col gap-4 p-5 pb-10 sm:p-8">
          <DialogHeadline className="flex flex-wrap items-start gap-5">
            <DialogHeadlinePart
              as="span"
              className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line"
            >
              {person?.portraitUrl === null || person?.portraitUrl === undefined ? (
                <Icon of={UserIcon} size={36} tone="muted" />
              ) : (
                <img
                  src={person.portraitUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </DialogHeadlinePart>

            <span className="flex min-w-0 flex-col gap-2">
              <DialogHeadlinePart
                as="h2"
                isTitle
                className="text-3xl font-semibold tracking-[-0.02em] text-text"
              >
                {person?.name ?? say('screens.personDialog.somebodyInTheCast')}
              </DialogHeadlinePart>

              {role === null || role === undefined || role === '' ? null : (
                <DialogHeadlinePart as="span" className="font-body text-sm text-text-muted">
                  {say('screens.personDialog.asRole', { role })}
                </DialogHeadlinePart>
              )}

              {said.length === 0 ? null : (
                <DialogHeadlinePart as="span" className="font-body text-sm text-text-muted">
                  {said.join(' · ')}
                </DialogHeadlinePart>
              )}
            </span>
          </DialogHeadline>

          {isLoading ? (
            <div aria-hidden className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          ) : null}

          {person?.biography === null || person?.biography === undefined ? null : (
            <DialogSection heading={say('screens.personDialog.biography')}>
              <ReadMore lines={6}>{person.biography}</ReadMore>
            </DialogSection>
          )}

          {couldNotRead ? (
            <CouldNotRead
              said={say('common.anythingAboutThemCouldNotBeRead')}
              isTryingAgain={asked.isFetching || theirs.isFetching}
              onTryAgain={() => {
                void asked.refetch();
                void theirs.refetch();
              }}
            />
          ) : null}

          {isEmpty ? (
            <p className="font-body text-sm text-text-muted">
              {say('screens.personDialog.nothingIsKnownAboutThemAnd')}
            </p>
          ) : null}

          {credits.films.length === 0 ? null : (
            <DialogSection>
              <Rail
                title={say('common.films')}
                sizesCards
                hasArrows={false}
                look="section"
                className="px-0"
              >
                {credits.films.map((media, at) => (
                  <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
                    <RailCard media={media} onPlay={onPlay} onInspect={onInspect} />
                  </RevealItem>
                ))}
              </Rail>
            </DialogSection>
          )}

          {credits.shows.length === 0 ? null : (
            <DialogSection>
              <Rail
                title={say('common.programmes')}
                sizesCards
                hasArrows={false}
                look="section"
                className="px-0"
              >
                {credits.shows.map((media, at) => (
                  <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
                    <RailCard
                      media={media}
                      onPlay={onPlay}
                      onInspect={onInspect}
                      {...(onOpenShow === undefined ? {} : { onOpenShow })}
                    />
                  </RevealItem>
                ))}
              </Rail>
            </DialogSection>
          )}

          {credits.episodes.length === 0 ? null : (
            <DialogSection>
              <Rail
                title={say('common.episodes')}
                sizesCards
                hasArrows={false}
                look="section"
                className="px-0"
              >
                {credits.episodes.map((media, at) => (
                  <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
                    <RailCard media={media} onPlay={onPlay} onInspect={onInspect} />
                  </RevealItem>
                ))}
              </Rail>
            </DialogSection>
          )}
        </DialogSections>
      </DialogContent>
    </Dialog>
  );
};

PersonDialog.displayName = 'PersonDialog';

export { PersonDialog };
