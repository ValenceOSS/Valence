import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from '@ValenceUI/Switch';
import { LimitRow } from './LimitRow';

describe('LimitRow', () => {
  it('says what the limit is and does, beside the control that sets it', () => {
    render(
      <ul>
        <LimitRow
          label="Limit downloads too"
          detail="Downloads are saved at this quality or lower."
          control={<Switch label="Limit downloads too" isLabelHidden isOn onToggle={vi.fn()} />}
        />
      </ul>,
    );

    const row = screen.getByRole('listitem');

    expect(row).toHaveTextContent('Limit downloads too');
    expect(row).toHaveTextContent('Downloads are saved at this quality or lower.');
    expect(screen.getByRole('switch', { name: 'Limit downloads too' })).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LimitRow.displayName).toBe('LimitRow');
  });
});
