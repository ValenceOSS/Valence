import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Hardware } from '@ValenceContracts/schemas/Hardware';
import { ProcessorInfo } from './ProcessorInfo';

const machine = (change: Partial<Hardware> = {}): Hardware => ({
  surroundings: 'host',
  processor: { model: 'Apple M5 Pro', cores: 2, threads: 2, speedMhz: 4608, groups: [] },
  memory: { totalBytes: 0, modules: [] },
  drives: [],
  ...change,
});

describe('ProcessorInfo', () => {
  it('names the processor and counts its cores and threads', () => {
    render(<ProcessorInfo hardware={machine()} percents={[]} speedsMhz={[]} />);

    expect(screen.getByText('Apple M5 Pro')).toBeInTheDocument();
    expect(screen.getByText('Cores')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('gives the top speed in gigahertz', () => {
    render(<ProcessorInfo hardware={machine()} percents={[]} speedsMhz={[]} />);

    expect(screen.getByText('4.61 GHz')).toBeInTheDocument();
  });

  it('gives the current speed only where the platform reports a moving one', () => {
    const { rerender } = render(
      <ProcessorInfo hardware={machine()} percents={[]} speedsMhz={[]} />,
    );

    expect(screen.queryByText('Current speed')).not.toBeInTheDocument();

    rerender(<ProcessorInfo hardware={machine()} percents={[]} speedsMhz={[2000, 3000]} />);

    expect(screen.getByText('Current speed')).toBeInTheDocument();
    expect(screen.getByText('2.5 GHz')).toBeInTheDocument();
  });

  it('draws the cores with how busy each is', () => {
    render(<ProcessorInfo hardware={machine()} percents={[12, 34]} speedsMhz={[]} />);

    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByText('34%')).toBeInTheDocument();
  });

  it('warns that a virtual machine shows what it was given', () => {
    render(
      <ProcessorInfo
        hardware={machine({ surroundings: 'virtualMachine', processor: null })}
        percents={[]}
        speedsMhz={[]}
      />,
    );

    expect(screen.getByText(/inside a virtual machine/u)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProcessorInfo.displayName).toBe('ProcessorInfo');
  });
});
