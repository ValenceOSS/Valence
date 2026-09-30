import { SaidError } from '@ValenceI18n/SaidError';
import { saying } from '@ValenceI18n/saying';

class NotAllowedThere extends SaidError {
  public constructor(folder: string, runningAs: string) {
    super(
      saying('requests.mediaRequests.notAllowedThere.theRequestsServiceRunningAsRunningAs', {
        runningAs,
        folder,
      }),
    );
    this.name = 'NotAllowedThere';
  }
}

export { NotAllowedThere };
