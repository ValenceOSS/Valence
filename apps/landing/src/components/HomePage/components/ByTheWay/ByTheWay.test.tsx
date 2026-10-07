import { render, screen } from '@testing-library/react';
import { Plug as PlugIcon } from '@keyline-icons/react/duotone';
import { describe, expect, it } from 'vitest';
import { ByTheWay } from './ByTheWay';

describe('ByTheWay', () => {
  it('says what it says after its opening, where its section puts it', () => {
    const { container } = render(
      <ByTheWay lead="Psst..." drawing={PlugIcon} className="left-4 top-8">
        Every plugin runs in a process of its own.
      </ByTheWay>,
    );

    expect(screen.getByText('Psst...')).toBeInTheDocument();
    expect(screen.getByText(/Every plugin runs in a process of its own/u)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('absolute', 'left-4', 'top-8');
  });

  it('sets a footnote small beneath it, where it has one', () => {
    render(
      <ByTheWay lead="Fun fact..." drawing={PlugIcon} footnote="*From before 2025">
        It plays on Fire TV* too.
      </ByTheWay>,
    );

    expect(screen.getByText('*From before 2025')).toHaveClass('text-lg');
  });

  it('lines up on its right where asked to', () => {
    const { container } = render(
      <ByTheWay lead="Did you know..." drawing={PlugIcon} isRightAligned>
        Nothing is sent home.
      </ByTheWay>,
    );

    expect(container.firstElementChild).toHaveClass('text-right');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ByTheWay.displayName).toBe('ByTheWay');
  });
});
