import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { styleElement } from '@ValenceDocs/components/styleElement/styleElement';

describe('styleElement', () => {
  it('renders the element it was given with the classes it was given', () => {
    const Paragraph = styleElement('p', 'text-sm');

    render(<Paragraph>Words</Paragraph>);

    expect(screen.getByText('Words').tagName).toBe('P');
    expect(screen.getByText('Words')).toHaveClass('text-sm');
  });

  it('lets the caller add classes', () => {
    const Item = styleElement('li', 'a');

    render(<Item className="b">Item</Item>);

    expect(screen.getByText('Item')).toHaveClass('a', 'b');
  });

  it('names the component for its element', () => {
    expect(styleElement('td', '').displayName).toBe('Doc.td');
  });
});
