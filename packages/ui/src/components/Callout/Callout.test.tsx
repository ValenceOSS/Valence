import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@ValenceUI/Button';
import { Callout } from './Callout';

describe('Callout', () => {
  it('says the fact it was given', () => {
    render(<Callout title="Media is mounted read only" />);

    expect(screen.getByText('Media is mounted read only')).toBeVisible();
  });

  it('says what follows from it where there is more to say', () => {
    render(
      <Callout title="Media is mounted read only">
        Re-encoding writes beside the film, so it cannot work until the mount is read and write.
      </Callout>,
    );

    expect(screen.getByText(/read and write/)).toBeVisible();
  });

  it('announces a warning, because somebody has to hear about it now', () => {
    render(<Callout title="Not enough room" tone="warning" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not enough room');
  });

  it('announces a danger for the same reason', () => {
    render(<Callout title="This destroys the original" tone="danger" />);

    expect(screen.getByRole('alert')).toBeVisible();
  });

  it('says nothing to assistive technology when it is only context', () => {
    render(<Callout title="Kept beside the film" />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('carries the thing to do about it', () => {
    render(
      <Callout title="Not enough room" tone="warning" action={<Button>Free some up</Button>} />,
    );

    expect(screen.getByRole('button', { name: 'Free some up' })).toBeVisible();
  });
});
