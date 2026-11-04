import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TagField } from './TagField';

const SUGGESTED = [
  { value: 'Science Fiction', count: 40 },
  { value: 'Drama', count: 120 },
];

/**
 * A tag field that holds its own words, as a page does.
 *
 * @param props - The words it starts with, and who to tell of a change.
 * @param props.start - The words it starts with.
 * @param props.onChange - Told the words after every change.
 * @returns The field.
 */
const Held = ({ start, onChange }: { start: string[]; onChange: (values: string[]) => void }) => {
  const [values, setValues] = useState(start);

  return (
    <TagField
      label="Genres"
      values={values}
      suggestions={SUGGESTED}
      onValuesChange={(next) => {
        setValues(next);
        onChange(next);
      }}
    />
  );
};

describe('TagField', () => {
  it('adds what was typed on Enter, and each word before a comma', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Held start={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText('Genres'), 'Heist, Thriller{Enter}');

    expect(onChange).toHaveBeenLastCalledWith(['Heist', 'Thriller']);
    expect(screen.getByRole('button', { name: 'Remove Heist' })).toBeInTheDocument();
  });

  it('suggests a word already in use, and keeps the library’s spelling of it', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Held start={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText('Genres'), 'science');

    expect(screen.getByRole('option', { name: /Science Fiction/ })).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith(['Science Fiction']);
  });

  it('never adds the same word twice, whatever its spelling', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Held start={['Science Fiction']} onChange={onChange} />);

    await user.type(screen.getByLabelText('Genres'), 'science-fiction,');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('takes the last word away on Backspace in an empty field, and one by its chip', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Held start={['Drama', 'Heist']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove Drama' }));
    expect(onChange).toHaveBeenLastCalledWith(['Heist']);

    await user.type(screen.getByLabelText('Genres'), '{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('moves a word with Alt and an arrow, and by dragging it onto another', async () => {
    const onValuesChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TagField
        label="Genres"
        values={['Drama', 'Crime', 'Thriller']}
        onValuesChange={onValuesChange}
      />,
    );

    screen.getByRole('button', { name: 'Remove Crime' }).focus();
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    expect(onValuesChange).toHaveBeenLastCalledWith(['Crime', 'Drama', 'Thriller']);

    const [, crime, thriller] = document.querySelectorAll('[data-slot="tag"]');

    fireEvent.dragStart(thriller ?? document.body, {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });
    fireEvent.dragOver(crime ?? document.body);
    fireEvent.drop(crime ?? document.body);

    expect(onValuesChange).toHaveBeenLastCalledWith(['Drama', 'Thriller', 'Crime']);
  });
});
