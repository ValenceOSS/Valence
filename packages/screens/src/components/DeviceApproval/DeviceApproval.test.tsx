import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceApproval } from './DeviceApproval';

const readDeviceRequest = vi.hoisted(() => vi.fn());
const answerDeviceRequest = vi.hoisted(() => vi.fn());
const useSearch = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/session/auth', () => ({ readDeviceRequest, answerDeviceRequest }));

vi.mock('@tanstack/react-router', () => ({ useSearch }));

beforeEach(() => {
  useSearch.mockReset().mockReturnValue({});
  readDeviceRequest.mockReset().mockResolvedValue({ userCode: 'ABCD1234', status: 'pending' });
  answerDeviceRequest.mockReset().mockResolvedValue(true);
});

describe('saying yes to a television from a phone', () => {
  it('asks for the code where the link did not carry one', () => {
    render(<DeviceApproval name="Valence" />);

    expect(screen.getByLabelText('The code on the television')).toBeInTheDocument();
  });

  it('checks a code the link carried without anybody typing anything', async () => {
    useSearch.mockReturnValue({ user_code: 'ABCD1234' });

    render(<DeviceApproval name="Valence" />);

    await waitFor(() => {
      expect(readDeviceRequest).toHaveBeenCalledWith('ABCD1234');
    });

    expect(await screen.findByRole('button', { name: 'Yes, that is mine' })).toBeInTheDocument();
  });

  it('tidies a code somebody typed off a screen before asking about it', async () => {
    render(<DeviceApproval name="Valence" />);

    await userEvent.type(screen.getByLabelText('The code on the television'), 'abcd-1234');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(readDeviceRequest).toHaveBeenCalledWith('ABCD1234');
    });
  });

  it('offers nothing to approve until the server says there is something waiting', async () => {
    readDeviceRequest.mockResolvedValue(null);

    render(<DeviceApproval name="Valence" />);

    await userEvent.type(screen.getByLabelText('The code on the television'), 'ABCD1234');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('That code has run out, or there is no television waiting on it.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Yes, that is mine' })).not.toBeInTheDocument();
  });

  it('will not offer to approve a code that has already been answered', async () => {
    readDeviceRequest.mockResolvedValue({ userCode: 'ABCD1234', status: 'approved' });

    useSearch.mockReturnValue({ user_code: 'ABCD1234' });

    render(<DeviceApproval name="Valence" />);

    expect(
      await screen.findByText('That code has run out, or there is no television waiting on it.'),
    ).toBeInTheDocument();
  });

  it('lets the television in when somebody says it is theirs', async () => {
    useSearch.mockReturnValue({ user_code: 'ABCD1234' });

    render(<DeviceApproval name="Valence" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Yes, that is mine' }));

    await waitFor(() => {
      expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', true);
    });

    expect(await screen.findByText(/close this/)).toBeInTheDocument();
  });

  it('offers turning it down as plainly as letting it in', async () => {
    useSearch.mockReturnValue({ user_code: 'ABCD1234' });

    render(<DeviceApproval name="Valence" />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'No, I did not ask for this' }),
    );

    await waitFor(() => {
      expect(answerDeviceRequest).toHaveBeenCalledWith('ABCD1234', false);
    });

    expect(await screen.findByText(/Turned down/)).toBeInTheDocument();
  });
});
