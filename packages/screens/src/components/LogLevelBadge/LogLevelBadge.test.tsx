import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LogLevelBadge } from './LogLevelBadge';

describe('LogLevelBadge', () => {
  it('says the level in words rather than as its code', () => {
    render(<LogLevelBadge level="info" />);

    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.queryByText('INFO')).not.toBeInTheDocument();
  });

  it('puts a mark beside every level, quiet ones included', () => {
    const { container } = render(<LogLevelBadge level="debug" />);

    expect(container.querySelector('.valence-icon')).not.toBeNull();
  });

  it('calls a warning a warning, and an error an error', () => {
    render(
      <>
        <LogLevelBadge level="warn" />
        <LogLevelBadge level="error" />
      </>,
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LogLevelBadge.displayName).toBe('LogLevelBadge');
  });
});
