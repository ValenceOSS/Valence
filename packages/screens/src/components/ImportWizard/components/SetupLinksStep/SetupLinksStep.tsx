import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Spinner } from '@ValenceUI/Spinner';
import { emailSetupLink } from '@ValenceClient/admin/emailSetupLink';
import { makeImportSetupLinks } from '@ValenceClient/imports/makeImportSetupLinks';
import type { ImportedSetupLink, ImportedSetupLinks } from '@ValenceContracts/schemas/MediaImport';
import { DEFAULT_SETUP_LINK_LIFETIME } from '@ValenceContracts/schemas/SetupLink';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { LifetimeChoice } from '@ValenceScreens/components/LifetimeChoice/LifetimeChoice';
import { SetupLinkHandover } from '@ValenceScreens/components/SetupLinkHandover/SetupLinkHandover';
import { ImportReportView } from '@ValenceScreens/components/ImportWizard/components/ImportReportView/ImportReportView';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import type { SetupLinksStepProps } from './SetupLinksStep.types';

/**
 * The end of bringing everything across: each person the import added, with the link they sign in
 * with the first time, to copy or to send by email where email is on, and what the import did.
 *
 * @param run - The finished import.
 * @param onFinish - Told when the administrator is done.
 */
const SetupLinksStep = ({ run, onFinish }: SetupLinksStepProps) => {
  const [lifetime, setLifetime] = useState<SetupLinkLifetime>(DEFAULT_SETUP_LINK_LIFETIME);
  const [links, setLinks] = useState<ImportedSetupLinks | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const make = useCallback(
    async (days: SetupLinkLifetime) => {
      setProblem(null);

      const answer = await makeImportSetupLinks(run.id, days);

      if (answer.kind === 'refused') {
        setProblem(answer.refusal?.message ?? say('error.common.thatCouldNotBeDone'));

        return;
      }

      setLinks(answer.value);
    },
    [run.id],
  );

  useEffect(() => {
    void make(lifetime);
  }, [make, lifetime]);

  const send = async (link: ImportedSetupLink) => {
    setSending(link.userId);

    const answer = await emailSetupLink(link.userId, {
      held: { url: link.url, expiresAt: link.expiresAt },
    });

    setSending(null);
    tellOutcome(
      say('screens.importWizard.setupLinksStep.sentNamesLink', { name: link.name }),
      failureOfRefusal(answer.kind === 'refused' ? answer.refusal : null),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PanelCard title={say('screens.importWizard.setupLinksStep.signingInTheFirstTime')}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            {say('screens.importWizard.setupLinksStep.passwordsCannotBeCopied')}
          </p>

          <LifetimeChoice value={lifetime} onChoose={setLifetime} />

          {problem === null ? null : <Callout tone="danger" title={problem} />}

          {links === null && problem === null ? (
            <Spinner
              isCentered
              size="sm"
              label={say('screens.importWizard.setupLinksStep.makingTheLinks')}
            />
          ) : null}

          {links !== null && links.links.length === 0 ? (
            <p className="text-sm text-text-muted">
              {say('screens.importWizard.setupLinksStep.nobodyNewWasAdded')}
            </p>
          ) : null}

          {(links?.links ?? []).map((link) => (
            <SetupLinkHandover
              key={link.userId}
              link={{ url: link.url, expiresAt: link.expiresAt }}
              name={link.name}
              isEmailing={sending === link.userId}
              onEmail={
                links?.canEmail === true && link.hasEmail
                  ? () => {
                      void send(link);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </PanelCard>

      {run.report === null ? null : <ImportReportView report={run.report} />}

      <div className="flex justify-end">
        <Button variant="confirm" size="lg" onClick={onFinish}>
          {say('common.done')}
        </Button>
      </div>
    </div>
  );
};

SetupLinksStep.displayName = 'SetupLinksStep';

export { SetupLinksStep };
