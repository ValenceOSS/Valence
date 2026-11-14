import { Icon } from '@ValenceUI/Icon';
import { User as UserIcon } from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { ReadMore } from '@ValenceUI/ReadMore';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { Link } from '@ValenceUI/Link';
import { StepTrail } from '@ValenceUI/StepTrail';
import { Skeleton } from '@ValenceUI/Skeleton';
import { hasAnythingToShow } from '@ValenceContracts/schemas/Person';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';
import { MediaCard } from '@ValenceUI/MediaCard';
import { PersonPortraits } from './components/PersonPortraits/PersonPortraits';
import { SeasonMate } from '@ValenceScreens/components/SeasonMate/SeasonMate';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { useHeldBadges } from '@ValenceScreens/library/useHeldBadges';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import type { CatalogueTitle, PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { ArtworkCloseButton } from '@ValenceScreens/components/ArtworkCloseButton/ArtworkCloseButton';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import { ArtworkBackButton } from '@ValenceScreens/components/ArtworkBackButton/ArtworkBackButton';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import type { PersonCredits } from '@ValenceContracts/schemas/Person';
import type { PersonDialogProps } from './PersonDialog.types';
import { say } from '@ValenceI18n/say';
import { describeCredit } from '@ValenceClient/people/describeCredit';
import { opensFromTheTimeline } from '@ValenceClient/people/opensFromTheTimeline';
import { describePersonFacts } from '@ValenceClient/people/describePersonFacts';

const NOTHING: PersonCredits = { films: [], shows: [], episodes: [] };

const NO_WORK: readonly CatalogueTitle[] = [];

const NO_CREDITS: readonly PersonCredit[] = [];

/**
 * Everything Valence knows about somebody in its cast, and everything of theirs this server can play.
 * Opened from a name in a cast list, which is the moment the question arises — somebody recognises a
 * face and wants to know what else of theirs is here.
 *
 * What is held comes first, because it can be played now. Whoever may request gets the rest of what
 * the catalogue credits them with after it, to ask for. What the catalogue says about them is shown
 * where it says anything and left out entirely where it does not, rather than drawn as empty fields.
 *
 * @param personId - Who to open, or null while nobody is open.
 * @param role - The part they played in whatever this was opened from, where it was opened from one.
 * @param onClose - Told when the dialog was dismissed.
 * @param onPlay - Told to start something of theirs, and where from.
 * @param onInspect - Told to open the page about something of theirs.
 * @param onOpenShow - Told to open a programme of theirs.
 * @param onAsk - Told to open a title of theirs this server does not have, as its address names it,
 *   and left out for whoever may not request, who is only shown what is held.
 * @param onBack - Told to go back to the dialog this was opened from, where it was opened from one,
 *   which is offered in place of closing it.
 * @param backLabel - What that dialog is about.
 */
const PersonDialog = ({
  personId,
  role,
  onClose,
  onPlay,
  onInspect,
  onOpenShow,
  onAsk,
  onBack,
  backLabel,
}: PersonDialogProps) => {
  const heldBadgesOf = useHeldBadges();
  const kinds = useRequestableKinds();
  const [lastOpened, setLastOpened] = useState<number | null>(null);

  const asked = useQuery(libraryQueries.person(personId));
  const theirs = useQuery(libraryQueries.credits(personId));
  const catalogued = useQuery(requestsQueries.personWork(personId, onAsk !== undefined));

  const person = personId === null ? null : (asked.data ?? null);
  const credited = personId === null ? NOTHING : (theirs.data ?? NOTHING);
  const credits = {
    ...credited,
    films: [
      ...new Map(
        credited.films.map((media) => [media.externalId ?? media.id, media] as const).reverse(),
      ).values(),
    ].reverse(),
  };
  const isLoading = personId !== null && (asked.isPending || theirs.isPending);
  const tint = useArtworkTint(person?.portraitUrl ?? null);

  useEffect(() => {
    if (personId !== null) {
      setLastOpened(personId);
    }
  }, [personId]);

  const shown = personId ?? lastOpened;

  if (shown === null) {
    return null;
  }

  const couldNotRead = personId !== null && (asked.isError || theirs.isError);
  const work = personId === null ? NO_WORK : (catalogued.data?.titles ?? NO_WORK);
  const timeline = personId === null ? NO_CREDITS : (catalogued.data?.timeline ?? NO_CREDITS);
  const facts = describePersonFacts(person, timeline.length);
  const notHeld = work.filter(
    (title) => title.standing.status !== 'library' && title.standing.status !== 'linked',
  );
  const moreRows = [
    {
      kind: 'film' as const,
      heading:
        credits.films.length === 0 ? say('common.films') : say('screens.personDialog.moreFilms'),
    },
    {
      kind: 'series' as const,
      heading:
        credits.shows.length === 0
          ? say('common.programmes')
          : say('screens.personDialog.moreShows'),
    },
  ].filter((row) => kinds.has(row.kind));
  const isEmpty =
    !isLoading && !couldNotRead && !hasAnythingToShow(person, credits) && notHeld.length === 0;

  return (
    <Dialog
      label={person?.name ?? say('screens.personDialog.somebodyInTheCast')}
      isOpen={personId !== null}
      onClose={onClose}
      size="stage"
      edge={tint}
    >
      <DialogContent className="p-3 sm:p-4">
        <TintedGround tint={tint}>
          {onBack === undefined ? (
            <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
              <ArtworkCloseButton onClose={onClose} />
            </div>
          ) : (
            <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
              <ArtworkBackButton
                label={
                  backLabel === undefined
                    ? say('common.back')
                    : say('common.backToName', { name: backLabel })
                }
                onBack={onBack}
              />
            </div>
          )}

          <div
            key={personId ?? 'nobody'}
            className="grid gap-8 px-1 pb-8 pt-1 sm:px-2 sm:pt-2 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:gap-12"
          >
            <DialogHeadline className="flex flex-col gap-4 md:sticky md:top-0 md:self-start">
              <DialogHeadlinePart
                as="span"
                className="mx-auto flex aspect-[3/4] w-full max-w-64 items-center justify-center overflow-hidden rounded-2xl bg-surface-raised shadow-[var(--shadow-lifted)] ring-1 ring-line md:max-w-none"
              >
                {person?.portraitUrl === null || person?.portraitUrl === undefined ? (
                  <Icon of={UserIcon} size={64} tone="muted" />
                ) : (
                  <PersonPortraits
                    portraits={
                      person.portraits === null ||
                      person.portraits === undefined ||
                      person.portraits.length === 0
                        ? [person.portraitUrl]
                        : person.portraits
                    }
                  />
                )}
              </DialogHeadlinePart>

              <span className="flex min-w-0 flex-col gap-2 text-center md:text-start">
                <DialogHeadlinePart
                  as="h2"
                  isTitle
                  className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1] tracking-[-0.03em] text-text"
                >
                  {person?.name ?? say('screens.personDialog.somebodyInTheCast')}
                </DialogHeadlinePart>

                {role === null || role === undefined || role === '' ? null : (
                  <DialogHeadlinePart as="span" className="text-base text-text-muted">
                    {say('screens.personDialog.asRole', { role })}
                  </DialogHeadlinePart>
                )}
              </span>

              {facts.length === 0 &&
              (person?.instagram === null || person?.instagram === undefined) ? null : (
                <DialogHeadlinePart className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-text">
                    {say('screens.personDialog.personalInfo')}
                  </h3>

                  {person?.instagram === null || person?.instagram === undefined ? null : (
                    <Link
                      href={`https://www.instagram.com/${person.instagram}`}
                      className="text-sm"
                    >
                      {say('screens.personDialog.instagram')}
                    </Link>
                  )}

                  <dl className="flex flex-col gap-3">
                    {facts.map((fact) => (
                      <div key={fact.label} className="flex flex-col gap-0.5">
                        <dt className="text-xs text-text-muted">{fact.label}</dt>
                        <dd className="text-sm text-text">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </DialogHeadlinePart>
              )}
            </DialogHeadline>

            <DialogSections isOpen className="flex min-w-0 flex-col gap-10">
              {isLoading ? (
                <div aria-hidden className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[92%]" />
                  <Skeleton className="h-4 w-[70%]" />
                </div>
              ) : null}

              {isLoading || couldNotRead ? null : (
                <div className="md:pe-14">
                  <DialogSection heading={say('screens.personDialog.biography')}>
                    {person?.biography === null || person?.biography === undefined ? (
                      <p className="text-sm text-text-muted">
                        {say('screens.personDialog.noBiographyProvided')}
                      </p>
                    ) : (
                      <ReadMore lines={6}>{person.biography}</ReadMore>
                    )}
                  </DialogSection>
                </div>
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
                    cards="portrait"
                    hasArrows={false}
                    look="title"
                    className="px-0"
                  >
                    {credits.films.map((media, at) => (
                      <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
                        <RailCard
                          {...(onAsk === undefined
                            ? {}
                            : { badges: heldBadgesOf(media.libraryId) })}
                          growsOnHover={false}
                          shape="poster"
                          media={media}
                          onPlay={onPlay}
                          onInspect={onInspect}
                        />
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
                    cards="portrait"
                    hasArrows={false}
                    look="title"
                    className="px-0"
                  >
                    {credits.shows.map((media, at) => (
                      <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
                        <RailCard
                          {...(onAsk === undefined
                            ? {}
                            : { badges: heldBadgesOf(media.libraryId) })}
                          growsOnHover={false}
                          isSeries
                          shape="poster"
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
                    hasArrows={false}
                    look="title"
                    className="-mx-1 px-0"
                  >
                    {credits.episodes.map((episode) => (
                      <li key={episode.id} className="flex">
                        <SeasonMate
                          episode={episode}
                          namesItsShow
                          onSelect={() => {
                            onInspect(episode);
                          }}
                        />
                      </li>
                    ))}
                  </Rail>
                </DialogSection>
              )}

              {moreRows.map(({ kind, heading }) => {
                const titles = notHeld.filter((title) => title.kind === kind);

                return titles.length === 0 ? null : (
                  <DialogSection key={kind}>
                    <Rail
                      title={heading}
                      sizesCards
                      cards="portrait"
                      hasArrows={false}
                      look="title"
                      className="px-0"
                    >
                      {titles.map((title, at) => (
                        <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
                          <MediaCard
                            title={title.title}
                            subtitle={title.year?.toString() ?? ''}
                            badges={describeCatalogueCard(title).badges}
                            {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
                            onSelect={() => {
                              onAsk?.(askingOf(title));
                            }}
                          />
                        </RevealItem>
                      ))}
                    </Rail>
                  </DialogSection>
                );
              })}

              {timeline.length === 0 ? null : (
                <DialogSection heading={say('common.timeline')}>
                  <StepTrail
                    label={say('common.timeline')}
                    isNewestFirst
                    steps={timeline.map((credit) => ({
                      id: `${credit.kind}:${credit.id}`,
                      label: credit.title,
                      detail: describeCredit(credit),
                      mark: credit.standing.status === 'library' ? 'done' : 'waiting',
                      ...(credit.year === null
                        ? {}
                        : { aside: { kind: 'note', text: credit.year.toString() } as const }),
                      ...(onAsk === undefined || !opensFromTheTimeline(credit, kinds)
                        ? {}
                        : {
                            onSelect: () => {
                              onAsk(askingOf(credit));
                            },
                          }),
                    }))}
                  />
                </DialogSection>
              )}
            </DialogSections>
          </div>
        </TintedGround>
      </DialogContent>
    </Dialog>
  );
};

PersonDialog.displayName = 'PersonDialog';

export { PersonDialog };
