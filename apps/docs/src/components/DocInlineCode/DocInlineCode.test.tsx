import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocInlineCode } from '@ValenceDocs/components/DocInlineCode/DocInlineCode';

describe('DocInlineCode', () => {
  it('draws code inside a sentence as a badge', () => {
    render(<DocInlineCode>PORT</DocInlineCode>);

    const code = screen.getByText('PORT');

    expect(code.tagName).toBe('CODE');
    expect(code.parentElement).toHaveClass('mx-0.5');
  });

  it('leaves the code inside a block to the block', () => {
    render(<DocInlineCode className="hljs language-ts">let x</DocInlineCode>);

    const code = screen.getByText('let x');

    expect(code).toHaveClass('hljs');
    expect(code.parentElement).not.toHaveClass('mx-0.5');
  });
});
