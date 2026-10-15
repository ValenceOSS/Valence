import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentAdvisory } from './ContentAdvisory';

describe('ContentAdvisory', () => {
  it('says what a title is rated and contains while it is the moment to', () => {
    render(
      <ContentAdvisory
        certification="15"
        region="GB"
        advisories={['violence', 'language']}
        isShown
      />,
    );

    expect(screen.getByText(/^Contains Violence.+Strong language$/u)).toBeInTheDocument();
  });

  it('says nothing once the moment has passed', () => {
    render(
      <ContentAdvisory certification="15" region="GB" advisories={['violence']} isShown={false} />,
    );

    expect(screen.queryByText(/Contains/u)).not.toBeInTheDocument();
  });

  it('draws nothing where there is neither a rating nor anything to warn of', () => {
    const { container } = render(
      <ContentAdvisory certification={null} region={null} advisories={null} isShown />,
    );

    expect(container.querySelector('[data-slot="content-advisory"]')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ContentAdvisory.displayName).toBe('ContentAdvisory');
  });
});
