import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Link } from '@ValenceUI/Link';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { saveEmailSetup } from '@ValenceClient/admin/saveEmailSetup';
import { sendTestEmail } from '@ValenceClient/admin/sendTestEmail';
import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { EMAIL_SECURITIES } from '@ValenceContracts/schemas/EmailSettings';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { RecentEmails } from './components/RecentEmails/RecentEmails';
import type { EmailSetup, EmailSetupChange } from '@ValenceContracts/schemas/EmailSetup';
import { say } from '@ValenceI18n/say';

type Draft = Omit<EmailSetupChange, 'password'> & { password: string };

const RESEND = {
  host: 'smtp.resend.com',
  port: 465,
  security: 'tls',
  username: 'resend',
} as const;

const SECURITY_CHOICES = [
  { id: 'tls', label: say('screens.adminArea.emailCard.tls') },
  { id: 'starttls', label: say('screens.adminArea.emailCard.starttls') },
  { id: 'none', label: say('common.none') },
] as const;

const EMAIL_DOCS = `${DOCS_ADDRESS}/use/email`;

/**
 * The draft a form starts from: what is saved, with the password left empty to keep it.
 *
 * @param setup - The setup as saved.
 * @returns The draft.
 */
const draftOf = (setup: EmailSetup): Draft => ({
  isEnabled: setup.isEnabled,
  host: setup.host,
  port: setup.port,
  security: setup.security,
  username: setup.username,
  password: '',
  fromName: setup.fromName,
  fromAddress: setup.fromAddress,
  sendsPasswordResets: setup.sendsPasswordResets,
  sendsSetupLinks: setup.sendsSetupLinks,
});

/**
 * Email, where it is set up: the operator's own mail server and the address Valence sends as, what
 * it sends, a test, and the emails it tried lately with why any failed. Says plainly that addresses
 * and what each email says go to the mail provider, and fills in Resend's server for whoever uses it.
 */
const EmailCard = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.emailSetup());
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [port, setPort] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [tested, setTested] = useState<{ to: string; problem: string | null } | null>(null);
  const setup = asked.data;
  const title = say('common.email');

  useEffect(() => {
    if (setup === undefined || draft !== null) {
      return;
    }

    setDraft(draftOf(setup));
    setPort(setup.port.toString());
  }, [setup, draft]);

  if (asked.isError) {
    return (
      <PanelCard title={title}>
        <CouldNotRead
          said={say('screens.adminArea.emailCard.theEmailSettingsCouldNotBe')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </PanelCard>
    );
  }

  if (setup === undefined || draft === null) {
    return (
      <PanelCard title={title}>
        <Spinner
          isCentered
          label={say('screens.adminArea.emailCard.readingTheEmailSettings')}
          size="sm"
        />
      </PanelCard>
    );
  }

  const portNumber = Number(port);
  const isPortValid = Number.isInteger(portNumber) && portNumber >= 1 && portNumber <= 65_535;
  const chosen: Draft = { ...draft, port: isPortValid ? portNumber : setup.port };
  const isChanged =
    JSON.stringify(chosen) !== JSON.stringify(draftOf(setup)) || chosen.password !== '';
  const isFixed = setup.isFromEnvironment;

  const change = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
  };

  const save = async () => {
    setIsSaving(true);

    const answer = await saveEmailSetup(chosen);

    setIsSaving(false);

    if (
      tellOutcome(
        say('screens.adminArea.emailCard.savedTheEmailSettings'),
        failureOfMissing(answer),
      ) &&
      answer !== null
    ) {
      cache.setQueryData(adminQueries.emailSetup().queryKey, answer);
      setDraft(draftOf(answer));
      setPort(answer.port.toString());
    }
  };

  const test = async () => {
    setIsTesting(true);

    const answer = await sendTestEmail(testTo.trim());

    setIsTesting(false);
    setTested({
      to: testTo.trim(),
      problem:
        answer === null
          ? say('error.common.thatCouldNotBeDone')
          : answer.problem === null
            ? null
            : sayAgain(answer.problem),
    });
    void cache.invalidateQueries({ queryKey: adminQueries.emailSetup().queryKey });
  };

  return (
    <PanelCard title={title}>
      <div className="flex flex-col gap-5">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.emailCard.sendPasswordResetLinksAndSetup')}{' '}
          <Link href={EMAIL_DOCS}>{say('screens.adminArea.emailCard.howToSetUpEmail')}</Link>
        </p>

        {isFixed ? (
          <Callout tone="quiet" title={say('screens.adminArea.emailCard.setByTheEnvironment')}>
            {say('screens.adminArea.emailCard.smtpUrlIsSetSoTheMail')}
          </Callout>
        ) : null}

        <SettingList>
          {isFixed ? null : (
            <SettingRow
              title={say('screens.adminArea.emailCard.sendEmail')}
              description={say('screens.adminArea.emailCard.nothingIsEmailedWhileThisIs')}
            >
              <Switch
                label={say('screens.adminArea.emailCard.sendEmail')}
                isLabelHidden
                isOn={draft.isEnabled}
                onToggle={() => {
                  change({ isEnabled: !draft.isEnabled });
                }}
              />
            </SettingRow>
          )}

          <SettingGroup
            title={say('screens.adminArea.emailCard.mailServer')}
            description={say('screens.adminArea.emailCard.theSmtpServerOfYourEmail')}
          >
            <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_10rem]">
              <TextField
                label={say('common.serverAddress')}
                placeholder={RESEND.host}
                value={draft.host}
                disabled={isFixed}
                onValueChange={(host) => {
                  change({ host });
                }}
              />

              <TextField
                label={say('screens.adminArea.emailCard.port')}
                type="number"
                min={1}
                max={65_535}
                value={port}
                disabled={isFixed}
                onValueChange={setPort}
                {...(isPortValid
                  ? {}
                  : { error: say('screens.adminArea.emailCard.aPortFrom1To65535') })}
              />

              <SelectField
                label={say('common.security')}
                options={[...SECURITY_CHOICES]}
                value={draft.security}
                onSelect={(id) => {
                  if (isFixed) {
                    return;
                  }

                  change({
                    security: EMAIL_SECURITIES.find((one) => one === id) ?? 'tls',
                  });
                }}
              />
            </div>
          </SettingGroup>

          <SettingGroup
            title={say('screens.adminArea.settingsPanel.signingIn')}
            description={
              setup.hasPassword
                ? say('screens.adminArea.emailCard.aPasswordIsSavedLeaveIt')
                : say('screens.adminArea.emailCard.forResendTheUsernameIs')
            }
          >
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <TextField
                label={say('common.username')}
                autoComplete="off"
                value={draft.username}
                disabled={isFixed}
                onValueChange={(username) => {
                  change({ username });
                }}
              />

              <TextField
                label={say('common.password')}
                type="password"
                autoComplete="new-password"
                placeholder={
                  setup.hasPassword ? say('screens.adminArea.emailCard.savedLeaveEmptyToKeep') : ''
                }
                value={draft.password}
                disabled={isFixed}
                onValueChange={(password) => {
                  change({ password });
                }}
              />
            </div>
          </SettingGroup>

          <SettingGroup
            title={say('screens.adminArea.emailCard.sendAs')}
            description={say('screens.adminArea.emailCard.theAddressMustBeOneYour')}
          >
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <TextField
                label={say('common.name')}
                placeholder={say('common.valence')}
                value={draft.fromName}
                disabled={isFixed}
                onValueChange={(fromName) => {
                  change({ fromName });
                }}
              />

              <TextField
                label={say('common.address')}
                type="email"
                value={draft.fromAddress}
                disabled={isFixed}
                onValueChange={(fromAddress) => {
                  change({ fromAddress });
                }}
              />
            </div>
          </SettingGroup>

          <SettingRow
            title={say('screens.adminArea.emailCard.emailPasswordResetLinks')}
            description={say('screens.adminArea.emailCard.toWhoeverAsksOnTheSign')}
          >
            <Switch
              label={say('screens.adminArea.emailCard.emailPasswordResetLinks')}
              isLabelHidden
              isOn={draft.sendsPasswordResets}
              onToggle={() => {
                change({ sendsPasswordResets: !draft.sendsPasswordResets });
              }}
            />
          </SettingRow>

          <SettingRow
            title={say('screens.adminArea.emailCard.emailSetupLinks')}
            description={say('screens.adminArea.emailCard.sendByEmailAppearsBesideCopy')}
          >
            <Switch
              label={say('screens.adminArea.emailCard.emailSetupLinks')}
              isLabelHidden
              isOn={draft.sendsSetupLinks}
              onToggle={() => {
                change({ sendsSetupLinks: !draft.sendsSetupLinks });
              }}
            />
          </SettingRow>
        </SettingList>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            disabled={!isChanged || !isPortValid}
            onClick={() => {
              void save();
            }}
          >
            {say('common.save')}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={say('screens.adminArea.emailCard.sendATestTo')}
              type="email"
              size="sm"
              value={testTo}
              onValueChange={setTestTo}
              className="min-w-0 flex-1"
            />

            <Button
              variant="secondary"
              size="sm"
              isLoading={isTesting}
              disabled={testTo.trim() === '' || setup.host === ''}
              onClick={() => {
                void test();
              }}
            >
              {say('screens.adminArea.emailCard.sendTestEmail')}
            </Button>
          </div>

          {tested === null ? null : tested.problem === null ? (
            <p role="status" className="font-body text-[0.8125rem] text-text-muted">
              {say('screens.adminArea.emailCard.sentCheckTheInboxOf', { to: tested.to })}
            </p>
          ) : (
            <p role="alert" className="font-body text-[0.8125rem] text-danger">
              {tested.problem}
            </p>
          )}
        </div>

        <RecentEmails sends={setup.recent} now={now} />
      </div>
    </PanelCard>
  );
};

EmailCard.displayName = 'EmailCard';

export { EmailCard };
