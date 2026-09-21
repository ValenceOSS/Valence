import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilePicker } from './FilePicker';

const fileOf = (name: string) => new File(['a picture'], name, { type: 'image/webp' });

/**
 * The control itself, found the way a screen reader would name it — by its label rather than by a
 * test identifier. Matched loosely because the label also wraps whatever the caller drew inside it.
 */
const inputOf = (): HTMLElement => screen.getByLabelText(/Upload a photograph/);

describe('FilePicker', () => {
  it('names itself for anybody who cannot see the control', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(inputOf()).toBeInTheDocument();
  });

  it('shows whatever it was given to show, since the native control cannot be styled', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it('reports the file that was chosen', async () => {
    const onPick = vi.fn();
    const actor = userEvent.setup();

    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={onPick}>
        <span>Choose</span>
      </FilePicker>,
    );

    await actor.upload(inputOf(), fileOf('me.webp'));

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'me.webp' }));
  });

  it('counts the same file twice, rather than ignoring the second attempt', async () => {
    const onPick = vi.fn();
    const actor = userEvent.setup();

    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={onPick}>
        <span>Choose</span>
      </FilePicker>,
    );

    await actor.upload(inputOf(), fileOf('me.webp'));
    await actor.upload(inputOf(), fileOf('me.webp'));

    expect(onPick).toHaveBeenCalledTimes(2);
  });

  it('says which files it will take', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp,video/webm" onPick={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(inputOf()).toHaveAttribute('accept', 'image/webp,video/webm');
  });

  it('takes nothing while it is disabled', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={vi.fn()} disabled>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(inputOf()).toBeDisabled();
  });

  it('ignores a chooser that was dismissed without picking anything', () => {
    const onPick = vi.fn();

    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={onPick}>
        <span>Choose</span>
      </FilePicker>,
    );

    const input = inputOf();

    fireEvent.change(input, { target: { files: [] } });

    expect(onPick).not.toHaveBeenCalled();
  });

  it('is painted as a Button is, white unless told otherwise', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    const label = screen.getByText('Choose').closest('label');

    expect(label).toHaveClass('rounded-md', 'border', 'bg-[var(--surface-hover)]', 'h-9');
    expect(label?.className).not.toMatch(/rounded-(full|pill)/);
  });

  it('takes the size and variant a Button would', () => {
    render(
      <FilePicker
        label="Upload a photograph"
        accept="image/webp"
        onPick={vi.fn()}
        variant="secondary"
        size="lg"
      >
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByText('Choose').closest('label')).toHaveClass(
      'bg-[var(--surface-hover)]',
      'h-10',
    );
  });

  it('shows a spinner and refuses another file while one is being handled', () => {
    render(
      <FilePicker label="Upload a photograph" accept="image/webp" onPick={vi.fn()} isLoading>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(inputOf()).toBeDisabled();
  });

  it('reports every file chosen where several are wanted', async () => {
    const onPickMany = vi.fn();
    const actor = userEvent.setup();

    render(
      <FilePicker label="Choose films" onPickMany={onPickMany}>
        <span>Choose</span>
      </FilePicker>,
    );

    await actor.upload(screen.getByLabelText(/Choose films/), [fileOf('a.mkv'), fileOf('b.mkv')]);

    expect(onPickMany).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'a.mkv' }),
      expect.objectContaining({ name: 'b.mkv' }),
    ]);
  });

  it('lets one file be chosen unless several are wanted', () => {
    render(
      <FilePicker label="Upload a photograph" onPick={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(inputOf()).not.toHaveAttribute('multiple');
  });

  it('lets several be chosen where several are wanted', () => {
    render(
      <FilePicker label="Choose films" onPickMany={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByLabelText(/Choose films/)).toHaveAttribute('multiple');
  });

  it('chooses a whole folder where asked to', () => {
    render(
      <FilePicker label="Choose a folder" onPickMany={vi.fn()} isFolder>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByLabelText(/Choose a folder/)).toHaveAttribute('webkitdirectory');
  });

  it('chooses files, not a folder, by default', () => {
    render(
      <FilePicker label="Choose films" onPickMany={vi.fn()}>
        <span>Choose</span>
      </FilePicker>,
    );

    expect(screen.getByLabelText(/Choose films/)).not.toHaveAttribute('webkitdirectory');
  });

  it('says nothing when nothing was chosen', () => {
    const onPickMany = vi.fn();

    render(
      <FilePicker label="Choose films" onPickMany={onPickMany}>
        <span>Choose</span>
      </FilePicker>,
    );

    fireEvent.change(screen.getByLabelText(/Choose films/), { target: { files: [] } });

    expect(onPickMany).not.toHaveBeenCalled();
  });

  describe('as somewhere to drop files', () => {
    const entryFor = (name: string) => ({
      isFile: true,
      isDirectory: false,
      fullPath: `/${name}`,
      file: (done: (file: File) => void) => {
        done(new File(['x'], name));
      },
    });

    it('takes files and folders dropped on it, and reports what was in them', async () => {
      const onPickMany = vi.fn();

      render(
        <FilePicker label="Drop films here" onPickMany={onPickMany} isDropZone>
          <span>Drop or press</span>
        </FilePicker>,
      );

      fireEvent.drop(screen.getByText('Drop or press').closest('label') ?? document.body, {
        dataTransfer: {
          items: [{ webkitGetAsEntry: () => entryFor('a.mkv') }],
          files: [],
        },
      });

      await vi.waitFor(() => {
        expect(onPickMany).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.mkv' })]);
      });
    });

    it('says nothing when what was dropped held no files', async () => {
      const onPickMany = vi.fn();

      render(
        <FilePicker label="Drop films here" onPickMany={onPickMany} isDropZone>
          <span>Drop or press</span>
        </FilePicker>,
      );

      fireEvent.drop(screen.getByText('Drop or press').closest('label') ?? document.body, {
        dataTransfer: { items: [], files: [] },
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(onPickMany).not.toHaveBeenCalled();
    });

    it('lights up while something is dragged over it, and stops when it leaves', () => {
      render(
        <FilePicker label="Drop films here" onPickMany={vi.fn()} isDropZone>
          <span>Drop or press</span>
        </FilePicker>,
      );

      const zone = screen.getByText('Drop or press').closest('label') ?? document.body;

      fireEvent.dragOver(zone);

      expect(zone).toHaveClass('border-accent');

      fireEvent.dragLeave(zone);

      expect(zone).not.toHaveClass('border-accent');
    });

    it('takes nothing dropped on it while it is disabled', async () => {
      const onPickMany = vi.fn();

      render(
        <FilePicker label="Drop films here" onPickMany={onPickMany} isDropZone disabled>
          <span>Drop or press</span>
        </FilePicker>,
      );

      fireEvent.drop(screen.getByText('Drop or press').closest('label') ?? document.body, {
        dataTransfer: { items: [{ webkitGetAsEntry: () => entryFor('a.mkv') }], files: [] },
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(onPickMany).not.toHaveBeenCalled();
    });

    it('still opens the file dialog when pressed, offering only what was asked for', () => {
      render(
        <FilePicker label="Drop films here" onPickMany={vi.fn()} isDropZone accept=".mkv,.mp4">
          <span>Drop or press</span>
        </FilePicker>,
      );

      expect(screen.getByLabelText(/Drop films here/)).toHaveAttribute('accept', '.mkv,.mp4');
      expect(screen.getByLabelText(/Drop films here/)).toHaveAttribute('multiple');
    });
  });
});
