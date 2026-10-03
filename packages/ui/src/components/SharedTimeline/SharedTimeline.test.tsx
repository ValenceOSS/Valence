import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SharedTimeline } from './SharedTimeline';

const face = (initial: string) => <span>{initial}</span>;

const TOGETHER = [
  { id: 'dan', atSeconds: 600, label: 'Dan, at 10:00', face: face('D') },
  { id: 'sam', atSeconds: 600, label: 'Sam, at 10:00', face: face('S') },
];

const timeline = (
  people = [
    { id: 'dan', atSeconds: 600, label: 'Dan, at 10:00', face: face('D') },
    { id: 'sam', atSeconds: 1200, label: 'Sam, at 20:00', face: face('S') },
  ],
) => (
  <SharedTimeline
    label="Each member’s position in the party"
    durationSeconds={2400}
    filledSeconds={1200}
    people={people}
    elapsed="20:00"
    total="40:00"
  />
);

describe('SharedTimeline', () => {
  it('names the bar for assistive technology', () => {
    render(timeline());

    expect(
      screen.getByRole('group', { name: 'Each member’s position in the party' }),
    ).toBeInTheDocument();
  });

  it('gives everybody a face that says who they are and where', () => {
    render(timeline());

    expect(screen.getByRole('img', { name: 'Dan, at 10:00' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sam, at 20:00' })).toBeInTheDocument();
  });

  it('places each face at the point they have reached', () => {
    render(timeline());

    const dan = screen.getByRole('img', { name: 'Dan, at 10:00' }).closest('span[style]');

    expect(dan).toHaveStyle({ left: '25%' });
  });

  it('keeps somebody past the end, or before the start, on the bar', () => {
    render(
      timeline([
        { id: 'early', atSeconds: -30, label: 'Early', face: face('E') },
        { id: 'late', atSeconds: 9000, label: 'Late', face: face('L') },
      ]),
    );

    expect(screen.getByRole('img', { name: 'Early' }).closest('span[style]')).toHaveStyle({
      left: '0%',
    });
    expect(screen.getByRole('img', { name: 'Late' }).closest('span[style]')).toHaveStyle({
      left: '100%',
    });
  });

  it('shows the time along and the time in all', () => {
    render(timeline());

    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText('40:00')).toBeInTheDocument();
  });

  it('shows a status between the two times', () => {
    render(
      <SharedTimeline
        label="Each member’s position in the party"
        durationSeconds={2400}
        filledSeconds={1200}
        people={[]}
        elapsed="20:00"
        total="40:00"
        status={<span>In sync</span>}
      />,
    );

    expect(screen.getByText('In sync')).toBeInTheDocument();
  });

  it('fans out the group under the pointer, and gathers it again after', () => {
    render(timeline(TOGETHER));

    const strip = screen.getByRole('group', {
      name: 'Each member’s position in the party',
    }).firstElementChild;

    expect(strip).toHaveAttribute('data-fanned', '');

    fireEvent.pointerMove(strip ?? document.body, { clientX: 0, clientY: -20 });

    expect(strip).toHaveAttribute('data-fanned', 'dan');

    fireEvent.pointerLeave(strip ?? document.body);

    expect(strip).toHaveAttribute('data-fanned', '');
  });

  it('does not fan anything for a pointer beside the faces rather than over them', () => {
    render(timeline(TOGETHER));

    const strip = screen.getByRole('group', {
      name: 'Each member’s position in the party',
    }).firstElementChild;

    fireEvent.pointerMove(strip ?? document.body, { clientX: 0, clientY: -200 });

    expect(strip).toHaveAttribute('data-fanned', '');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SharedTimeline.displayName).toBe('SharedTimeline');
  });
});
