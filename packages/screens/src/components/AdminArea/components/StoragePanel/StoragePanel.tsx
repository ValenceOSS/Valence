import { Cloud as EmptyCloudIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { PanelCard } from '@ValenceUI/PanelCard';
import { BucketDialog } from '@ValenceScreens/components/AdminArea/components/StoragePanel/components/BucketDialog/BucketDialog';
import { bucketQueries } from '@ValenceClient/query/bucketQueries';
import { removeBucket } from '@ValenceClient/admin/fetchBuckets';
import type { Bucket, BucketState } from '@ValenceContracts/schemas/Bucket';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import { say } from '@ValenceI18n/say';

const STATES: Record<BucketState['state'], { label: string; tone: BadgeTone }> = {
  mounted: { label: say('screens.adminArea.storagePanel.mounted'), tone: 'success' },
  mounting: { label: say('screens.adminArea.storagePanel.mounting'), tone: 'busy' },
  failed: { label: say('screens.adminArea.storagePanel.notMounted'), tone: 'danger' },
  unavailable: { label: say('screens.adminArea.storagePanel.cannotMountHere'), tone: 'warning' },
};

/**
 * The S3-compatible buckets libraries can read from — Amazon S3, Cloudflare R2, Backblaze B2,
 * MinIO and the rest — each mounted as a folder of its own, with how its mount is doing and why it
 * failed where it did. A library is then pointed at the bucket's folder like any other, and
 * scanning, playing, downloading and requests work on it unchanged.
 */
const StoragePanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(bucketQueries.all());
  const [editing, setEditing] = useState<Bucket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const title = say('screens.adminArea.storagePanel.buckets');

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: bucketQueries.key });
  };

  const remove = async (bucket: Bucket) => {
    const refused = await removeBucket(bucket.id);

    if (refused !== null) {
      notify.failed(refused.message);

      return;
    }

    refresh();
  };

  return (
    <PanelCard
      title={title}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setIsOpen(true);
          }}
        >
          <Icon of={PlusIcon} size={16} />
          {say('screens.adminArea.bucketDialog.addABucket')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          {say('screens.adminArea.storagePanel.eachBucketIsMountedAsA')}
        </p>

        {asked.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.storagePanel.theBucketsCouldNotBeRead')}
            isTryingAgain={asked.isFetching}
            onTryAgain={() => {
              void asked.refetch();
            }}
          />
        ) : asked.isPending ? (
          <Spinner
            isCentered
            size="sm"
            label={say('screens.adminArea.storagePanel.readingTheBuckets')}
          />
        ) : (
          <>
            {asked.data.canMount ? null : (
              <p role="alert" className="text-sm text-text-muted">
                {say('screens.adminArea.storagePanel.thisServerCannotMountBuckets')}
              </p>
            )}

            {asked.data.buckets.length === 0 ? (
              <NothingHere
                of={EmptyCloudIcon}
                title={say('screens.adminArea.storagePanel.noBucketsYet')}
                isCompact
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {asked.data.buckets.map((bucket) => (
                  <li
                    key={bucket.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium text-text">{bucket.name}</span>
                      <span className="truncate font-mono text-xs text-text-muted">
                        {bucket.path}
                      </span>
                      {bucket.status.state === 'failed' ? (
                        <span className="text-xs text-danger">{bucket.status.reason}</span>
                      ) : null}
                    </span>

                    <Badge size="sm" tone={STATES[bucket.status.state].tone}>
                      {STATES[bucket.status.state].label}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      label={say('common.changeName', { name: bucket.name })}
                      onClick={() => {
                        setEditing(bucket);
                        setIsOpen(true);
                      }}
                    >
                      {say('common.change')}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      label={say('common.forgetName', { name: bucket.name })}
                      onClick={() => {
                        void remove(bucket);
                      }}
                    >
                      {say('common.forget')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <BucketDialog
        isOpen={isOpen}
        bucket={editing}
        onClose={() => {
          setIsOpen(false);
        }}
        onSaved={refresh}
      />
    </PanelCard>
  );
};

StoragePanel.displayName = 'StoragePanel';

export { StoragePanel };
