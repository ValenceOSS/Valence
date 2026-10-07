import { render, screen } from '@testing-library/react';
import { Plug as PlugIcon } from '@keyline-icons/react/duotone';
import { describe, expect, it } from 'vitest';
import { ByTheWay } from './ByTheWay';

describe('ByTheWay', () => {
  it('says what it says after "by the way", where its section puts it', () => {
    const { container } = render(
      <ByTheWay drawing={PlugIcon} className="left-4 top-8">
        Every plugin runs in a process of its own.
      </ByTheWay>,
    );

    expect(screen.getByText('By the way...')).toBeInTheDocument();
    expect(screen.getByText(/Every plugin runs in a process of its own/u)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('absolute', 'left-4', 'top-8');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ByTheWay.displayName).toBe('ByTheWay');
  });
});
