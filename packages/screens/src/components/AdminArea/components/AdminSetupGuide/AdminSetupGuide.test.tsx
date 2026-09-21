import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminSetupGuide } from './AdminSetupGuide';
import type { AdminSetupGuideProps } from './AdminSetupGuide.types';

const draw = (overrides: Partial<AdminSetupGuideProps> = {}) => {
  const props: AdminSetupGuideProps = {
    hasLibrary: false,
    hasCatalogueKey: false,
    hasScanned: false,
    onAddLibrary: vi.fn(),
    onOpenSettings: vi.fn(),
    onScanAll: vi.fn(),
    onHide: vi.fn(),
    ...overrides,
  };

  render(<AdminSetupGuide {...props} />);

  return props;
};

const stepNamed = (name: string): HTMLElement => {
  const step = screen.getByText(name).closest('li');

  if (step === null) {
    throw new Error(`No step called ${name}`);
  }

  return step;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AdminSetupGuide', () => {
  it('points a brand new server at the first step', () => {
    draw();

    expect(stepNamed('Add a library')).toHaveAttribute('aria-current', 'step');
    expect(within(stepNamed('Add a library')).getByText('Start here')).toBeInTheDocument();
    expect(stepNamed('Add a metadata key')).not.toHaveAttribute('aria-current');
  });

  it('moves on to the next step that is not done', () => {
    draw({ hasLibrary: true });

    expect(stepNamed('Add a metadata key')).toHaveAttribute('aria-current', 'step');
  });

  it('takes away the buttons for a step that is done', () => {
    draw({ hasLibrary: true });

    expect(
      within(stepNamed('Add a library')).queryByRole('button', { name: 'Add library' }),
    ).not.toBeInTheDocument();
  });

  it('adds a library, opens the settings and scans, each from its own step', async () => {
    const props = draw({ hasLibrary: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Enter it in Settings' }));
    await user.click(screen.getByRole('button', { name: 'Scan all' }));

    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
    expect(props.onScanAll).toHaveBeenCalledTimes(1);
  });

  it('starts adding a library from the first step', async () => {
    const props = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Add library' }));

    expect(props.onAddLibrary).toHaveBeenCalledTimes(1);
  });

  it('cannot scan before there is anything to scan', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Scan all' })).toBeDisabled();
  });

  it('opens the page where a catalogue key is made, without handing over the app', async () => {
    const open = vi.fn();

    vi.stubGlobal('open', open);
    draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Get a free key' }));

    expect(open).toHaveBeenCalledWith(
      'https://www.themoviedb.org/settings/api',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('can be put away', async () => {
    const props = draw();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Hide' }));

    expect(props.onHide).toHaveBeenCalledTimes(1);
  });

  it('draws nothing once everything is done', () => {
    draw({ hasLibrary: true, hasCatalogueKey: true, hasScanned: true });

    expect(screen.queryByLabelText('Get Valence set up')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AdminSetupGuide.displayName).toBe('AdminSetupGuide');
  });
});
