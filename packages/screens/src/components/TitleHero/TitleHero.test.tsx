import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitleHero } from './TitleHero';

describe('TitleHero', () => {
  it('lays the title and its corners over the picture', () => {
    render(
      <TitleHero
        preview={<span>Backdrop</span>}
        lead={<span>Back</span>}
        corner={<span>Close</span>}
      >
        <span>Severance</span>
      </TitleHero>,
    );

    expect(screen.getByText('Backdrop')).toBeTruthy();
    expect(screen.getByText('Severance')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('leaves out the corners it is not given', () => {
    const { container } = render(
      <TitleHero preview={<span>Backdrop</span>}>
        <span>Severance</span>
      </TitleHero>,
    );

    expect(container.querySelector('.top-4')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleHero.displayName).toBe('TitleHero');
  });
});
