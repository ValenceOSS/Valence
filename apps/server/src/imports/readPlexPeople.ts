/* eslint-disable valence/no-hard-coded-strings -- the source's own item types, fields, modes and element names, sent and matched rather than shown */
import { findXmlElements } from './findXmlElements';
import { readXmlElements } from './readXmlElements';
import type { XmlElement } from './readXmlElements';
import type { SourceCaller } from './createSourceCaller';

type PlexPerson = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  thumb: string | null;
  isOwner: boolean;
  isHome: boolean;
  isProtected: boolean;
  restrictionProfile: string | null;
  filterMovies: string | null;
  filterTelevision: string | null;
  sharedToken: string | null;
  libraryKeys: 'all' | readonly string[];
};

/**
 * Reads an attribute of an element, treating an empty one as absent.
 *
 * @param element - The element.
 * @param name - The attribute.
 * @returns Its value, or null.
 */
const attribute = (element: XmlElement | undefined, name: string): string | null => {
  const value = element?.attributes[name];

  return value === undefined || value === '' ? null : value;
};

/**
 * Whether an attribute says yes, as Plex writes it.
 *
 * @param element - The element.
 * @param name - The attribute.
 * @returns Whether it is `1` or `true`.
 */
const isSet = (element: XmlElement | undefined, name: string): boolean =>
  ['1', 'true'].includes((attribute(element, name) ?? '').toLowerCase());

/**
 * Reads the people a Plex server's owner shares it with, from plex.tv: the owner, the members of the
 * owner's Plex Home and the friends the server is shared with, each with the token plex.tv holds
 * for them on this server, the libraries shared with them and their restrictions.
 *
 * @param plexTv - How to read plex.tv as the owner.
 * @param machineId - The server's machine identifier.
 * @returns Everybody who can use the server.
 */
const readPlexPeople = async (plexTv: SourceCaller, machineId: string): Promise<PlexPerson[]> => {
  const [ownerXml, homeXml, usersXml, sharedXml] = await Promise.all([
    plexTv.text('/api/v2/user'),
    plexTv.text('/api/home/users').catch(() => ''),
    plexTv.text('/api/users/').catch(() => ''),
    plexTv.text(`/api/servers/${encodeURIComponent(machineId)}/shared_servers`).catch(() => ''),
  ]);
  const owner = findXmlElements(readXmlElements(ownerXml), 'user')[0];
  const ownerId = attribute(owner, 'id') ?? '1';
  const homeUsers = findXmlElements(readXmlElements(homeXml), 'User');
  const friends = findXmlElements(readXmlElements(usersXml), 'User');
  const shared = new Map(
    findXmlElements(readXmlElements(sharedXml), 'SharedServer').map((server) => [
      attribute(server, 'userID') ?? '',
      server,
    ]),
  );
  const filtersOf = new Map(friends.map((friend) => [attribute(friend, 'id') ?? '', friend]));
  const people = new Map<string, PlexPerson>();

  const describe = (element: XmlElement | undefined, id: string, isHome: boolean): PlexPerson => {
    const share = shared.get(id);
    const filters = filtersOf.get(id);
    const sections = findXmlElements(share?.children ?? [], 'Section')
      .filter((section) => isSet(section, 'shared'))
      .flatMap((section) => {
        const key = attribute(section, 'key');

        return key === null ? [] : [key];
      });

    return {
      id,
      name:
        attribute(element, 'title') ??
        attribute(element, 'friendlyName') ??
        attribute(element, 'username') ??
        id,
      username: attribute(element, 'username'),
      email: attribute(element, 'email'),
      thumb: attribute(element, 'thumb'),
      isOwner: id === ownerId,
      isHome,
      isProtected: isSet(element, 'protected'),
      restrictionProfile: attribute(element, 'restrictionProfile'),
      filterMovies: attribute(filters, 'filterMovies') ?? attribute(element, 'filterMovies'),
      filterTelevision:
        attribute(filters, 'filterTelevision') ?? attribute(element, 'filterTelevision'),
      sharedToken: attribute(share, 'accessToken'),
      libraryKeys: share === undefined || isSet(share, 'allLibraries') ? 'all' : sections,
    };
  };

  people.set(ownerId, { ...describe(owner, ownerId, true), isProtected: false });

  for (const member of homeUsers) {
    const id = attribute(member, 'id');

    if (id !== null && !people.has(id)) {
      people.set(id, describe(member, id, true));
    }
  }

  for (const friend of friends) {
    const id = attribute(friend, 'id');
    const onThisServer = findXmlElements(friend.children, 'Server').some(
      (server) => attribute(server, 'machineIdentifier') === machineId,
    );

    if (id !== null && !people.has(id) && (onThisServer || shared.has(id))) {
      people.set(id, describe(friend, id, isSet(friend, 'home')));
    }
  }

  return [...people.values()];
};

export type { PlexPerson };

export { readPlexPeople };
