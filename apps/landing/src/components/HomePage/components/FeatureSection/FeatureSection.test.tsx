import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HardDriveIcon } from '@hugeicons/core-free-icons';
import { FeatureSection } from './FeatureSection';

describe('FeatureSection', () => {
  it('names the group and draws each of its features', () => {
    render(
      <FeatureSection
        group={{
          title: 'Platform',
          detail: 'What it takes to run it.',
          features: [
            {
              icon: HardDriveIcon,
              visual: 'window',
              title: 'One image',
              detail: 'Everything in one place.',
            },
            {
              icon: HardDriveIcon,
              visual: 'window',
              title: 'Read only',
              detail: 'Nothing written back.',
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('region', { name: 'Platform' })).toBeInTheDocument();
    expect(screen.getByText('What it takes to run it.')).toBeInTheDocument();
    expect(screen.getByText('One image')).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });

  it('leads a group of four with one larger, featured card', () => {
    render(
      <FeatureSection
        group={{
          title: 'Viewing',
          detail: "What it's like to sit down and watch something.",
          features: [
            { icon: HardDriveIcon, visual: 'window', title: 'First', detail: 'Leads the group.' },
            { icon: HardDriveIcon, visual: 'window', title: 'Second', detail: 'An ordinary card.' },
            { icon: HardDriveIcon, visual: 'window', title: 'Third', detail: 'An ordinary card.' },
            { icon: HardDriveIcon, visual: 'window', title: 'Fourth', detail: 'An ordinary card.' },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'First' })).toHaveClass('text-2xl');
    expect(screen.getByRole('heading', { name: 'Second' })).toHaveClass('text-lg');
  });

  it('leads a group of three the same way, so every group opens with a featured card', () => {
    render(
      <FeatureSection
        group={{
          title: 'Platform',
          detail: 'What it takes to run it.',
          features: [
            {
              icon: HardDriveIcon,
              visual: 'window',
              title: 'One image',
              detail: 'Everything in one place.',
            },
            {
              icon: HardDriveIcon,
              visual: 'window',
              title: 'Read only',
              detail: 'Nothing written back.',
            },
            {
              icon: HardDriveIcon,
              visual: 'window',
              title: 'Real auth',
              detail: 'TOTP and passkeys.',
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'One image' })).toHaveClass('text-2xl');
    expect(screen.getByRole('heading', { name: 'Read only' })).toHaveClass('text-lg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureSection.displayName).toBe('FeatureSection');
  });
});
