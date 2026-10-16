import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ChildRow } from './ChildRow';

const setChildPin = vi.hoisted(() => vi.fn());
const fetchChildren = vi.hoisted(() => vi.fn());
const fetchLibraryAccess = vi.hoisted(() => vi.fn());
const setLibraryAccess = vi.hoisted(() => vi.fn());
const setCeiling = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/account/fetchChildren', () => ({
  fetchChildren,
  addChild: vi.fn(),
  setChildPin,
}));

vi.mock('@ValenceClient/admin/fetchLibraryAccess', async (original) => ({
  ...(await original<object>()),
  fetchLibraryAccess,
  setLibraryAccess,
  setCeiling,
}));

const SHELF = {
  id: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  name: 'Films',
  mayView: false,
  maximumAge: null,
  allowsUnrated: false,
};

const draw = (hasPin = false) =>
  render(
    <CacheScope>
      <ul>
        <ChildRow child={{ id: 'kit', name: 'Kit', hasPin }} />
      </ul>
    </CacheScope>,
  );

beforeEach(() => {
  setChildPin.mockReset().mockResolvedValue(null);
  fetchChildren.mockReset().mockResolvedValue([]);
  fetchLibraryAccess.mockReset().mockResolvedValue([SHELF]);
  setLibraryAccess.mockReset().mockResolvedValue(null);
  setCeiling.mockReset().mockResolvedValue(null);
});

describe('ChildRow', () => {
  it('sets a new PIN for the child', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: /change kit/iu }));
    await userEvent.type(screen.getByLabelText(/new pin/iu), '4321');
    await userEvent.click(screen.getByRole('button', { name: /set pin/iu }));

    await waitFor(() => {
      expect(setChildPin).toHaveBeenCalledWith('kit', '4321');
    });
  });

  it('takes a PIN away so the child signs in with a tap', async () => {
    draw(true);

    await userEvent.click(screen.getByRole('button', { name: /change kit/iu }));
    await userEvent.click(screen.getByRole('button', { name: /remove pin/iu }));

    await waitFor(() => {
      expect(setChildPin).toHaveBeenCalledWith('kit', null);
    });
  });

  it('saves the libraries the child may see', async () => {
    draw();

    await userEvent.click(screen.getByRole('button', { name: /change kit/iu }));
    await userEvent.click(
      await screen.findByRole('button', { name: /give kit access to films/iu }),
    );
    await userEvent.click(screen.getByRole('button', { name: /save kit’s libraries/iu }));

    await waitFor(() => {
      expect(setLibraryAccess).toHaveBeenCalledWith('kit', SHELF.id, true);
    });
  });
});
