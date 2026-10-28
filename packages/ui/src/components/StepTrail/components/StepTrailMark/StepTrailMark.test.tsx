import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepTrailMark } from './StepTrailMark';

/**
 * The status the mark draws its ring with.
 */
const statusIn = (container: HTMLElement): string | null | undefined =>
  container.querySelector('[data-status]')?.getAttribute('data-status');

describe('StepTrailMark', () => {
  it('draws a done step as done, and a failed one as failed', () => {
    expect(statusIn(render(<StepTrailMark kind="done" />).container)).toBe('done');
    expect(statusIn(render(<StepTrailMark kind="failed" />).container)).toBe('failed');
  });

  it('turns for the step under way', () => {
    expect(statusIn(render(<StepTrailMark kind="current" />).container)).toBe('running');
  });

  it('waits for a step still to come, and for one that waits on somebody', () => {
    expect(statusIn(render(<StepTrailMark kind="waiting" />).container)).toBe('pending');
    expect(statusIn(render(<StepTrailMark kind="locked" />).container)).toBe('pending');
  });
});
