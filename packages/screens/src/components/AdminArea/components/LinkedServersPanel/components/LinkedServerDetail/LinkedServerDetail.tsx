import { SharingCard } from './components/SharingCard/SharingCard';
import { TheirLibrariesCard } from './components/TheirLibrariesCard/TheirLibrariesCard';
import { RemotePeopleCard } from './components/RemotePeopleCard/RemotePeopleCard';
import { LinkActivityCard } from './components/LinkActivityCard/LinkActivityCard';
import type { LinkedServerDetailProps } from './LinkedServerDetail.types';

/**
 * Everything between this server and one it is linked with: what each shares with the other, the
 * people from there and a way to block them, and the record of what each asked the other for.
 *
 * @param server - The linked server.
 * @param thisServer - What this server is called, as the other one shows it.
 */
const LinkedServerDetail = ({ server, thisServer }: LinkedServerDetailProps) => (
  <div className="flex flex-col gap-4">
    <div className="grid gap-4 lg:grid-cols-2">
      <SharingCard server={server} thisServer={thisServer} />
      <TheirLibrariesCard server={server} />
    </div>
    <RemotePeopleCard server={server} />
    <LinkActivityCard server={server} thisServer={thisServer} />
  </div>
);

LinkedServerDetail.displayName = 'LinkedServerDetail';

export { LinkedServerDetail };
