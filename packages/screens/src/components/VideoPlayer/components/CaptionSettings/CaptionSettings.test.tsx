import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CaptionSettings } from './CaptionSettings';
import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import type { CaptionSettingsProps } from './CaptionSettings.types';

const draw = (overrides: Partial<CaptionSettingsProps> = {}) => {
  const props: CaptionSettingsProps = {
    style: DEFAULT_CAPTION_STYLE,
    onChange: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };

  render(<CaptionSettings {...props} />);

  return props;
};

describe('CaptionSettings', () => {
  it('names itself so it can be found and dismissed', () => {
    draw();

    expect(screen.getByRole('region', { name: 'Caption settings' })).toBeInTheDocument();
  });

  it('shows a preview drawn the way the captions will be', () => {
    draw({ style: { ...DEFAULT_CAPTION_STYLE, color: '#ffff00', fontScale: 200 } });

    const preview = screen.getByLabelText('Caption preview');

    expect(preview).toHaveStyle({ color: 'rgba(255, 255, 0, 1)' });
    expect(preview.style.fontSize).toBe('calc(1.5rem)');
  });

  it('reports a change of size', async () => {
    const user = userEvent.setup();
    const props = draw();

    screen.getByRole('slider', { name: 'Caption size' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ fontScale: 105 }));
  });

  it('sizes captions anywhere from a tenth to five times their usual size', async () => {
    const user = userEvent.setup();
    const props = draw({ style: { ...DEFAULT_CAPTION_STYLE, fontScale: 50 } });
    const size = screen.getByRole('slider', { name: 'Caption size' });

    expect(size).toHaveAttribute('aria-valuemin', '10');
    expect(size).toHaveAttribute('aria-valuemax', '500');

    size.focus();
    await user.keyboard('{ArrowLeft}');

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ fontScale: 45 }));
  });

  it('reports a change of background opacity as a fraction', async () => {
    const user = userEvent.setup();
    const props = draw({ style: { ...DEFAULT_CAPTION_STYLE, backgroundOpacity: 0.5 } });

    screen.getByRole('slider', { name: 'Caption background opacity' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ backgroundOpacity: 0.55 }),
    );
  });

  it('reports a change of font', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Caption font' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Typewriter' }));

    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: 'typewriter' }),
    );
  });

  it('reports a change of weight', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ fontWeight: 'bold' }));
  });

  it('reports a change of edge treatment', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Shadow' }));

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ edgeStyle: 'shadow' }));
  });

  it('offers an outline thickness only while the edge is an outline', () => {
    draw({ style: { ...DEFAULT_CAPTION_STYLE, edgeStyle: 'shadow' } });

    expect(
      screen.queryByRole('slider', { name: 'Caption outline thickness' }),
    ).not.toBeInTheDocument();
  });

  it('names the outline thickness in words and reports a change of it', async () => {
    const user = userEvent.setup();
    const props = draw({ style: { ...DEFAULT_CAPTION_STYLE, outlineThickness: 3 } });

    expect(screen.getByText('Thick')).toBeInTheDocument();

    screen.getByRole('slider', { name: 'Caption outline thickness' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ outlineThickness: 4 }));
  });

  it('separates the text colour from the background colour', async () => {
    const user = userEvent.setup();
    const props = draw();

    const [text, background] = screen.getAllByRole('button', { name: 'Yellow' });

    expect(text).toBeInTheDocument();
    expect(background).toBeInTheDocument();

    await user.click(background ?? screen.getByText('Yellow'));

    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ backgroundColor: '#ffff00' }),
    );
  });

  it('puts everything back on request', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('brings no way out of its own, since the panel around it has one', () => {
    draw();

    expect(
      screen.queryByRole('button', { name: 'Close caption settings' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CaptionSettings.displayName).toBe('CaptionSettings');
  });
});
