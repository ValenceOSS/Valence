import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArtCard } from './ArtCard';

describe('ArtCard', () => {
  it('is pressed by its name, and says what is new about it', async () => {
    const onSelect = vi.fn();

    render(<ArtCard title="Moana" flag="Recently added" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Moana, Recently added' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByText('Recently added')).toBeInTheDocument();
  });

  it('draws its backdrop and its logo rather than its name', () => {
    const { container } = render(
      <ArtCard title="Moana" imageUrl="/backdrop.jpg" logoUrl="/logo.png" onSelect={vi.fn()} />,
    );

    const pictures = [...container.querySelectorAll('img')].map((image) =>
      image.getAttribute('src'),
    );

    expect(pictures).toEqual(['/backdrop.jpg', '/logo.png']);
    expect(screen.queryByText('Moana')).not.toBeInTheDocument();
  });

  it('writes its name into the picture where the logo cannot be read', () => {
    const { container } = render(<ArtCard title="Moana" logoUrl="/logo.png" onSelect={vi.fn()} />);

    const logo = container.querySelector('img[src="/logo.png"]');

    expect(logo).not.toBeNull();

    if (logo !== null) {
      fireEvent.error(logo);
    }

    expect(screen.getByText('Moana')).toBeInTheDocument();
  });

  it('says how far through it somebody is, kept between nothing and all of it', () => {
    render(<ArtCard title="Moana" watchedFraction={1.4} onSelect={vi.fn()} />);

    expect(screen.getByRole('img', { name: '100% watched' })).toBeInTheDocument();
  });

  it('draws no bar before it has been started', () => {
    render(<ArtCard title="Moana" watchedFraction={0} onSelect={vi.fn()} />);

    expect(screen.queryByRole('img', { name: /watched/ })).not.toBeInTheDocument();
  });
});
