import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountFace } from './AccountFace';

describe('AccountFace', () => {
  it('draws the face it is given', () => {
    render(<AccountFace avatar={<span>face</span>} />);

    expect(screen.getByText('face')).toBeInTheDocument();
  });

  it('says the name once to somebody listening, rather than letter by letter', () => {
    const { container } = render(<AccountFace avatar={<span>face</span>} name="Marques" />);

    expect(screen.getByText('Marques')).toHaveClass('sr-only');
    expect(container.querySelector('[aria-hidden]')?.textContent).toBe('Marques');
  });

  it('writes the whole name, never cut short', () => {
    const { container } = render(
      <AccountFace avatar={<span>face</span>} name="A very long profile name" />,
    );

    expect(container.querySelector('[aria-hidden]')?.textContent).toBe('A very long profile name');
    expect(container.querySelector('.truncate')).toBeNull();
  });

  it('draws the face alone where there is no name', () => {
    const { container } = render(<AccountFace avatar={<span>face</span>} />);

    expect(container.querySelector('.sr-only')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountFace.displayName).toBe('AccountFace');
  });
});
