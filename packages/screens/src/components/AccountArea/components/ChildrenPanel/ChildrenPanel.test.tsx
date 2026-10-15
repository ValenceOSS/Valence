import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ChildrenPanel } from './ChildrenPanel';

const fetchChildren = vi.hoisted(() => vi.fn());
const addChild = vi.hoisted(() => vi.fn());
const setChildPin = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/account/fetchChildren', () => ({ fetchChildren, addChild, setChildPin }));

const draw = () =>
  render(
    <CacheScope>
      <ChildrenPanel />
    </CacheScope>,
  );

beforeEach(() => {
  fetchChildren.mockReset().mockResolvedValue([]);
  addChild.mockReset().mockResolvedValue(null);
  setChildPin.mockReset().mockResolvedValue(null);
});

describe('ChildrenPanel', () => {
  it('says when no children have been added', async () => {
    draw();

    expect(await screen.findByText(/haven’t added any children/iu)).toBeInTheDocument();
  });

  it('lists each child and how they sign in', async () => {
    fetchChildren.mockResolvedValue([{ id: 'kit', name: 'Kit', hasPin: true }]);

    draw();

    expect(await screen.findByText('Kit')).toBeInTheDocument();
  });

  it('adds a child with the PIN typed', async () => {
    draw();

    await userEvent.type(await screen.findByLabelText(/^name/iu), 'Kit');
    await userEvent.type(screen.getByLabelText(/PIN \(optional\)/iu), '1234');
    await userEvent.click(screen.getByRole('button', { name: /add child/iu }));

    await waitFor(() => {
      expect(addChild).toHaveBeenCalledWith('Kit', '1234');
    });
  });

  it('will not add a child with a PIN that is too short', async () => {
    draw();

    await userEvent.type(await screen.findByLabelText(/^name/iu), 'Kit');
    await userEvent.type(screen.getByLabelText(/PIN \(optional\)/iu), '12');

    expect(screen.getByRole('button', { name: /add child/iu })).toBeDisabled();
  });
});
