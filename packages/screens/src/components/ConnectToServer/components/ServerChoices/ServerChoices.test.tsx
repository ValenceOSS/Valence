import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServerChoices } from './ServerChoices';

describe('ServerChoices', () => {
  it('says where the servers came from, above one to press for each', () => {
    render(
      <ServerChoices
        title="Found on your network"
        choices={[
          { address: 'http://192.168.1.224:8420', label: 'Valence on media-box' },
          { address: 'http://192.168.1.30:8420', label: 'Valence on attic' },
        ]}
        onChoose={() => undefined}
      />,
    );

    const found = screen.getByRole('region', { name: 'Found on your network' });

    expect(found).toHaveTextContent('Found on your network');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('says where each one is, where that helps tell two apart', () => {
    render(
      <ServerChoices
        title="Found on your network"
        choices={[
          {
            address: 'http://192.168.1.224:8420',
            label: 'Valence on media-box',
            detail: '192.168.1.224:8420',
          },
        ]}
        onChoose={() => undefined}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Valence on media-box192.168.1.224:8420');
  });

  it('tells which address was pressed, not what it was called', async () => {
    const onChoose = vi.fn();
    const actor = userEvent.setup();

    render(
      <ServerChoices
        title="Recently used"
        choices={[{ address: 'https://demo.getvalence.app', label: 'demo.getvalence.app' }]}
        onChoose={onChoose}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'demo.getvalence.app' }));

    expect(onChoose).toHaveBeenCalledWith('https://demo.getvalence.app');
  });

  it('holds off pressing while an address is already being tried', () => {
    render(
      <ServerChoices
        title="Recently used"
        choices={[{ address: 'https://demo.getvalence.app', label: 'demo.getvalence.app' }]}
        onChoose={() => undefined}
        isDisabled
      />,
    );

    expect(screen.getByRole('button', { name: 'demo.getvalence.app' })).toBeDisabled();
  });

  it('draws nothing where there is nothing to offer, rather than a heading over nothing', () => {
    const { container } = render(
      <ServerChoices title="Recently used" choices={[]} onChoose={() => undefined} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ServerChoices.displayName).toBe('ServerChoices');
  });
});
