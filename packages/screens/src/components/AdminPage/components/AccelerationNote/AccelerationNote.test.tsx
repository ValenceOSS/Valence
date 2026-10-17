import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccelerationNote } from './AccelerationNote';

describe('AccelerationNote', () => {
  it('says how the server converts video in a word', () => {
    render(
      <AccelerationNote
        acceleration={{ label: 'VideoToolbox', tone: 'quiet', detail: 'Uses the Apple encoder.' }}
        ffmpeg={null}
      />,
    );

    expect(screen.getByText('VideoToolbox')).toBeInTheDocument();
  });
});
