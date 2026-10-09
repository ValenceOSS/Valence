import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MACHINES } from '@ValenceLanding/content/requirements/MACHINES';
import { MachineCard } from './MachineCard';

const withGuide = MACHINES.find((machine) => machine.guide !== null);

const withoutGuide = MACHINES.find((machine) => machine.guide === null);

describe('MachineCard', () => {
  it('names the machine, what it is, and how far it works today', () => {
    const machine = MACHINES[0];

    if (machine === undefined) {
      throw new Error('There are no machines to show.');
    }

    render(<MachineCard machine={machine} />);

    expect(screen.getByRole('heading', { level: 3, name: machine.name })).toBeInTheDocument();
    expect(screen.getByText(machine.examples)).toBeInTheDocument();
    expect(screen.getByText(machine.acceleration)).toBeInTheDocument();
  });

  it('links to the setup guide where there is one, and nowhere where there is not', () => {
    if (withGuide === undefined || withoutGuide === undefined) {
      throw new Error('The machines no longer cover both cases.');
    }

    const { unmount } = render(<MachineCard machine={withGuide} />);

    expect(screen.getByRole('link', { name: /Setup guide/ })).toHaveAttribute(
      'href',
      expect.stringContaining(withGuide.guide ?? ''),
    );

    unmount();
    render(<MachineCard machine={withoutGuide} />);

    expect(screen.queryByRole('link', { name: /Setup guide/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MachineCard.displayName).toBe('MachineCard');
  });
});
