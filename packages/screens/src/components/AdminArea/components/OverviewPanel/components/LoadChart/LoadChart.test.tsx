import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadChart } from './LoadChart';
import type { LoadReading } from './LoadChart.types';

const reading = (at: number, cpu: number): LoadReading => ({
  atMs: at,
  systemCpuPercent: cpu,
  loadAverage: 1.5,
  systemMemoryUsedBytes: 4 * 1024 ** 3,
  systemMemoryTotalBytes: 16 * 1024 ** 3,
  cpuCount: 8,
});

const figure = (name: string) => screen.getByText(name).nextElementSibling;

describe('LoadChart', () => {
  it('says the latest, the average and the peak of the range', () => {
    render(<LoadChart readings={[reading(0, 20), reading(1, 80), reading(2, 50)]} range="24h" />);

    expect(figure('Latest')).toHaveTextContent('50%');
    expect(figure('Average')).toHaveTextContent('50%');
    expect(figure('Peak')).toHaveTextContent('80%');
  });

  it('calls the latest reading now while it shows the last minute', () => {
    render(<LoadChart readings={[reading(0, 30)]} range="minute" />);

    expect(figure('Now')).toHaveTextContent('30%');
    expect(screen.queryByText('Latest')).not.toBeInTheDocument();
  });

  it('shows a dash for every figure where nothing has been read', () => {
    render(<LoadChart readings={[]} range="7d" />);

    expect(figure('Peak')).toHaveTextContent('—');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoadChart.displayName).toBe('LoadChart');
  });
});
