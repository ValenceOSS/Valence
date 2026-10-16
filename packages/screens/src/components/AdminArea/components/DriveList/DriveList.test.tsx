import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Hardware } from '@ValenceContracts/schemas/Hardware';
import { DriveList } from './DriveList';

const machine = (change: Partial<Hardware> = {}): Hardware => ({
  surroundings: 'host',
  processor: null,
  memory: { totalBytes: 0, modules: [] },
  drives: [
    {
      name: 'nvme0n1',
      model: 'Samsung SSD 980',
      kind: 'ssd',
      connection: 'NVMe',
      totalBytes: 1_000_000_000_000,
    },
    { name: 'sda', model: null, kind: 'hdd', connection: null, totalBytes: 4_000_000_000_000 },
  ],
  ...change,
});

describe('DriveList', () => {
  it('names each drive by its model, or by what the system calls it where it has none', () => {
    render(<DriveList hardware={machine()} />);

    expect(screen.getByText('Samsung SSD 980')).toBeInTheDocument();
    expect(screen.getAllByText('sda')).not.toHaveLength(0);
  });

  it('says how each drive stores and is attached', () => {
    render(<DriveList hardware={machine()} />);

    expect(screen.getByText('NVMe')).toBeInTheDocument();
    expect(screen.getByText('SSD')).toBeInTheDocument();
    expect(screen.getByText('Hard disk')).toBeInTheDocument();
  });

  it('warns that a virtual machine shows what it was given', () => {
    render(<DriveList hardware={machine({ surroundings: 'virtualMachine' })} />);

    expect(screen.getByText(/inside a virtual machine/u)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DriveList.displayName).toBe('DriveList');
  });
});
