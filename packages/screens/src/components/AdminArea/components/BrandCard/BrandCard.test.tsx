import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { fetchAppearance } from '@ValenceClient/appearance/fetchAppearance';
import { saveBrand } from '@ValenceClient/admin/saveBrand';
import { BrandCard } from './BrandCard';

vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({ fetchAppearance: vi.fn() }));
vi.mock('@ValenceClient/admin/saveBrand', () => ({ saveBrand: vi.fn() }));
vi.mock('@ValenceClient/admin/saveBrandLogo', () => ({ saveBrandLogo: vi.fn() }));

const VALENCE = { name: null, accent: null, description: null, logo: null };

beforeEach(() => {
  vi.mocked(fetchAppearance).mockResolvedValue({ roundness: 'default', brand: VALENCE });
  vi.mocked(saveBrand).mockReset();
});

describe('BrandCard', () => {
  it('saves the name and description written, and leaves the rest as Valence’s', async () => {
    vi.mocked(saveBrand).mockResolvedValue({ ...VALENCE, name: 'Home Cinema' });
    const user = userEvent.setup();

    renderInAnAddress(<BrandCard />);

    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Home Cinema');
    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    expect(saveBrand).toHaveBeenCalledWith({
      name: 'Home Cinema',
      accent: null,
      description: null,
    });
  });

  it('has nothing to save until something changes', async () => {
    renderInAnAddress(<BrandCard />);

    expect(await screen.findByRole('button', { name: 'Save brand' })).toBeDisabled();
  });

  it('offers Valence’s own logo back once there is one of the server’s', async () => {
    vi.mocked(fetchAppearance).mockResolvedValue({
      roundness: 'default',
      brand: { ...VALENCE, logo: '/api/brand/logo?v=a.png' },
    });

    renderInAnAddress(<BrandCard />);

    expect(await screen.findByRole('button', { name: 'Use Valence’s own' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandCard.displayName).toBe('BrandCard');
  });
});
