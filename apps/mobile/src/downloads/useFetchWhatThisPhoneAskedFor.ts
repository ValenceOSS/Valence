import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepAFile } from '@ValenceClient/downloads/keepingFiles';
import { useHeldFiles } from '@ValenceClient/downloads/useHeldFiles';
import { downloadQueries } from '@ValenceClient/query/downloadQueries';
import { askedOnThisPhone } from '@ValenceMobile/downloads/askedOnThisPhone';
import { rememberAskedOnThisPhone } from '@ValenceMobile/downloads/rememberAskedOnThisPhone';

/**
 * Fetches to this phone anything asked for from it, as soon as the server has it ready, so that
 * asking for a download on a phone is all anybody has to do.
 */
const useFetchWhatThisPhoneAskedFor = (): void => {
  const downloads = useQuery(downloadQueries.all());
  const held = useHeldFiles();

  useEffect(() => {
    const waiting = new Set(askedOnThisPhone());
    const kept = new Set(held.map((file) => file.downloadId));

    for (const download of downloads.data ?? []) {
      if (!waiting.has(download.id)) {
        continue;
      }

      if (kept.has(download.id)) {
        rememberAskedOnThisPhone(download.id, false);

        continue;
      }

      if (download.state === 'ready') {
        rememberAskedOnThisPhone(download.id, false);
        void keepAFile(download);
      }
    }
  }, [downloads.data, held]);
};

export { useFetchWhatThisPhoneAskedFor };
