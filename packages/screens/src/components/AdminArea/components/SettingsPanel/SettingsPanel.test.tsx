import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { SettingsPanel } from './SettingsPanel';

vi.mock('@ValenceClient/admin/fetchPreRollSetup', () => ({
  fetchPreRollSetup: vi.fn(() => new Promise(() => undefined)),
}));

describe('SettingsPanel', () => {
  it('lays out a card for the server, the sign-in screen, online services and pre-roll', () => {
    renderWithAnswers(<SettingsPanel overview={anAdminOverview()} />);

    expect(screen.getByText('Server')).toBeInTheDocument();
    expect(screen.getByText('Sign-in screen')).toBeInTheDocument();
    expect(screen.getByText('Online services')).toBeInTheDocument();
    expect(screen.getByText('Pre-roll')).toBeInTheDocument();
  });
});
