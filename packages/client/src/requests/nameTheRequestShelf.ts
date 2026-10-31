import { say } from '@ValenceI18n/say';
import type { RequestShelf } from '@ValenceClient/requests/shelfOfRequest';

/**
 * What a part of the requests list is called, by what its requests need next.
 *
 * @param shelf - The part of the list.
 * @returns Its heading.
 */
const nameTheRequestShelf = (shelf: RequestShelf): string => {
  switch (shelf) {
    case 'approve':
      return say('client.requests.nameTheStanding.waitingForApproval');
    case 'progress':
      return say('common.inProgress');
    case 'coming':
      return say('common.notOutYet');
    case 'wanted':
      return say('client.requests.titleStatusNames.missing');
    case 'here':
      return say('common.inTheLibrary');
    case 'refused':
      return say('common.refused');
  }
};

export { nameTheRequestShelf };
