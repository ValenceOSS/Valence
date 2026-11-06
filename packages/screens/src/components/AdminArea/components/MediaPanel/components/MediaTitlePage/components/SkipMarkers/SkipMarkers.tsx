import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X as XIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { secondsOfClock } from '@ValenceCore/functions/secondsOfClock';
import { SEGMENT_KINDS } from '@ValenceContracts/schemas/MediaSegment';
import { saveSegments } from '@ValenceClient/admin/saveSegments';
import { nameOfSegment } from '@ValenceClient/playback/nameOfSegment';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import type { SegmentKind } from '@ValenceContracts/schemas/MediaSegment';
import type { SkipMarkersProps } from './SkipMarkers.types';
import { say } from '@ValenceI18n/say';

type Draft = { key: number; kind: SegmentKind; start: string; end: string };

const KINDS = SEGMENT_KINDS.map((kind) => ({ id: kind, label: nameOfSegment(kind) }));

/**
 * A file's skip markers on its Files tab: where the player offers to skip its intro, recap, credits
 * or preview, each with when it starts and ends, added, changed or taken off by hand and saved
 * together, to be kept through every detection run after.
 *
 * @param mediaId - The file.
 */
const SkipMarkers = ({ mediaId }: SkipMarkersProps) => {
  const cache = useQueryClient();
  const held = useQuery(playbackQueries.segments(mediaId));
  const [drafts, setDrafts] = useState<readonly Draft[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const shown: readonly Draft[] =
    drafts ??
    (held.data ?? []).map((segment, at) => ({
      key: at,
      kind: segment.kind,
      start: formatDuration(segment.startSeconds),
      end: formatDuration(segment.endSeconds),
    }));
  const read = shown.map((draft) => ({
    kind: draft.kind,
    startSeconds: secondsOfClock(draft.start),
    endSeconds: secondsOfClock(draft.end),
  }));
  const isReadable = read.every(
    (one) =>
      one.startSeconds !== null && one.endSeconds !== null && one.endSeconds > one.startSeconds,
  );

  const change = (key: number, next: Partial<Draft>) => {
    setDrafts(shown.map((draft) => (draft.key === key ? { ...draft, ...next } : draft)));
  };

  const save = async () => {
    setIsSaving(true);

    const saved = await saveSegments(
      mediaId,
      read.flatMap((one) =>
        one.startSeconds === null || one.endSeconds === null
          ? []
          : [{ kind: one.kind, startSeconds: one.startSeconds, endSeconds: one.endSeconds }],
      ),
    );

    setIsSaving(false);

    if ('problem' in saved) {
      notify.failed(saved.problem);

      return;
    }

    cache.setQueryData(playbackQueries.segments(mediaId).queryKey, saved);
    setDrafts(null);
    notify.worked(say('screens.adminArea.skipMarkers.markersSaved'));
  };

  return (
    <PanelCard title={say('screens.adminArea.skipMarkers.skipMarkers')}>
      <div className="flex flex-col gap-3">
        <p className="font-body text-xs text-text-muted">
          {say('screens.adminArea.skipMarkers.whereThePlayerOffersToSkip')}
        </p>
        {shown.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            {say('screens.adminArea.skipMarkers.noMarkersYet')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shown.map((draft) => (
              <li key={draft.key} className="flex flex-wrap items-end gap-2">
                <SelectField
                  label={say('screens.adminArea.skipMarkers.whatItIs')}
                  isLabelHidden
                  size="sm"
                  options={KINDS}
                  value={draft.kind}
                  onSelect={(id) => {
                    const kind = SEGMENT_KINDS.find((one) => one === id);

                    if (kind !== undefined) {
                      change(draft.key, { kind });
                    }
                  }}
                  className="w-36"
                />
                <TextField
                  label={say('screens.adminArea.skipMarkers.startsAt')}
                  isLabelHidden
                  size="sm"
                  placeholder={say('screens.adminArea.skipMarkers.startsAt')}
                  value={draft.start}
                  onValueChange={(start) => {
                    change(draft.key, { start });
                  }}
                  className="w-28"
                />
                <TextField
                  label={say('screens.adminArea.skipMarkers.endsAt')}
                  isLabelHidden
                  size="sm"
                  placeholder={say('screens.adminArea.skipMarkers.endsAt')}
                  value={draft.end}
                  onValueChange={(end) => {
                    change(draft.key, { end });
                  }}
                  className="w-28"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  label={say('screens.adminArea.skipMarkers.removeThisMarker')}
                  onClick={() => {
                    setDrafts(shown.filter((one) => one.key !== draft.key));
                  }}
                >
                  <Icon of={XIcon} size={15} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {isReadable ? null : (
          <p className="font-body text-xs text-danger">
            {say('screens.adminArea.skipMarkers.writeAsAClock')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDrafts([
                ...shown,
                {
                  key: Math.max(-1, ...shown.map((one) => one.key)) + 1,
                  kind: 'intro',
                  start: '',
                  end: '',
                },
              ]);
            }}
          >
            {say('screens.adminArea.skipMarkers.addAMarker')}
          </Button>
          {drafts === null ? null : (
            <Button
              variant="confirm"
              size="sm"
              isLoading={isSaving}
              disabled={!isReadable}
              onClick={() => {
                void save();
              }}
            >
              {say('screens.adminArea.skipMarkers.saveMarkers')}
            </Button>
          )}
        </div>
      </div>
    </PanelCard>
  );
};

SkipMarkers.displayName = 'SkipMarkers';

export { SkipMarkers };
