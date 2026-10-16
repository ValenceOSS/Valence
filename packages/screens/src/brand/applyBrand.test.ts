import { beforeEach, describe, expect, it } from 'vitest';
import { applyBrand } from './applyBrand';

const VALENCE = { name: null, accent: null, description: null, logo: null };

beforeEach(() => {
  document.head.innerHTML = '<link rel="icon" href="/icon.png" />';
  document.title = 'Valence';
});

describe('applyBrand', () => {
  it('puts the server’s own name, description, icon and accent on the document', () => {
    applyBrand({
      name: 'Home Cinema',
      accent: '#ff6600',
      description: 'Films at home',
      logo: '/api/brand/logo?v=a.png',
    });

    expect(document.title).toBe('Home Cinema');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Films at home',
    );
    expect(document.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe(
      '/api/brand/logo?v=a.png',
    );
    expect(document.getElementById('valence-brand')?.textContent).toContain(
      '--color-accent:#ff6600',
    );
  });

  it('puts Valence’s own back where the server has none', () => {
    applyBrand({ name: 'Home Cinema', accent: '#ff6600', description: 'Films', logo: '/x.png' });
    applyBrand(VALENCE);

    expect(document.title).toBe('Valence');
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/icon.png');
    expect(document.getElementById('valence-brand')).toBeNull();
  });

  it('writes dark words on a light accent and light words on a dark one', () => {
    applyBrand({ ...VALENCE, accent: '#ffee88' });

    expect(document.getElementById('valence-brand')?.textContent).toContain(
      '--color-accent-contrast:#0e0e0e',
    );

    applyBrand({ ...VALENCE, accent: '#112233' });

    expect(document.getElementById('valence-brand')?.textContent).toContain(
      '--color-accent-contrast:#ffffff',
    );
  });
});
