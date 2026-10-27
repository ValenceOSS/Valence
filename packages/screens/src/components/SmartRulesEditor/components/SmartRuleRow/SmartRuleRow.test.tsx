import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { blankRule } from '@ValenceClient/smart/blankRule';
import { SmartRuleRow } from './SmartRuleRow';
import type { SmartRuleRowProps } from './SmartRuleRow.types';

/**
 * A rule row with nothing to say, holding the rule given.
 *
 * @param changes - What differs.
 * @returns The props.
 */
const aRow = (changes: Partial<SmartRuleRowProps>): SmartRuleRowProps => ({
  rule: blankRule('released', 'k'),
  kinds: ['released', 'runtime'],
  genres: [],
  libraries: [],
  note: null,
  problem: null,
  onChange: vi.fn(),
  onRemove: vi.fn(),
  ...changes,
});

describe('SmartRuleRow', () => {
  it('asks a range of years for when something came out', () => {
    render(<SmartRuleRow {...aRow({})} />);

    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('says each number as it is typed', async () => {
    const onChange = vi.fn();

    render(<SmartRuleRow {...aRow({ onChange })} />);

    await userEvent.type(screen.getByLabelText('From'), '1');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ first: '1' }));
  });

  it('is taken away from its button', async () => {
    const onRemove = vi.fn();

    render(<SmartRuleRow {...aRow({ onRemove })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove this rule' }));

    expect(onRemove).toHaveBeenCalled();
  });

  it('says what is worth knowing, and why it cannot be saved yet', () => {
    render(
      <SmartRuleRow
        {...aRow({
          note: 'Only films have a runtime.',
          problem: 'Check the numbers in this rule, or remove it.',
        })}
      />,
    );

    expect(screen.getByText('Only films have a runtime.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check the numbers in this rule, or remove it.',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SmartRuleRow.displayName).toBe('SmartRuleRow');
  });
});
