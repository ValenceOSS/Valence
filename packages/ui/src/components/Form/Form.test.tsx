import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Form } from './Form';

describe('Form', () => {
  it('is sent by pressing Enter in a field, the same as by its button', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });

    render(
      <Form label="Add a library" onSubmit={onSubmit}>
        <input aria-label="Name" />
        <button type="submit">Add</button>
      </Form>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Films{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('leaves the judging to its caller rather than the browser', () => {
    render(
      <Form label="Add a library" onSubmit={vi.fn()}>
        <input aria-label="Name" required />
      </Form>,
    );

    expect(screen.getByRole('form', { name: 'Add a library' })).toHaveAttribute('novalidate');
  });

  it('is told even when a required field is empty, so the schema can say what is wrong', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });

    render(
      <Form label="Add a library" onSubmit={onSubmit}>
        <input aria-label="Name" required />
      </Form>,
    );

    fireEvent.submit(screen.getByRole('form', { name: 'Add a library' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('lays a dialog body and footer out as the dialog would where it holds them', () => {
    render(
      <Form label="Ban" onSubmit={vi.fn()} isDialog>
        <span>Body</span>
      </Form>,
    );

    expect(screen.getByRole('form', { name: 'Ban' })).toHaveClass('flex-1', 'min-h-0');
  });

  it('spaces its fields apart otherwise', () => {
    render(
      <Form label="Ban" onSubmit={vi.fn()}>
        <span>Body</span>
      </Form>,
    );

    expect(screen.getByRole('form', { name: 'Ban' })).toHaveClass('gap-5');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Form.displayName).toBe('Form');
  });
});
