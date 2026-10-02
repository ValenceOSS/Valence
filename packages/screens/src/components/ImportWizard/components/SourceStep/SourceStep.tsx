import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { TextField } from '@ValenceUI/TextField';
import { connectImportSource } from '@ValenceClient/imports/connectImportSource';
import { forgetImportSource } from '@ValenceClient/imports/forgetImportSource';
import { MediaImportKindSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportKind } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { SourceStepProps } from './SourceStep.types';

/**
 * The words that help somebody find what each kind of server asks for.
 *
 * @param kind - The kind of server.
 * @returns Its name, an example address, what its key is called and where to find it.
 */
const wordsFor = (kind: MediaImportKind) =>
  kind === 'plex'
    ? {
        title: say('screens.importWizard.sourceStep.plex'),
        address: say('screens.importWizard.sourceStep.plexAddressExample'),
        key: say('screens.importWizard.sourceStep.plexToken'),
        where: say('screens.importWizard.sourceStep.whereToFindAPlexToken'),
      }
    : kind === 'emby'
      ? {
          title: say('screens.importWizard.sourceStep.emby'),
          address: say('screens.importWizard.sourceStep.mediaBrowserAddressExample'),
          key: say('common.aPIKey'),
          where: say('screens.importWizard.sourceStep.whereToFindAnEmbyKey'),
        }
      : {
          title: say('screens.importWizard.sourceStep.jellyfin'),
          address: say('screens.importWizard.sourceStep.mediaBrowserAddressExample'),
          key: say('common.aPIKey'),
          where: say('screens.importWizard.sourceStep.whereToFindAJellyfinKey'),
        };

/**
 * The first step of bringing everything across: which server it comes from, where it answers and
 * its key, checked by reading it before going on, or a server connected before to carry on with.
 *
 * @param sources - The servers already connected.
 * @param onConnected - Told the server to go on with.
 * @param onForgotten - Told when a connected server is forgotten.
 */
const SourceStep = ({ sources, onConnected, onForgotten }: SourceStepProps) => {
  const [kind, setKind] = useState<MediaImportKind>('jellyfin');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const words = wordsFor(kind);

  const connect = async () => {
    setIsConnecting(true);
    setProblem(null);

    const answer = await connectImportSource({ kind, url: url.trim(), token: token.trim() });

    setIsConnecting(false);

    if (answer.kind === 'refused') {
      setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

      return;
    }

    onConnected(answer.value);
  };

  return (
    <div className="flex flex-col gap-6">
      {sources.length === 0 ? null : (
        <PanelCard title={say('screens.importWizard.sourceStep.connectedBefore')}>
          <ul className="flex flex-col gap-2">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-text">
                  {say('screens.importWizard.sourceStep.nameAtAddress', {
                    name: source.name,
                    address: source.url,
                  })}
                </span>

                <span className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void forgetImportSource(source.id).then((answer) => {
                        if (answer.kind === 'answered') {
                          onForgotten(source.id);
                        }
                      });
                    }}
                  >
                    {say('common.forget')}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onConnected(source);
                    }}
                  >
                    {say('screens.importWizard.sourceStep.carryOn')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <PanelCard title={say('screens.importWizard.sourceStep.whereIsEverythingNow')}>
        <div className="flex flex-col gap-4">
          <ChoiceList
            label={say('screens.importWizard.sourceStep.whereIsEverythingNow')}
            value={kind}
            onChoose={(chosen) => {
              const read = MediaImportKindSchema.safeParse(chosen);

              if (read.success) {
                setKind(read.data);
              }
            }}
            look="tiles"
            choices={(['jellyfin', 'emby', 'plex'] as const).map((one) => ({
              id: one,
              title: wordsFor(one).title,
              detail:
                one === 'plex'
                  ? say('screens.importWizard.sourceStep.signsInWithAPlexToken')
                  : say('screens.importWizard.sourceStep.signsInWithAnApiKey'),
            }))}
          />

          <TextField
            label={say('common.address')}
            type="url"
            value={url}
            onValueChange={setUrl}
            placeholder={words.address}
            autoComplete="url"
            description={say('screens.importWizard.sourceStep.theAddressValenceCanReachItOn')}
          />

          <TextField
            label={words.key}
            type="password"
            value={token}
            onValueChange={setToken}
            description={words.where}
            autoComplete="new-password"
            {...(problem === null ? {} : { error: problem })}
          />

          <div className="flex justify-end">
            <Button
              variant="confirm"
              size="lg"
              isLoading={isConnecting}
              disabled={url.trim() === '' || token.trim() === ''}
              onClick={() => {
                void connect();
              }}
            >
              {say('screens.importWizard.sourceStep.connect')}
            </Button>
          </div>
        </div>
      </PanelCard>
    </div>
  );
};

SourceStep.displayName = 'SourceStep';

export { SourceStep };
