import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocImage } from '@ValenceDocs/components/DocImage/DocImage';

describe('DocImage', () => {
  it('captions the image with its description', () => {
    render(<DocImage src="/screenshots/a.png" alt="The libraries page" />);

    expect(screen.getByRole('img', { name: 'The libraries page' })).toHaveAttribute(
      'src',
      '/screenshots/a.png',
    );
    expect(screen.getAllByText('The libraries page')).toHaveLength(1);
  });

  it('has no caption where it has no description', () => {
    const { container } = render(<DocImage src="/a.png" />);

    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
});
