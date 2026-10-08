import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TranscodingPage } from './TranscodingPage';

describe('TranscodingPage', () => {
  it('names the page', () => {
    render(<TranscodingPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Direct play when');
  });

  it('sets out every point the page makes', () => {
    render(<TranscodingPage />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getByRole('heading', { level: 2, name: 'Direct play wins' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TranscodingPage.displayName).toBe('TranscodingPage');
  });
});
