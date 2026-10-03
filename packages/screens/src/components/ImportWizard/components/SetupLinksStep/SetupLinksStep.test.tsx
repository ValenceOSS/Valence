import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { ImportedSetupLinks } from '@ValenceContracts/schemas/MediaImport';
import type { IssuedSetupLink } from '@ValenceContracts/schemas/SetupLink';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { A_REPORT, aMediaImportRun } from '@ValenceScreens/components/ImportWizard/aMediaImportRun';
import { SetupLinksStep } from './SetupLinksStep';

const makeImportSetupLinks =
  vi.fn<(runId: string, lifetimeDays: number) => Promise<Answer<ImportedSetupLinks>>>();
const emailSetupLink =
  vi.fn<(userId: string, link: { held: IssuedSetupLink }) => Promise<Answer<IssuedSetupLink>>>();

vi.mock('@ValenceClient/imports/makeImportSetupLinks', () => ({
  makeImportSetupLinks: (runId: string, lifetimeDays: number) =>
    makeImportSetupLinks(runId, lifetimeDays),
}));

vi.mock('@ValenceClient/admin/emailSetupLink', () => ({
  emailSetupLink: (userId: string, link: { held: IssuedSetupLink }) => emailSetupLink(userId, link),
}));

const LINKS: ImportedSetupLinks = {
  canEmail: true,
  links: [
    {
      userId: 'sam',
      name: 'Sam',
      url: 'http://valence/setup/sam',
      expiresAt: '2026-10-09T00:00:00.000Z',
      hasEmail: false,
    },
    {
      userId: 'old',
      name: 'Old Lodger',
      url: 'http://valence/setup/old',
      expiresAt: '2026-10-09T00:00:00.000Z',
      hasEmail: true,
    },
  ],
};

const RUN = aMediaImportRun({ state: 'completed', report: A_REPORT });

beforeEach(() => {
  makeImportSetupLinks.mockReset().mockResolvedValue({ kind: 'answered', value: LINKS });
  emailSetupLink
    .mockReset()
    .mockResolvedValue({ kind: 'answered', value: { url: 'u', expiresAt: 'e' } });
});

describe('SetupLinksStep', () => {
  it('makes a week-long link for each new person, offering email only where they have an address', async () => {
    renderInAnAddress(<SetupLinksStep run={RUN} onFinish={vi.fn()} />);

    expect(await screen.findByText('http://valence/setup/old')).toBeVisible();
    expect(makeImportSetupLinks).toHaveBeenCalledWith('run', 7);
    expect(screen.getAllByRole('button', { name: /Send by email/ })).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /Send by email/ }));

    expect(emailSetupLink).toHaveBeenCalledWith('old', {
      held: { url: 'http://valence/setup/old', expiresAt: '2026-10-09T00:00:00.000Z' },
    });
  });

  it('says when nobody new was added, and why links could not be made', async () => {
    const onFinish = vi.fn();

    makeImportSetupLinks.mockResolvedValueOnce({
      kind: 'answered',
      value: { canEmail: false, links: [] },
    });
    renderInAnAddress(<SetupLinksStep run={RUN} onFinish={onFinish} />);

    expect(await screen.findByText(/No new users were added/)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('says why the links could not be made', async () => {
    makeImportSetupLinks.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'Setup links are off.' },
    });
    renderInAnAddress(<SetupLinksStep run={RUN} onFinish={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Setup links are off.')).toBeVisible();
    });
  });
});
