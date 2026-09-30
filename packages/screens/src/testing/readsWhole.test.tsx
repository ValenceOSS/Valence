import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readsWhole } from './readsWhole';

describe('readsWhole', () => {
  it('finds the element whose parts read the words together', () => {
    render(
      <p>
        <span data-testid="whole">
          <b>4</b> items
        </span>
      </p>,
    );

    expect(screen.getByText(readsWhole('4 items'))).toBe(screen.getByTestId('whole'));
  });

  it('finds nothing where the words are not there', () => {
    render(
      <span>
        <b>4</b> things
      </span>,
    );

    expect(screen.queryByText(readsWhole('4 items'))).toBeNull();
  });
});
