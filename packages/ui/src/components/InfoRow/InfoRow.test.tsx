import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoRow } from './InfoRow';

describe('InfoRow', () => {
  it('says what the fact is quietly, and its value after it', () => {
    render(<InfoRow label="Processor">42%</InfoRow>);

    expect(screen.getByText('Processor')).toHaveClass('text-text-muted');
    expect(screen.getByText('42%')).toHaveClass('text-text', 'tabular-nums');
    expect(screen.getByText('Processor').nextElementSibling).toBe(screen.getByText('42%'));
  });

  it('stands at the height of a menu option, so a card of facts reads like the menus', () => {
    render(<InfoRow label="Memory">8 GB</InfoRow>);

    expect(screen.getByText('Memory').parentElement).toHaveClass('min-h-7');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(InfoRow.displayName).toBe('InfoRow');
  });
});
