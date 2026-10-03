import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceApproval } from './DeviceApproval';

const readDeviceRequest = vi.hoisted(() => vi.fn());
const answerDeviceRequest = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', () => ({ readDeviceRequest, answerDeviceRequest }));

beforeEach(() => {
  readDeviceRequest.mockReset().mockResolvedValue({ userCode: 'ABCD1234', status: 'pending' });
  answerDeviceRequest.mockReset().mockResolvedValue(true);
});

const typeTheCode = async (code = 'ABCD1234') => {
  await userEvent.type(screen.getByLabelText('Code shown on your TV'), code);
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
};

describe('saying yes to a television from a phone', () => {
  it('always asks for the code the television shows, offering nothing until it is typed', () => {
    render(<DeviceApproval name="Valence" />);

    expect(screen.getByLabelText('Code shown on your TV')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Yes, this was me' })).not.toBeInTheDocument();
    expect(readDeviceRequest).not.toHaveBeenCalled();
  });

  it('tidies a code somebody typed off a screen before asking about it', async () => {
    render(<DeviceApproval name="Valence" />);

    await userEvent.type(screen.getByLabelText('Code shown on your TV'), 'abcd-1234');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(readDeviceRequest).toHaveBeenCalledWith('ABCD1234');
    });
  });

  it('offers nothing to approve until the server says there is something waiting', async () => {
    readDeviceRequest.mockResolvedValue(null);

    render(<DeviceApproval name="Valence" />);

    await userEvent.type(screen.getByLabelText('Code shown on your TV'), 'ABCD1234');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('That code has expired, or no TV is waiting for it.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Yes, this was me' })).not.toBeInTheDocument();
  });

  it('will not offer to approve a code that has already been answered', async () => {
    readDeviceRequest.mockResolvedValue({ userCode: 'ABCD1234', status: 'approved' });

    render(<DeviceApproval name="Valence" />);

    await typeTheCode();

    expect(
      await screen.findByText('That code has expired, or no TV is waiting for it.'),
    ).toBeInTheDocument();
  });

  it('lets the television in when somebody says it is theirs', async () => {
    render(<DeviceApproval name="Valence" />);

    await typeTheCode();

    await userEvent.click(await screen.findByRole('button', { name: 'Yes, this was me' }));

    await waitFor(() => {
      expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', true);
    });

    expect(await screen.findByText(/close this/)).toBeInTheDocument();
  });

  it('offers turning it down as plainly as letting it in', async () => {
    render(<DeviceApproval name="Valence" />);

    await typeTheCode();

    await userEvent.click(await screen.findByRole('button', { name: 'No, this wasn’t me' }));

    await waitFor(() => {
      expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', false);
    });

    expect(await screen.findByText(/Denied/)).toBeInTheDocument();
  });
});
