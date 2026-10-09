import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { SetupWizard } from './SetupWizard';
import type * as Auth from '@ValenceClient/session/auth';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { SetupRequest, SetupResult, SetupStatus } from '@ValenceContracts/schemas/Setup';
import type { AddLibrariesStepProps } from './components/AddLibrariesStep/AddLibrariesStep.types';
import type { CatalogueStepProps } from './components/CatalogueStep/CatalogueStep.types';
import type { HouseholdStepProps } from './components/HouseholdStep/HouseholdStep.types';
import type { ImportFromStepProps } from './components/ImportFromStep/ImportFromStep.types';
import type { ProfileStepProps } from './components/ProfileStep/ProfileStep.types';
import type { SetupWizardProps } from './SetupWizard.types';

const status: SetupStatus = {
  isComplete: false,
  isFlowOpen: false,
  detectedOrigin: 'http://192.168.1.40:8420',
  isSecureContext: false,
  suggestedTrustedOrigins: ['http://192.168.1.40:8420', 'http://192.168.1.40:5173'],
};

const LIBRARY: Library = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
};

const completeSetup = vi.hoisted(() =>
  vi.fn<(request: SetupRequest) => Promise<Answer<SetupResult>>>(),
);
const finishSetupFlow = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const finishOnboarding = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const signInWithUsernameOrEmail = vi.hoisted(() =>
  vi.fn<(identifier: string, password: string) => Promise<{ kind: 'signedIn' }>>(),
);

vi.mock('@ValenceClient/setup/completeSetup', () => ({ completeSetup }));

vi.mock('@ValenceClient/setup/finishSetupFlow', () => ({ finishSetupFlow }));

vi.mock('@ValenceClient/household/fetchHousehold', () => ({
  finishOnboarding,
  fetchOnboarding: vi.fn(),
  saveHousehold: vi.fn(),
  uploadHouseholdPhoto: vi.fn(),
}));

vi.mock('@ValenceClient/session/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof Auth>()),
  signInWithUsernameOrEmail,
}));

vi.mock('./components/ProfileStep/ProfileStep', () => ({
  ProfileStep: ({ onContinue }: ProfileStepProps) => (
    <section aria-label="Profile step">
      <button type="button" onClick={onContinue}>
        Profile done
      </button>
    </section>
  ),
}));

vi.mock('./components/HouseholdStep/HouseholdStep', () => ({
  HouseholdStep: ({ onBack, onContinue }: HouseholdStepProps) => (
    <section aria-label="Household step">
      <button type="button" onClick={onBack}>
        Household back
      </button>
      <button
        type="button"
        onClick={() => {
          onContinue('The Morgans');
        }}
      >
        Household done
      </button>
    </section>
  ),
}));

vi.mock('./components/CatalogueStep/CatalogueStep', () => ({
  CatalogueStep: ({ onBack, onSaved, onSkip }: CatalogueStepProps) => (
    <section aria-label="Catalogue step">
      <button type="button" onClick={onBack}>
        Catalogue back
      </button>
      <button type="button" onClick={onSaved}>
        Catalogue saved
      </button>
      <button type="button" onClick={onSkip}>
        Catalogue skipped
      </button>
    </section>
  ),
}));

vi.mock('./components/AddLibrariesStep/AddLibrariesStep', () => ({
  AddLibrariesStep: ({
    libraries,
    scans,
    onRead,
    onAdded,
    onBack,
    onContinue,
  }: AddLibrariesStepProps) => (
    <section aria-label="Libraries step">
      <span>
        {`${(libraries?.length ?? -1).toString()} held, ${scans.size.toString()} followed`}
      </span>
      <button
        type="button"
        onClick={() => {
          onRead([]);
        }}
      >
        Read none
      </button>
      <button
        type="button"
        onClick={() => {
          onAdded(LIBRARY, 'job-1');
        }}
      >
        Add one being read
      </button>
      <button
        type="button"
        onClick={() => {
          onAdded({ ...LIBRARY, id: '00000000-0000-4000-8000-000000000002' }, null);
        }}
      >
        Add one not being read
      </button>
      <button type="button" onClick={onBack}>
        Libraries back
      </button>
      <button type="button" onClick={onContinue}>
        Libraries done
      </button>
    </section>
  ),
}));

vi.mock('./components/ImportFromStep/ImportFromStep', () => ({
  ImportFromStep: ({ onBack, onDone }: ImportFromStepProps) => (
    <section aria-label="Import step">
      <button type="button" onClick={onBack}>
        Import back
      </button>
      <button
        type="button"
        onClick={() => {
          onDone('server');
        }}
      >
        Import done
      </button>
    </section>
  ),
}));

const renderWizard = (props: Partial<SetupWizardProps> = {}) =>
  render(<SetupWizard status={status} onComplete={vi.fn()} {...props} />, {
    wrapper: CacheScope,
  });

const reachAccess = async (email = '') => {
  await userEvent.click(screen.getByRole('button', { name: 'Create your account' }));
  await userEvent.type(await screen.findByLabelText('Name'), '  Operator  ');
  await userEvent.type(screen.getByLabelText('Username'), 'operator');

  if (email !== '') {
    await userEvent.type(screen.getByLabelText('Email (optional)'), email);
  }

  await userEvent.type(screen.getByLabelText('Password'), 'a-long-enough-password');
  await userEvent.type(screen.getByLabelText('Confirm password'), 'a-long-enough-password');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Create my account' });
};

const createAccount = async (email = '') => {
  await reachAccess(email);
  await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));
};

const currentStep = () =>
  screen.getByRole('navigation', { name: 'Set up Valence' }).querySelector('[aria-current="step"]');

beforeEach(() => {
  completeSetup.mockReset().mockResolvedValue({
    kind: 'answered',
    value: { isComplete: true, isSignedIn: true, restartRequired: false },
  });
  finishSetupFlow.mockReset().mockResolvedValue(true);
  finishOnboarding.mockReset().mockResolvedValue(true);
  signInWithUsernameOrEmail.mockReset().mockResolvedValue({ kind: 'signedIn' });
});

describe('SetupWizard', () => {
  it('starts on the welcome, with every step listed beside it', () => {
    renderWizard();

    expect(screen.getByRole('heading', { name: 'Set up Valence' })).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('Welcome');
    expect(screen.getByRole('navigation', { name: 'Set up Valence' })).toHaveTextContent(
      'Import from another server',
    );
  });

  it('walks from the welcome to the account and back again', async () => {
    renderWizard();

    await userEvent.click(screen.getByRole('button', { name: 'Create your account' }));

    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('Your account');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('button', { name: 'Create your account' })).toBeInTheDocument();
  });

  it('keeps what was typed into the account when coming back to it', async () => {
    renderWizard();

    await reachAccess();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByLabelText('Username')).toHaveValue('operator');
  });

  it('trusts the addresses the server suggested until told otherwise', async () => {
    renderWizard();

    await reachAccess();

    expect(
      screen.getByRole('button', { name: 'Remove http://192.168.1.40:8420' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove http://192.168.1.40:5173' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Valence is served over HTTPS' })).not.toBeChecked();
  });

  it('turns secure cookies on for a server reached over HTTPS', async () => {
    renderWizard({
      status: { ...status, isSecureContext: true, detectedOrigin: 'https://valence.example' },
    });

    await reachAccess();

    expect(screen.getByRole('switch', { name: 'Valence is served over HTTPS' })).toBeChecked();
  });

  it('makes the administrator from what was typed, with no address where none was given', async () => {
    renderWizard();

    await createAccount();

    await waitFor(() => {
      expect(completeSetup).toHaveBeenCalledOnce();
    });
    expect(completeSetup).toHaveBeenCalledWith({
      admin: { name: 'Operator', username: 'operator', password: 'a-long-enough-password' },
      trustedOrigins: ['http://192.168.1.40:8420', 'http://192.168.1.40:5173'],
      cookieSecure: false,
    });
  });

  it('sends the address when one was given, and what was chosen about access', async () => {
    renderWizard();

    await reachAccess('admin@valence.test');
    await userEvent.click(screen.getByRole('button', { name: 'Remove http://192.168.1.40:5173' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Valence is served over HTTPS' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    await waitFor(() => {
      expect(completeSetup).toHaveBeenCalledWith({
        admin: {
          name: 'Operator',
          username: 'operator',
          email: 'admin@valence.test',
          password: 'a-long-enough-password',
        },
        trustedOrigins: ['http://192.168.1.40:8420'],
        cookieSecure: true,
      });
    });
  });

  it('goes on to the profile once the administrator is made and signed in', async () => {
    renderWizard();

    await createAccount();

    expect(await screen.findByRole('region', { name: 'Profile step' })).toBeInTheDocument();
    expect(signInWithUsernameOrEmail).not.toHaveBeenCalled();
    expect(currentStep()).toHaveTextContent('Your profile');
  });

  it('signs the administrator in where making them did not', async () => {
    completeSetup.mockResolvedValue({
      kind: 'answered',
      value: { isComplete: true, isSignedIn: false, restartRequired: false },
    });

    renderWizard();

    await createAccount();

    await screen.findByRole('region', { name: 'Profile step' });

    expect(signInWithUsernameOrEmail).toHaveBeenCalledWith('operator', 'a-long-enough-password');
  });

  it('stays on the access step and says why the server refused', async () => {
    completeSetup.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'This server has already been set up.' },
    });

    renderWizard();

    await createAccount();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This server has already been set up.',
    );
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeEnabled();
    expect(screen.queryByRole('region', { name: 'Profile step' })).not.toBeInTheDocument();
  });

  it('says setup could not be completed where the server gave no reason', async () => {
    completeSetup.mockResolvedValue({ kind: 'refused', refusal: null });

    renderWizard();

    await createAccount();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t complete setup. Check the details and try again.',
    );
  });

  it('forgets the refusal on going back', async () => {
    completeSetup.mockResolvedValue({ kind: 'refused', refusal: null });

    renderWizard();

    await createAccount();
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Create my account' });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('walks every step after the account, back and on, to what came of it all', async () => {
    renderWizard();

    await createAccount();
    await userEvent.click(await screen.findByRole('button', { name: 'Profile done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Profile done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue saved' }));

    expect(await screen.findByText('-1 held, 0 followed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Read none' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add one being read' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add one not being read' }));

    expect(screen.getByText('2 held, 1 followed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Libraries back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue saved' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Libraries done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Libraries done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import done' }));

    expect(await screen.findByText(/The Morgans is ready/)).toBeInTheDocument();
    expect(screen.getByText('Your account, operator')).toBeInTheDocument();
    expect(screen.getByText('2 trusted addresses')).toBeInTheDocument();
    expect(screen.getByText('A catalogue key for titles and artwork')).toBeInTheDocument();
    expect(screen.getByText('2 libraries')).toBeInTheDocument();
    expect(screen.getByText('Imported from your old server')).toBeInTheDocument();
    expect(screen.queryByText('Restart Valence')).not.toBeInTheDocument();
  });

  it('says a skipped catalogue key and a needed restart at the end', async () => {
    completeSetup.mockResolvedValue({
      kind: 'answered',
      value: { isComplete: true, isSignedIn: true, restartRequired: true },
    });

    renderWizard();

    await createAccount();
    await userEvent.click(await screen.findByRole('button', { name: 'Profile done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue skipped' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Libraries done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import done' }));

    expect(
      await screen.findByText('No catalogue key yet: add one in Settings when you’re ready'),
    ).toBeInTheDocument();
    expect(screen.getByText('No libraries yet: add them in Settings')).toBeInTheDocument();
    expect(screen.getByText('Restart Valence')).toBeInTheDocument();
  });

  it('closes the setup flow and the household onboarding before opening Valence', async () => {
    const onComplete = vi.fn();

    renderWizard({ onComplete });

    await createAccount();
    await userEvent.click(await screen.findByRole('button', { name: 'Profile done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue saved' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Libraries done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import done' }));

    expect(onComplete).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: /Start watching/ }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
    expect(finishSetupFlow).toHaveBeenCalledOnce();
    expect(finishOnboarding).toHaveBeenCalledOnce();
  });

  it('starts an administrator coming back to finish on their profile', async () => {
    renderWizard({
      startsAt: 'profile',
      status: { ...status, isComplete: true, isFlowOpen: true },
    });

    expect(screen.getByRole('region', { name: 'Profile step' })).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('Your profile');

    await userEvent.click(screen.getByRole('button', { name: 'Profile done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Household done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Catalogue saved' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Libraries done' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import done' }));

    expect(await screen.findByText(/The Morgans is ready/)).toBeInTheDocument();
    expect(screen.queryByText(/Your account,/)).not.toBeInTheDocument();
    expect(screen.queryByText(/trusted address/)).not.toBeInTheDocument();
    expect(completeSetup).not.toHaveBeenCalled();
  });

  it('changes the theme from the header', async () => {
    renderWizard();

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });
});
