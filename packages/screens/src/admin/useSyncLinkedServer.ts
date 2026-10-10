import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { syncLinkedServer } from '@ValenceClient/admin/syncLinkedServer';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { say } from '@ValenceI18n/say';

/**
 * Reads what a linked server shares again, now, says how many titles came back, and has every list
 * of libraries and what that server shares read again after.
 *
 * @returns Which server is being read, if any, and a way to read one.
 */
const useSyncLinkedServer = (): {
  syncing: string | null;
  sync: (serverId: string, name: string) => Promise<void>;
} => {
  const cache = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);

  const sync = async (serverId: string, name: string) => {
    setSyncing(serverId);

    try {
      const sent = await syncLinkedServer(serverId);
      const isRead = tellOutcome(
        say('screens.adminArea.linkedServersPanel.readCountTitlesFromName', {
          count: String(sent.value?.kept ?? 0),
          name,
        }),
        failureOfRefusal(sent.refusal),
      );

      if (isRead) {
        await Promise.all([
          cache.invalidateQueries({ queryKey: adminQueries.theirLibraries(serverId).queryKey }),
          cache.invalidateQueries({ queryKey: libraryQueries.all().queryKey }),
        ]);
      }
    } finally {
      setSyncing(null);
    }
  };

  return { syncing, sync };
};

export { useSyncLinkedServer };
