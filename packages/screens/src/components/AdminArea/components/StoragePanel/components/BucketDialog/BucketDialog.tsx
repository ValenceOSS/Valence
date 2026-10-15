import { useEffect, useState } from 'react';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Form } from '@ValenceUI/Form';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { addBucket, changeBucket, testBucket } from '@ValenceClient/admin/fetchBuckets';
import { BUCKET_PROVIDERS } from '@ValenceContracts/schemas/Bucket';
import { TryItButton } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton';
import type { BucketChange } from '@ValenceContracts/schemas/Bucket';
import type { TryVerdict } from '@ValenceScreens/components/AdminArea/components/TryItButton/TryItButton.types';
import type { BucketDialogProps } from './BucketDialog.types';
import { say } from '@ValenceI18n/say';

const PROVIDER_NAMES: Record<(typeof BUCKET_PROVIDERS)[number], string> = {
  AWS: say('screens.adminArea.bucketDialog.amazonS3'),
  Cloudflare: say('screens.adminArea.bucketDialog.cloudflareR2'),
  Minio: say('screens.adminArea.bucketDialog.minio'),
  Wasabi: say('screens.adminArea.bucketDialog.wasabi'),
  Other: say('screens.adminArea.bucketDialog.anotherS3CompatibleService'),
};

const PROVIDERS = BUCKET_PROVIDERS.map((id) => ({ id, label: PROVIDER_NAMES[id] }));

type Values = Omit<Required<BucketChange>, 'secretAccessKey'> & { secretAccessKey: string };

const EMPTY: Values = {
  name: '',
  provider: 'AWS',
  endpoint: '',
  region: '',
  bucket: '',
  prefix: '',
  accessKeyId: '',
  secretAccessKey: '',
};

/**
 * Adds an S3-compatible bucket for libraries to read from, or changes one: which service, where it
 * is, the bucket and the folder in it, and the key it is reached with, which can be tried before it
 * is saved. A secret is never shown back, and leaving it empty keeps the one saved.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param bucket - The bucket being changed, or null to add one.
 * @param onClose - Called when it is dismissed.
 * @param onSaved - Called once it is saved.
 */
const BucketDialog = ({ isOpen, bucket, onClose, onSaved }: BucketDialogProps) => {
  const [values, setValues] = useState<Values>(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTrying, setIsTrying] = useState(false);
  const [verdict, setVerdict] = useState<TryVerdict>(null);
  const [folders, setFolders] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(bucket === null ? EMPTY : { ...bucket, secretAccessKey: '' });
    setProblem(null);
    setVerdict(null);
    setFolders(null);
  }, [isOpen, bucket]);

  const change = (patch: Partial<Values>) => {
    setValues((was) => ({ ...was, ...patch }));
    setVerdict(null);
  };

  const isComplete =
    values.name.trim() !== '' &&
    values.bucket.trim() !== '' &&
    values.accessKeyId.trim() !== '' &&
    (bucket !== null || values.secretAccessKey !== '');

  const tryIt = async () => {
    setIsTrying(true);
    setProblem(null);

    const tried = await testBucket(values, bucket?.id ?? null);

    setIsTrying(false);

    if (tried.kind === 'reached') {
      setVerdict('working');
      setFolders(tried.folders);

      return;
    }

    setVerdict('failing');
    setFolders(null);
    setProblem(tried.reason);
  };

  const save = async () => {
    setIsSaving(true);

    const refused =
      bucket === null ? await addBucket(values) : await changeBucket(bucket.id, values);

    setIsSaving(false);

    if (refused !== null) {
      setProblem(refused.message);

      return;
    }

    onSaved();
    onClose();
  };

  const title =
    bucket === null
      ? say('screens.adminArea.bucketDialog.addABucket')
      : say('common.changeName', { name: bucket.name });

  return (
    <DialogCompanion label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.adminArea.bucketDialog.itIsMountedAsAFolder')}
      />

      <Form
        label={title}
        isDialog
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <DialogContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <TextField
              label={say('common.name')}
              value={values.name}
              onValueChange={(name) => {
                change({ name });
              }}
              placeholder={say('screens.adminArea.bucketDialog.filmsInTheCloud')}
              required
            />

            <SelectField
              label={say('screens.adminArea.bucketDialog.service')}
              options={PROVIDERS}
              value={values.provider}
              onSelect={(id) => {
                const picked = PROVIDERS.find((one) => one.id === id);

                if (picked !== undefined) {
                  change({ provider: picked.id });
                }
              }}
            />
          </div>

          <HeadedSection title={say('common.connection')}>
            <div className="flex flex-col gap-4">
              <TextField
                label={say('screens.adminArea.bucketDialog.endpoint')}
                type="url"
                value={values.endpoint}
                onValueChange={(endpoint) => {
                  change({ endpoint });
                }}
                placeholder="https://s3.eu-west-2.amazonaws.com"
                description={say('screens.adminArea.bucketDialog.leaveEmptyForAmazonS3')}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={say('screens.adminArea.bucketDialog.bucket')}
                  value={values.bucket}
                  onValueChange={(name) => {
                    change({ bucket: name });
                  }}
                  required
                />

                <TextField
                  label={say('screens.adminArea.bucketDialog.region')}
                  value={values.region}
                  onValueChange={(region) => {
                    change({ region });
                  }}
                  placeholder="eu-west-2"
                />
              </div>

              <TextField
                label={say('screens.adminArea.bucketDialog.folderInTheBucket')}
                value={values.prefix}
                onValueChange={(prefix) => {
                  change({ prefix });
                }}
                placeholder={say('screens.adminArea.bucketDialog.media')}
                description={say('screens.adminArea.bucketDialog.leaveEmptyForTheWholeBucket')}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label={say('screens.adminArea.bucketDialog.accessKeyId')}
                  value={values.accessKeyId}
                  onValueChange={(accessKeyId) => {
                    change({ accessKeyId });
                  }}
                  autoComplete="off"
                  required
                />

                <TextField
                  label={say('screens.adminArea.bucketDialog.secretAccessKey')}
                  type="password"
                  value={values.secretAccessKey}
                  onValueChange={(secretAccessKey) => {
                    change({ secretAccessKey });
                  }}
                  autoComplete="off"
                  {...(bucket === null
                    ? {}
                    : { description: say('screens.adminArea.indexerDialog.aKeyIsKeptTypeA') })}
                />
              </div>
            </div>
          </HeadedSection>

          {folders === null ? null : (
            <p role="status" className="text-sm text-text-muted">
              {folders.length === 0
                ? say('screens.adminArea.bucketDialog.reachedItIsEmpty')
                : say('screens.adminArea.bucketDialog.reachedItHoldsFolders', {
                    folders: folders.join(', '),
                  })}
            </p>
          )}
        </DialogContent>

        <DialogFooter
          note={problem}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: bucket === null ? say('common.add') : say('common.save'),
            isSubmit: true,
            isLoading: isSaving,
            isDisabled: !isComplete || isTrying,
          }}
        >
          <TryItButton
            isTrying={isTrying}
            verdict={verdict}
            isDisabled={!isComplete}
            onTry={() => {
              void tryIt();
            }}
          />
        </DialogFooter>
      </Form>
    </DialogCompanion>
  );
};

BucketDialog.displayName = 'BucketDialog';

export { BucketDialog };
