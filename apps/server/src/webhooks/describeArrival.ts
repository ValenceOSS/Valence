import { sayCount } from '@ValenceI18n/sayCount';
import type { ArrivedTitle } from '@ValenceContracts/schemas/Webhook';

/**
 * Says what arrived under one title, as a line in a notification.
 *
 * A programme is named once with a count beside it, because somebody reading that their library
 * grew wants to know which programmes and how much of each — not the title of every episode, which
 * is a wall of text that names a fraction of what actually arrived.
 *
 * One thing arriving is said by name alone: "Brazil (1985) — 1 episode" would be nonsense for a
 * film, and is no better for a single episode.
 *
 * @param arrival - The title, and how many of it arrived.
 * @returns The line to show.
 */
const describeArrival = (arrival: ArrivedTitle): string =>
  arrival.episodes <= 1
    ? arrival.title
    : sayCount('server.webhook.arrivalEpisodes', arrival.episodes, { title: arrival.title });

export { describeArrival };
