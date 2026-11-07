import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { PLAY_FACE } from '@ValenceUI/tokens/PLAY_FACE';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { titleLogoUrl } from '@ValenceClient/library/titleLogoUrl';
import { ArtworkBackButton } from '@ValenceScreens/components/ArtworkBackButton/ArtworkBackButton';
import { CastGrid } from '@ValenceScreens/components/CastGrid/CastGrid';
import { DialogArrival } from '@ValenceScreens/components/DialogArrival/DialogArrival';
import { DialogHeadline } from '@ValenceScreens/components/DialogHeadline/DialogHeadline';
import { DialogHeadlinePart } from '@ValenceScreens/components/DialogHeadlinePart/DialogHeadlinePart';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { DialogSections } from '@ValenceScreens/components/DialogSections/DialogSections';
import { TintedGround } from '@ValenceScreens/components/TintedGround/TintedGround';
import { TitleHero } from '@ValenceScreens/components/TitleHero/TitleHero';
import { TitleLogo } from '@ValenceScreens/components/TitleLogo/TitleLogo';
import { useArtworkTint } from '@ValenceScreens/library/useArtworkTint';
import type { MissingEpisodeDialogProps } from './MissingEpisodeDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * The page about an episode the library does not have, laid out as the page about one it does: the
 * show's lettering over its still, asking for it where playing it would be, then what it is called,
 * its facts and its cast. The cast is the show's, read from an episode that is here, since the
 * catalogue's listing of a missing episode does not name one.
 *
 * @param isOpen - Whether it is showing.
 * @param showTitle - The show it is from, and what going back returns to.
 * @param title - What the episode is called, with its number.
 * @param episodeNumber - Which episode it is.
 * @param seasonNumber - Which season it is in, where it has one.
 * @param airs - When it aired or airs, in words.
 * @param stillUrl - The catalogue's still, where it has one.
 * @param overview - What the catalogue says happens in it.
 * @param logoMediaId - An episode of the show that has its lettering.
 * @param castMediaId - An episode of the show to read the cast from.
 * @param genres - The show's genres.
 * @param onOpenPerson - Told which performer to open, where opening one is offered.
 * @param onRequest - Told to ask for what is missing, where whoever is watching may ask.
 * @param onClose - Told to go back to the show.
 */
const MissingEpisodeDialog = ({
  isOpen,
  showTitle,
  title,
  episodeNumber,
  seasonNumber,
  airs,
  stillUrl,
  overview,
  logoMediaId,
  castMediaId,
  genres = [],
  onOpenPerson,
  onRequest,
  onClose,
}: MissingEpisodeDialogProps) => {
  const tint = useArtworkTint(isOpen ? (stillUrl ?? null) : null);
  const [hasNoLogo, setHasNoLogo] = useState(false);
  const asked = useQuery(libraryQueries.detail(isOpen ? (castMediaId ?? null) : null));
  const cast = asked.data?.metadata.cast ?? [];
  const facts = [
    say('screens.mediaFacts.ePEpisodeNumber', { episodeNumber: episodeNumber.toString() }),
    ...(seasonNumber === null || seasonNumber === undefined
      ? []
      : [say('screens.mediaFacts.sSeasonNumber', { seasonNumber: seasonNumber.toString() })]),
    ...(airs === undefined || airs === '' ? [] : [airs]),
  ];

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose} size="stage" edge={tint}>
      <DialogContent className="p-3 sm:p-4">
        <TintedGround tint={tint}>
          <DialogArrival>
            <TitleHero
              preview={
                stillUrl === null || stillUrl === undefined ? null : (
                  <img src={stillUrl} alt="" className="absolute inset-0 size-full object-cover" />
                )
              }
              corner={
                <ArtworkBackButton
                  label={say('common.backToName', { name: showTitle })}
                  onBack={onClose}
                />
              }
            >
              <DialogHeadline className="flex flex-col items-start gap-8">
                <DialogHeadlinePart
                  as="h2"
                  isTitle
                  className={
                    logoMediaId === null || logoMediaId === undefined || hasNoLogo
                      ? 'max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-on-scrim'
                      : 'flex'
                  }
                >
                  {logoMediaId === null || logoMediaId === undefined || hasNoLogo ? (
                    showTitle
                  ) : (
                    <TitleLogo
                      src={titleLogoUrl(logoMediaId)}
                      alt={showTitle}
                      className="max-h-[20svh] w-auto max-w-[min(70vw,30rem)] object-contain object-left-bottom"
                      onError={() => {
                        setHasNoLogo(true);
                      }}
                    />
                  )}
                </DialogHeadlinePart>

                {onRequest === undefined ? null : (
                  <DialogHeadlinePart className="w-full sm:w-[21rem]">
                    <Button
                      variant="confirm"
                      size="none"
                      className={`w-full ${PLAY_FACE}`}
                      onClick={() => {
                        onClose();
                        onRequest();
                      }}
                    >
                      {say('common.request')}
                    </Button>
                  </DialogHeadlinePart>
                )}
              </DialogHeadline>
            </TitleHero>

            <DialogHeadline className="grid gap-x-12 gap-y-5 px-1 pt-2 sm:px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
              <div className="flex min-w-0 flex-col gap-4">
                <DialogHeadlinePart as="span" className="text-lg font-semibold text-text">
                  {title}
                </DialogHeadlinePart>

                <DialogHeadlinePart className="flex flex-col items-start gap-2.5">
                  <span className="text-base text-text-muted">{facts.join(' · ')}</span>
                  <Badge size="sm">{say('common.notInTheLibrary')}</Badge>
                </DialogHeadlinePart>

                {overview === null || overview === undefined || overview === '' ? null : (
                  <DialogHeadlinePart>
                    <p className="max-w-[65ch] text-base leading-relaxed text-text">{overview}</p>
                  </DialogHeadlinePart>
                )}
              </div>

              <DialogHeadlinePart className="flex flex-col gap-4 text-sm leading-relaxed">
                {cast.length === 0 ? null : (
                  <p>
                    <span className="text-text-muted">{say('common.cast')}: </span>
                    <span className="text-text">
                      {cast
                        .slice(0, 3)
                        .map((member) => member.name)
                        .join(', ')}
                    </span>
                  </p>
                )}

                {genres.length === 0 ? null : (
                  <p>
                    <span className="text-text-muted">{say('common.genres')}: </span>
                    <span className="text-text">{genres.slice(0, 3).join(', ')}</span>
                  </p>
                )}
              </DialogHeadlinePart>
            </DialogHeadline>

            {cast.length === 0 ? null : (
              <DialogSections isOpen className="flex flex-col gap-10 px-1 pb-8 pt-10 sm:px-2">
                <DialogSection>
                  <CastGrid
                    members={cast}
                    {...(onOpenPerson === undefined
                      ? {}
                      : {
                          onOpenPerson: (member) => {
                            onClose();
                            onOpenPerson(member);
                          },
                        })}
                  />
                </DialogSection>
              </DialogSections>
            )}
          </DialogArrival>
        </TintedGround>
      </DialogContent>
    </Dialog>
  );
};

MissingEpisodeDialog.displayName = 'MissingEpisodeDialog';

export { MissingEpisodeDialog };
