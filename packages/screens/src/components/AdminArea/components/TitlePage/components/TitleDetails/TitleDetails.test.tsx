import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TitleDetails } from './TitleDetails';

describe('TitleDetails', () => {
  it('lists each fact beside its label, with what can be done about them', async () => {
    const onPress = vi.fn();

    render(
      <TitleDetails
        title="Details"
        facts={[
          { label: 'Quality', value: 'HD 1080p' },
          { label: 'Folder', value: '/media/Shows/Show' },
        ]}
        action={{ label: 'Edit', onPress }}
      />,
    );

    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('/media/Shows/Show')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Edit' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleDetails.displayName).toBe('TitleDetails');
  });
});
