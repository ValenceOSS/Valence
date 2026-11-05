import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PanelCard } from '@ValenceUI/PanelCard';
import { notify } from '@ValenceUI/notify';
import { chooseVersion } from '@ValenceClient/admin/chooseVersion';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { VersionRow } from './components/VersionRow/VersionRow';
import type { VersionChoiceRequest } from '@ValenceContracts/schemas/VersionChoice';
import type { TitleVersionsProps } from './TitleVersions.types';
import { say } from '@ValenceI18n/say';

/**
 * A film's versions on its Files tab, such as a theatrical and an extended cut: what each is
 * called, and which plays by default, each kept through every scan.
 *
 * @param versions - The versions, the one playing by default first.
 * @param paths - Where each file is, by its id.
 */
const TitleVersions = ({ versions, paths }: TitleVersionsProps) => {
  const cache = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const choose = async (mediaId: string, choice: VersionChoiceRequest) => {
    setBusy(mediaId);

    const problem = await chooseVersion(mediaId, choice);

    setBusy(null);

    if (problem !== null) {
      notify.failed(problem.problem);

      return;
    }

    notify.worked(say('screens.adminArea.titleDetails.saved'));
    await cache.invalidateQueries({ queryKey: adminQueries.key });
    await cache.invalidateQueries({ queryKey: libraryQueries.key });
  };

  return (
    <PanelCard title={say('screens.adminArea.titleVersions.versions')}>
      <div className="@container flex flex-col gap-1">
        <ul className="flex flex-col divide-y divide-line">
          {versions.map((version, at) => {
            const path = paths[version.lead.id] ?? '';

            return (
              <VersionRow
                key={version.lead.id}
                file={path.split(/[\\/]/u).at(-1) ?? version.name}
                label={version.lead.versionLabel ?? null}
                isDefault={at === 0}
                isBusy={busy === version.lead.id}
                onLabel={(label) => {
                  void choose(version.lead.id, { label });
                }}
                onDefault={() => {
                  void choose(version.lead.id, { isStanding: true });
                }}
              />
            );
          })}
        </ul>
        <p className="font-body text-xs text-text-muted">
          {say('screens.adminArea.titleVersions.namesAndTheDefaultAreKept')}
        </p>
      </div>
    </PanelCard>
  );
};

TitleVersions.displayName = 'TitleVersions';

export { TitleVersions };
