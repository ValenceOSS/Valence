import { fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { AppWindow } from '@keyline-icons/react/fill';
import { describe, expect, it } from 'vitest';
import { ScreenTile } from './ScreenTile';

const WEB = { label: 'Web', mark: AppWindow, where: 'Any modern browser' } as const;

const PHONE = { label: 'iPhone and iPad', mark: 'apple', where: 'The App Store' } as const;

const draw = () =>
  render(
    <ul>
      <ScreenTile screen={WEB} index={0} count={6} />
    </ul>,
  );

describe('ScreenTile', () => {
  it('names the screen and where its app comes from', () => {
    draw();

    expect(screen.getByRole('listitem')).toHaveTextContent('WebAny modern browser');
  });

  it('draws a plain icon for a screen that could be anybody’s, and a brand’s mark for one that is', () => {
    render(
      <ul>
        <ScreenTile screen={WEB} index={0} count={6} />
        <ScreenTile screen={PHONE} index={1} count={6} />
      </ul>,
    );

    const [web, phone] = screen.getAllByRole('listitem');

    expect(web?.querySelector('svg')).not.toBeNull();
    expect(phone?.querySelector('svg')).toBeNull();
  });

  it('settles back when the pointer leaves', () => {
    draw();

    const tile = screen.getByRole('listitem');

    fireEvent.pointerEnter(tile, { pointerType: 'mouse' });
    fireEvent.pointerLeave(tile, { pointerType: 'mouse' });

    expect(tile).toHaveTextContent('WebAny modern browser');
  });

  it('lights up under the pointer', () => {
    const { container } = draw();

    fireEvent.pointerEnter(screen.getByRole('listitem'), { pointerType: 'mouse' });
    fireEvent.pointerMove(screen.getByRole('listitem'), {
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    });

    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeNull();
  });

  it('holds still, with no light, for somebody who asked for stillness', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <ul>
          <ScreenTile screen={WEB} index={0} count={6} />
        </ul>
      </MotionConfig>,
    );

    expect(container.querySelector('[style*="radial-gradient"]')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScreenTile.displayName).toBe('ScreenTile');
  });
});
