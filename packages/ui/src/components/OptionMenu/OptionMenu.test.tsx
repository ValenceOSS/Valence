import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OptionMenu } from './OptionMenu';
import type { MenuGroup } from './OptionMenu.types';

const speed = (onSelect = vi.fn()): MenuGroup => ({
  name: 'Playback Speed',
  selectedId: '1',
  onSelect,
  options: [
    { id: '0.5', label: '0.5x' },
    { id: '1', label: '1x' },
    { id: '2', label: '2x' },
  ],
});

const open = async (groups: MenuGroup[]) => {
  const user = userEvent.setup();
  render(<OptionMenu label="Playback speed" trigger={<span>1x</span>} groups={groups} />);

  await user.click(screen.getByRole('button', { name: 'Playback speed' }));

  return user;
};

describe('OptionMenu', () => {
  it('keeps its choices out of the way until asked', () => {
    render(<OptionMenu label="Playback speed" trigger={<span>1x</span>} groups={[speed()]} />);

    expect(screen.queryByRole('menuitemradio', { name: /0.5x/ })).not.toBeInTheDocument();
  });

  it('offers every choice once opened', async () => {
    await open([speed()]);

    expect(await screen.findByRole('menuitemradio', { name: '0.5x' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: '2x' })).toBeInTheDocument();
  });

  it('marks the choice already in force', async () => {
    await open([speed()]);

    expect(await screen.findByRole('menuitemradio', { name: '1x' })).toBeChecked();
  });

  it('reports a choice by its id rather than its label', async () => {
    const onSelect = vi.fn();
    const user = await open([speed(onSelect)]);

    await user.click(await screen.findByRole('menuitemradio', { name: '2x' }));

    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('is drawn above a dialog, since a menu inside one is opened from inside one', async () => {
    await open([speed()]);

    expect(screen.getByRole('menu').className).toContain('z-50');
  });

  it('closes once a choice is made', async () => {
    const user = await open([speed()]);

    await user.click(await screen.findByRole('menuitemradio', { name: '2x' }));

    expect(screen.queryByRole('menuitemradio', { name: '2x' })).not.toBeInTheDocument();
  });

  it('offers two lists side by side when a decision has two parts', async () => {
    await open([
      {
        name: 'Audio',
        selectedId: 'ja',
        options: [{ id: 'ja', label: 'Japanese' }],
        onSelect: vi.fn(),
      },
      {
        name: 'Subtitles',
        selectedId: 'en',
        options: [
          { id: 'en', label: 'English' },
          { id: 'de', label: 'Deutsch' },
        ],
        onSelect: vi.fn(),
      },
    ]);

    expect(await screen.findByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Subtitles')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Japanese' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Deutsch' })).not.toBeChecked();
  });

  it('shows the note attached to a choice', async () => {
    await open([
      {
        name: 'Subtitles',
        selectedId: 'en',
        options: [{ id: 'en', label: 'English', detail: 'forced' }],
        onSelect: vi.fn(),
      },
    ]);

    expect(await screen.findByText('forced')).toBeInTheDocument();
  });

  it('cannot be opened while disabled', () => {
    render(
      <OptionMenu label="Playback speed" trigger={<span>1x</span>} groups={[speed()]} isDisabled />,
    );

    expect(screen.getByRole('button', { name: 'Playback speed' })).toBeDisabled();
  });

  describe('in fullscreen', () => {
    /**
     * Says an element is fullscreen the way a browser reports it.
     */
    const goFullscreen = (element: Element | null) => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: element,
        writable: true,
      });

      document.dispatchEvent(new Event('fullscreenchange'));
    };

    afterEach(() => {
      goFullscreen(null);
    });

    it('opens inside the element that is fullscreen, where it can be seen', async () => {
      const stage = document.createElement('div');

      document.body.append(stage);
      goFullscreen(stage);

      const user = userEvent.setup();

      render(<OptionMenu label="Playback speed" trigger={<span>1x</span>} groups={[speed()]} />, {
        container: stage.appendChild(document.createElement('div')),
      });

      await user.click(screen.getByRole('button', { name: 'Playback speed' }));

      const chosen = await screen.findByRole('menuitemradio', { name: '2x' });

      expect(stage.contains(chosen)).toBe(true);
    });

    it('opens in the body again once fullscreen is left, with no leftover', async () => {
      const stage = document.createElement('div');

      document.body.append(stage);
      goFullscreen(stage);
      goFullscreen(null);

      await open([speed()]);

      const chosen = await screen.findByRole('menuitemradio', { name: '2x' });

      expect(document.body.contains(chosen)).toBe(true);
      expect(stage.contains(chosen)).toBe(false);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OptionMenu.displayName).toBe('OptionMenu');
  });

  it('is drawn in the sidebar colour but fully opaque, so nothing shows through it', async () => {
    await open([speed()]);

    const menu = await screen.findByRole('menu', { name: 'Playback speed' });

    expect(menu).toHaveClass('valence-float');
    expect(menu).not.toHaveClass('valence-surface');
  });

  it('holds a group header at the top of its group as the choices scroll beneath it', async () => {
    await open([speed()]);

    const header = await screen.findByText('Playback Speed');

    expect(header).toHaveClass('sticky', 'top-0');
    expect(header.className).toContain('bg-[var(--color-surface-raised)]');
  });
});

describe('OptionMenu anchored to something that does its own job', () => {
  const draw = (onGo = vi.fn(), onSelect = vi.fn()) => {
    render(
      <OptionMenu
        label="Which library"
        anchor={<button onClick={onGo}>Films</button>}
        groups={[speed(onSelect)]}
      />,
    );

    return userEvent.setup();
  };

  it('opens when the pointer rests on what it is anchored to, without pressing anything', async () => {
    const user = draw();

    expect(screen.queryByRole('menuitemradio', { name: '2x' })).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Films' }));

    expect(await screen.findByRole('menuitemradio', { name: '2x' })).toBeInTheDocument();
  });

  it('still does what pressing the anchor always did, and does not open a menu for the press', async () => {
    const onGo = vi.fn();
    const user = draw(onGo);

    await user.click(screen.getByRole('button', { name: 'Films' }));

    expect(onGo).toHaveBeenCalledTimes(1);
  });

  it('takes a choice like any other menu, and closes on it', async () => {
    const onSelect = vi.fn();
    const user = draw(vi.fn(), onSelect);

    await user.hover(screen.getByRole('button', { name: 'Films' }));
    await user.click(await screen.findByRole('menuitemradio', { name: '2x' }));

    expect(onSelect).toHaveBeenCalledWith('2');
    await waitFor(() => {
      expect(screen.queryByRole('menuitemradio', { name: '2x' })).not.toBeInTheDocument();
    });
  });

  it('goes away once the pointer has left it and the menu both', async () => {
    const user = draw();

    await user.hover(screen.getByRole('button', { name: 'Films' }));
    await screen.findByRole('menuitemradio', { name: '2x' });
    await user.unhover(screen.getByRole('button', { name: 'Films' }));

    await waitFor(() => {
      expect(screen.queryByRole('menuitemradio', { name: '2x' })).not.toBeInTheDocument();
    });
  });

  it('stays while the pointer is on the menu, having crossed from what opened it', async () => {
    const user = draw();

    await user.hover(screen.getByRole('button', { name: 'Films' }));
    const choice = await screen.findByRole('menuitemradio', { name: '2x' });

    await user.unhover(screen.getByRole('button', { name: 'Films' }));
    await user.hover(choice);
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(screen.getByRole('menuitemradio', { name: '2x' })).toBeInTheDocument();
  });

  it('opens from the keyboard with the down arrow, for anybody with no pointer', async () => {
    const user = draw();

    screen.getByRole('button', { name: 'Films' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(await screen.findByRole('menuitemradio', { name: '2x' })).toBeInTheDocument();
  });
});
