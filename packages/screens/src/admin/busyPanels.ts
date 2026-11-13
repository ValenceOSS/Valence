import type { Job } from '@ValenceClient/admin/fetchAdmin';
import type { AdminPanelId } from '@ValenceScreens/components/AdminArea/adminSections';

const PANEL_OF_KIND: Readonly<Record<string, AdminPanelId>> = {
  preview: 'media',
  thumbnails: 'media',
  fingerprint: 'media',
  creditFrames: 'media',
  keyframes: 'media',
  renditions: 'encoding',
};

/**
 * Works out which admin pages have work under way, so the way to each can say so: a job reading a
 * library belongs to the libraries page, the media service's work on files to the media page, and
 * encoding other qualities to the encoding page. Every running job is shown on the jobs page as
 * well, since that is where all of them are listed.
 *
 * @param jobs - The jobs the queue reports.
 * @returns The pages with something running.
 */
const busyPanels = (jobs: readonly Job[]): ReadonlySet<string> => {
  const running = jobs.filter((job) => job.state === 'running');
  const busy = new Set<AdminPanelId>();

  for (const job of running) {
    busy.add('jobs');

    const panel = job.kind.startsWith('library.') ? 'libraries' : PANEL_OF_KIND[job.kind];

    if (panel !== undefined) {
      busy.add(panel);
    }
  }

  return busy;
};

export { busyPanels };
