import type { SmartRuleKind } from '@ValenceClient/smart/SmartDraft';
import { say } from '@ValenceI18n/say';

/**
 * What a kind of smart rule is called in the rule editor.
 *
 * @param kind - The kind of rule.
 * @returns Its name.
 */
const nameSmartRuleKind = (kind: SmartRuleKind): string => {
  switch (kind) {
    case 'liked':
      return say('screens.smartRules.liked');
    case 'followedArtist':
      return say('screens.smartRules.byAnArtistYouFollow');
    case 'genre':
      return say('common.genre');
    case 'released':
      return say('client.library.describeTitleDetails.released');
    case 'plays':
      return say('screens.smartRules.timesPlayed');
    case 'lastPlayed':
      return say('screens.smartRules.lastPlayed');
    case 'added':
      return say('common.added');
    case 'runtime':
      return say('server.webhooks.discordEmbedFor.runtime');
    case 'watched':
      return say('common.watched');
    case 'rating':
      return say('common.rating');
    case 'yourStars':
      return say('screens.smartRules.yourStars');
    case 'library':
      return say('common.library');
    case 'ageRating':
      return say('screens.smartRules.ageRating');
  }
};

export { nameSmartRuleKind };
