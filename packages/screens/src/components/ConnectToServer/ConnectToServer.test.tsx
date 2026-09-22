import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConnectToServer } from './ConnectToServer';

const shown = (reach: (address: string) => Promise<boolean>) => {
  const onConnected = vi.fn();
  const actor = userEvent.setup();

  render(<ConnectToServer onConnected={onConnected} reach={reach} />);

  return {
    actor,
    onConnected,
    field: () => screen.getByLabelText(/server address/i),
    connect: () => screen.getByRole('button', { name: /connect/i }),
  };
};

const answering = () => vi.fn(() => Promise.resolve(true));

describe('ConnectToServer', () => {
  it('keeps the address once something answered at it', async () => {
    const world = shown(answering());

    await world.actor.type(world.field(), 'valence.example.com');
    await world.actor.click(world.connect());

    await waitFor(() => {
      expect(world.onConnected).toHaveBeenCalledWith('https://valence.example.com');
    });
  });

  it('asks the address it worked out rather than what was typed', async () => {
    const reach = answering();
    const world = shown(reach);

    await world.actor.type(world.field(), '  valence.example.com/  ');
    await world.actor.click(world.connect());

    await waitFor(() => {
      expect(reach).toHaveBeenCalledWith('https://valence.example.com');
    });
  });

  it('keeps nothing where nothing answered, and says where it looked', async () => {
    const world = shown(vi.fn(() => Promise.resolve(false)));

    await world.actor.type(world.field(), 'valence.example.com');
    await world.actor.click(world.connect());

    expect(
      await screen.findByText(/nothing answered at https:\/\/valence\.example\.com/i),
    ).toBeInTheDocument();
    expect(world.onConnected).not.toHaveBeenCalled();
  });

  it('says what is wrong with an address rather than asking the network about it', async () => {
    const reach = answering();
    const world = shown(reach);

    await world.actor.type(world.field(), 'not a server');
    await world.actor.click(world.connect());

    expect(await screen.findByText(/does not look like a web address/i)).toBeInTheDocument();
    expect(reach).not.toHaveBeenCalled();
  });

  it('asks for something rather than reaching for an empty address', async () => {
    const reach = answering();
    const world = shown(reach);

    await world.actor.click(world.connect());

    expect(await screen.findByText(/enter the address/i)).toBeInTheDocument();
    expect(reach).not.toHaveBeenCalled();
  });

  it('says it is looking, since a server that is not there takes a while to say so', async () => {
    let answer: (found: boolean) => void = () => undefined;
    const world = shown(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );

    await world.actor.type(world.field(), 'valence.example.com');
    await world.actor.click(world.connect());

    expect(await screen.findByText(/looking for it/i)).toBeInTheDocument();

    answer(true);

    await waitFor(() => {
      expect(world.onConnected).toHaveBeenCalled();
    });
  });
});

describe('coming back because the server stopped answering', () => {
  it('says which server, rather than showing an empty box and no reason', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        startWith="https://valence.example.com"
        couldNotReach="https://valence.example.com"
      />,
    );

    expect(
      screen.getByText(/Valence at https:\/\/valence\.example\.com could not be reached/),
    ).toBeInTheDocument();
  });

  it('puts the address back in the box, since nobody remembers what they typed months ago', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        startWith="https://valence.example.com"
        couldNotReach="https://valence.example.com"
      />,
    );

    expect(screen.getByLabelText('Server address')).toHaveValue('https://valence.example.com');
  });

  it('says nothing of the sort on a first launch', () => {
    render(<ConnectToServer onConnected={vi.fn()} />);

    expect(screen.getByLabelText('Server address')).toHaveValue('');
    expect(screen.queryByText(/could not be reached/)).toBeNull();
  });
});

describe('the way in', () => {
  it('wears the mark, so the first screen is Valence rather than a form on a blank page', () => {
    render(<ConnectToServer onConnected={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Valence' })).toBeInTheDocument();
  });

  it('asks its question as a heading, at the size the profile gate asks its own', () => {
    render(<ConnectToServer onConnected={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Which Valence is yours?' })).toBeInTheDocument();
  });
});

describe('what it found on this machine', () => {
  it('offers a server it found, so nobody types the address of their own machine', () => {
    render(<ConnectToServer onConnected={vi.fn()} found={['http://localhost:8420']} />);

    expect(screen.getByRole('button', { name: 'localhost:8420' })).toBeInTheDocument();
  });

  it('connects to it when pressed, without asking again what has already answered', async () => {
    const onConnected = vi.fn();

    render(<ConnectToServer onConnected={onConnected} found={['http://localhost:8420']} />);

    await userEvent.click(screen.getByRole('button', { name: 'localhost:8420' }));

    expect(onConnected).toHaveBeenCalledWith('http://localhost:8420');
  });

  it('offers each of them where somebody runs more than one', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        found={['http://localhost:8420', 'http://127.0.0.1:9000']}
      />,
    );

    expect(screen.getByRole('button', { name: 'localhost:8420' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '127.0.0.1:9000' })).toBeInTheDocument();
  });

  it('offers nothing where nothing was found, rather than an empty heading', () => {
    render(<ConnectToServer onConnected={vi.fn()} />);

    expect(screen.queryByText('Found on this machine')).not.toBeInTheDocument();
  });

  it('still lets somebody give an address of their own', () => {
    render(<ConnectToServer onConnected={vi.fn()} found={['http://localhost:8420']} />);

    expect(screen.getByLabelText('Server address')).toBeInTheDocument();
  });
});

describe('what it heard on the network', () => {
  const MEDIA_BOX = { address: 'http://192.168.1.224:8420', name: 'Valence on media-box' };

  it('offers a server announced elsewhere on the network, by the name it announced', () => {
    render(<ConnectToServer onConnected={vi.fn()} nearby={[MEDIA_BOX]} />);

    const heard = screen.getByRole('region', { name: 'Found on your network' });

    expect(heard).toHaveTextContent('Valence on media-box');
    expect(heard).toHaveTextContent('192.168.1.224:8420');
  });

  it('connects to it when pressed, since it answered before it was offered', async () => {
    const onConnected = vi.fn();
    const reach = answering();

    render(<ConnectToServer onConnected={onConnected} reach={reach} nearby={[MEDIA_BOX]} />);

    await userEvent.click(screen.getByRole('button', { name: /Valence on media-box/u }));

    expect(onConnected).toHaveBeenCalledWith('http://192.168.1.224:8420');
    expect(reach).not.toHaveBeenCalled();
  });

  it('keeps it apart from the one on this machine', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        found={['http://localhost:8420']}
        nearby={[MEDIA_BOX]}
      />,
    );

    expect(screen.getByRole('region', { name: 'Found on this machine' })).not.toHaveTextContent(
      'media-box',
    );
  });
});

describe('what it was pointed at before', () => {
  it('offers the servers used before, so nobody types an address twice', () => {
    render(<ConnectToServer onConnected={vi.fn()} recent={['https://demo.getvalence.app']} />);

    expect(screen.getByRole('region', { name: 'Recently used' })).toHaveTextContent(
      'demo.getvalence.app',
    );
  });

  it('tries one when pressed, since it may not have answered in a while', async () => {
    const onConnected = vi.fn();
    const reach = answering();

    render(
      <ConnectToServer
        onConnected={onConnected}
        reach={reach}
        recent={['https://demo.getvalence.app']}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'demo.getvalence.app' }));

    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledWith('https://demo.getvalence.app');
    });
    expect(reach).toHaveBeenCalledWith('https://demo.getvalence.app');
  });

  it('says so where one used before no longer answers, and leaves it in the box to correct', async () => {
    const onConnected = vi.fn();

    render(
      <ConnectToServer
        onConnected={onConnected}
        reach={vi.fn(() => Promise.resolve(false))}
        recent={['https://demo.getvalence.app']}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'demo.getvalence.app' }));

    expect(
      await screen.findByText(/nothing answered at https:\/\/demo\.getvalence\.app/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Server address')).toHaveValue('https://demo.getvalence.app');
    expect(onConnected).not.toHaveBeenCalled();
  });

  it('does not offer one again that is already offered as found', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        found={['http://localhost:8420']}
        recent={['http://localhost:8420']}
      />,
    );

    expect(screen.queryByRole('region', { name: 'Recently used' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'localhost:8420' })).toHaveLength(1);
  });
});

describe('the foot', () => {
  it('names this build, for whoever is about to report something', () => {
    render(
      <ConnectToServer
        onConnected={vi.fn()}
        build="Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0"
      />,
    );

    expect(
      screen.getByText('Valence 1.2.0 (2ae1bc1) · arm64 · Electron 33.0.0 · Chromium 130.0.0'),
    ).toBeInTheDocument();
  });

  it('signs itself where there is no build to name', () => {
    render(<ConnectToServer onConnected={vi.fn()} />);

    expect(screen.getByText('© Valence')).toBeInTheDocument();
  });
});
