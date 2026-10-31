import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhoneNotificationsRow } from './PhoneNotificationsRow';

const saveUsesPushRelay = vi.hoisted(() =>
  vi.fn<(usesPushRelay: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({ saveUsesPushRelay }));

beforeEach(() => {
  saveUsesPushRelay.mockClear();
});

describe('PhoneNotificationsRow', () => {
  it('turns waking phones on and saves it', async () => {
    const user = userEvent.setup();

    render(<PhoneNotificationsRow isOn={false} />);

    const waking = screen.getByRole('switch', { name: 'Phone notifications' });

    await user.click(waking);

    expect(saveUsesPushRelay).toHaveBeenCalledWith(true);
    expect(waking).toBeChecked();
  });

  it('turns the switch back where the server would not take it', async () => {
    saveUsesPushRelay.mockResolvedValueOnce(false);

    const user = userEvent.setup();

    render(<PhoneNotificationsRow isOn />);

    const waking = screen.getByRole('switch', { name: 'Phone notifications' });

    await user.click(waking);

    await waitFor(() => {
      expect(waking).toBeChecked();
    });
  });
});
