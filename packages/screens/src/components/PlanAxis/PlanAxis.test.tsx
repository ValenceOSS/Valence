import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanAxis } from './PlanAxis';

const draw = (axis: Parameters<typeof PlanAxis>[0]) =>
  render(
    <dl>
      <PlanAxis {...axis} />
    </dl>,
  );

describe('PlanAxis', () => {
  it('shows what was decided with the reason underneath', () => {
    draw({ name: 'Video', kind: 'transcode', reason: 'Client does not support hevc' });

    expect(screen.getByText('transcode')).toBeInTheDocument();
    expect(screen.getByText('Client does not support hevc')).toBeInTheDocument();
  });

  it('shows the ceiling being encoded to beside the decision', () => {
    draw({ name: 'Audio', kind: 'transcode', reason: null, ceiling: '192 kbps' });

    expect(screen.getByText('192 kbps')).toBeInTheDocument();
  });

  it('writes a burn-in as words', () => {
    draw({ name: 'Subtitles', kind: 'burnIn', reason: null });

    expect(screen.getByText('burn in')).toBeInTheDocument();
  });

  it('says it is deciding while the plan is still being worked out', () => {
    draw({ name: 'Video', kind: null, reason: null });

    expect(screen.getByText('deciding')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PlanAxis.displayName).toBe('PlanAxis');
  });
});
