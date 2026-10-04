import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DoneStep } from './DoneStep';
import type { DoneStepProps } from './DoneStep.types';

const renderDone = (props: Partial<DoneStepProps> = {}) =>
  render(
    <DoneStep
      username="operator"
      origins={['http://192.168.1.40:8420', 'https://valence.example.com']}
      hasCatalogueKey
      libraryCount={2}
      imported="server"
      restartRequired={false}
      household="The Morgans"
      onFinish={vi.fn()}
      {...props}
    />,
  );

describe('DoneStep', () => {
  it('welcomes the household by the name it was given', () => {
    renderDone();

    expect(screen.getByText('Welcome to Valence')).toBeInTheDocument();
    expect(screen.getByText(/The Morgans is ready/)).toBeInTheDocument();
  });

  it('lists everything this visit set up', () => {
    renderDone();

    expect(screen.getByText('Your account, operator')).toBeInTheDocument();
    expect(screen.getByText('2 trusted addresses')).toBeInTheDocument();
    expect(screen.getByText('A catalogue key for titles and artwork')).toBeInTheDocument();
    expect(screen.getByText('2 libraries')).toBeInTheDocument();
    expect(screen.getByText('Imported from your old server')).toBeInTheDocument();
  });

  it('says what was left for later', () => {
    renderDone({ hasCatalogueKey: false, libraryCount: 0, imported: 'fresh' });

    expect(
      screen.getByText('No catalogue key yet: add one in Settings when you’re ready'),
    ).toBeInTheDocument();
    expect(screen.getByText('No libraries yet: add them in Settings')).toBeInTheDocument();
    expect(screen.getByText('Started fresh, with nothing imported')).toBeInTheDocument();
  });

  it('says one library and one address in the singular', () => {
    renderDone({ libraryCount: 1, origins: ['http://192.168.1.40:8420'] });

    expect(screen.getByText('1 library')).toBeInTheDocument();
    expect(screen.getByText('1 trusted address')).toBeInTheDocument();
  });

  it('says the requesting apps are connected where only they came across', () => {
    renderDone({ imported: 'requests' });

    expect(screen.getByText('Your requesting apps are connected')).toBeInTheDocument();
  });

  it('leaves out what an administrator coming back to finish did not do on this visit', () => {
    renderDone({ username: null, origins: [], hasCatalogueKey: null, imported: null });

    expect(screen.queryByText(/Your account/)).not.toBeInTheDocument();
    expect(screen.queryByText(/trusted address/)).not.toBeInTheDocument();
    expect(screen.queryByText(/catalogue key/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Imported|Started fresh|requesting apps/)).not.toBeInTheDocument();
    expect(screen.getByText('2 libraries')).toBeInTheDocument();
  });

  it('warns that the HTTPS choice needs Valence started again, only where it does', () => {
    const { unmount } = renderDone({ restartRequired: true });

    expect(screen.getByText('Restart Valence')).toBeInTheDocument();

    unmount();
    renderDone();

    expect(screen.queryByText('Restart Valence')).not.toBeInTheDocument();
  });

  it('opens Valence once they say they are ready', async () => {
    const onFinish = vi.fn();

    renderDone({ onFinish });

    await userEvent.click(screen.getByRole('button', { name: /Start watching/ }));

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledOnce();
    });
  });
});
