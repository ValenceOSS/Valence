import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RefuseRequestDialog } from './RefuseRequestDialog';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const refuseMediaRequest = vi.fn<typeof Requests.refuseMediaRequest>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  refuseMediaRequest: (...given: Parameters<typeof Requests.refuseMediaRequest>) =>
    refuseMediaRequest(...given),
}));

const REFUSED = aMediaRequest({ approval: 'refused', state: 'refused', refusedBecause: 'No room' });

beforeEach(() => {
  refuseMediaRequest.mockReset().mockResolvedValue({ value: REFUSED, refusal: null });
});

describe('RefuseRequestDialog', () => {
  it('refuses a request, saying why to whoever asked', async () => {
    const user = userEvent.setup();
    const handlers = { onClose: vi.fn(), onRefused: vi.fn() };

    renderInAnAddress(<RefuseRequestDialog request={aMediaRequest()} {...handlers} />);

    expect(screen.getByText('Shown to Sam.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Why' }), 'No room');
    await user.click(screen.getByRole('button', { name: 'Refuse' }));

    await waitFor(() => {
      expect(handlers.onRefused).toHaveBeenCalledWith(REFUSED);
    });
    expect(refuseMediaRequest).toHaveBeenCalledWith(aMediaRequest().id, 'No room');
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it('says why it could not be refused', async () => {
    const user = userEvent.setup();

    refuseMediaRequest.mockResolvedValue({ value: null, refusal: { message: 'Not yours' } });
    renderInAnAddress(
      <RefuseRequestDialog request={aMediaRequest()} onClose={vi.fn()} onRefused={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Refuse' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Not yours');
  });
});
