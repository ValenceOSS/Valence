import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocTable } from '@ValenceDocs/components/DocTable/DocTable';

describe('DocTable', () => {
  it('renders the table inside something that scrolls', () => {
    render(
      <DocTable>
        <tbody>
          <tr>
            <td>cell</td>
          </tr>
        </tbody>
      </DocTable>,
    );

    expect(screen.getByRole('table').parentElement).toHaveClass('overflow-x-auto');
  });
});
