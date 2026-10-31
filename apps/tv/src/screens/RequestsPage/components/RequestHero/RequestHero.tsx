import { StyleSheet, Text } from 'react-native';
import { namesOfAskers } from '@ValenceClient/requests/namesOfAskers';
import { nameTheStanding } from '@ValenceClient/requests/nameTheStanding';
import { useMe } from '@ValenceClient/requests/useMe';
import { DownloadReadout } from '@ValenceTv/components/DownloadReadout/DownloadReadout';
import { Spotlight } from '@ValenceTv/components/Spotlight/Spotlight';
import { TitleLockup } from '@ValenceTv/components/TitleLockup/TitleLockup';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { RequestHeroProps } from './RequestHero.types';
import { say } from '@ValenceI18n/say';

/**
 * The top of the requests page: whatever the remote rests on, written large — its lettering, its
 * year and where it stands, whose request it is where it is somebody else's, what it is about, and,
 * while it downloads, how far through it is, how fast it is arriving and how long is left — over
 * its picture.
 *
 * @param request - What the remote rests on, or nothing before anything is there.
 * @param going - How its download is going, while it downloads.
 * @param isSomeoneElses - Whether somebody other than this viewer asked for it.
 * @param film - The film in the library it stands for, whose logo letters it, where there is one.
 * @param picture - Its wide picture, from the library or the catalogue, where there is one.
 * @param logoPath - The catalogue's logo, for anything else.
 * @param children - What is said in its place where there is nothing to show, under the page's
 *   name.
 */
const RequestHero = ({
  request,
  going,
  isSomeoneElses,
  film,
  picture,
  logoPath,
  children,
}: RequestHeroProps) => {
  const me = useMe();

  if (request === null) {
    return (
      <Spotlight picture={null}>
        <Text style={styles.heading}>{say('common.requests')}</Text>
        {children}
      </Spotlight>
    );
  }

  const standing = nameTheStanding({
    status: request.state === 'available' ? 'library' : 'requested',
    mediaId: request.mediaId,
    requestId: request.id,
    requestState: request.state,
  });

  return (
    <Spotlight picture={picture}>
      <TitleLockup
        key={request.id}
        mediaId={film}
        name={request.title}
        hasLogo={film !== null}
        logoPath={logoPath}
        isSeated
      />
      <Text numberOfLines={1} style={styles.facts}>
        {joinFacts([
          request.year?.toString(),
          standing?.label,
          isSomeoneElses
            ? say('common.askedByName', { name: namesOfAskers(request, me) })
            : undefined,
        ])}
      </Text>
      {request.overview === null || request.overview === '' ? null : (
        <Text numberOfLines={2} style={styles.overview}>
          {request.overview}
        </Text>
      )}
      {going === null ? null : <DownloadReadout progress={going} />}
    </Spotlight>
  );
};

RequestHero.displayName = 'RequestHero';

const styles = StyleSheet.create({
  heading: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.body },
  overview: { color: tokens.colours.text, fontSize: tokens.type.small, lineHeight: 34 },
});

export { RequestHero };
