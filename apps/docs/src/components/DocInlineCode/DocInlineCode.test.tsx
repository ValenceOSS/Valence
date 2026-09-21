import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocInlineCode } from '@ValenceDocs/components/DocInlineCode/DocInlineCode';

describe('DocInlineCode', () => {
  it('boxes code inside a sentence', () => {
    render(<DocInlineCode>PORT</DocInlineCode>);

    expect(screen.getByText('PORT')).toHaveClass('bg-surface-raised');
  });

  it('leaves the code inside a block to the block', () => {
    render(<DocInlineCode className="hljs language-ts">let x</DocInlineCode>);

    expect(screen.getByText('let x')).not.toHaveClass('bg-surface-raised');
  });
});
