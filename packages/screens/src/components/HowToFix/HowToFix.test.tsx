import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowToFix } from './HowToFix';

describe('HowToFix', () => {
  it('links to the section of the docs about the problem, opening apart from Valence', () => {
    render(<HowToFix href="https://docs.getvalence.app/install/requesting#the-vpn-is-down" />);

    const link = screen.getByRole('link', { name: 'How to fix this' });

    expect(link).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/install/requesting#the-vpn-is-down',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('says nothing where no section explains the problem', () => {
    expect(render(<HowToFix href={null} />).container).toBeEmptyDOMElement();
    expect(render(<HowToFix href={undefined} />).container).toBeEmptyDOMElement();
  });
});
