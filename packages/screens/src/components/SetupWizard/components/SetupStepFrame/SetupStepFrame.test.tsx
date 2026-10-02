import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetupStepFrame } from './SetupStepFrame';

describe('SetupStepFrame', () => {
  it('names the step once to assistive technology, however it is drawn', () => {
    render(<SetupStepFrame title="Your profile" lead="How you appear." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Your profile' })).toBeInTheDocument();
  });

  it('moves focus to the heading as the step arrives', () => {
    render(<SetupStepFrame title="Your profile" lead="How you appear." />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('says what the step is for', () => {
    render(<SetupStepFrame title="Your profile" lead="How you appear." />);

    expect(screen.getByText('How you appear.')).toBeInTheDocument();
  });

  it('draws only the lead when it asks nothing and leads nowhere', () => {
    const { container } = render(<SetupStepFrame title="Done" lead="All set." />);

    expect(container.querySelector('footer')).toBeNull();
  });

  it('draws what it asks, its way back and its ways on, and something under them', () => {
    render(
      <SetupStepFrame
        title="Your profile"
        lead="How you appear."
        back={<span>Back</span>}
        actions={<span>Continue</span>}
        aside={<span>Posters</span>}
        isWide
      >
        <span>The question</span>
      </SetupStepFrame>,
    );

    expect(screen.getByText('The question')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('Posters')).toBeInTheDocument();
  });

  it('draws its ways on without a way back', () => {
    render(<SetupStepFrame title="Welcome" lead="Hello." actions={<span>Begin</span>} />);

    expect(screen.getByText('Begin')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });
});
