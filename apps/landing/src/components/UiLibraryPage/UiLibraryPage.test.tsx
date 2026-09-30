import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { UiLibraryPage } from './UiLibraryPage';

describe('UiLibraryPage', () => {
  it('introduces itself and lists the groups when no component is chosen', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'UI library' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Buttons/ }).length).toBeGreaterThan(0);
  });

  it('shows a component, its examples and its props, read from its source', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui/button');

    expect(await screen.findByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument();
    expect(screen.getByText('Variants')).toBeInTheDocument();

    const props = screen.getByRole('table', { name: 'Props of Button' });

    expect(within(props).getByRole('rowheader', { name: /variant/ })).toBeInTheDocument();
  });

  it('marks the component being looked at in the list', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui/badge');

    const list = await screen.findAllByRole('navigation', { name: 'Components' });

    expect(within(list[0] ?? document.body).getByRole('link', { name: 'Badge' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('narrows the list to what is typed', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui');

    const [search] = await screen.findAllByRole('searchbox', { name: 'Find a component' });

    await userEvent.type(search ?? document.body, 'spinn');

    const [list] = screen.getAllByRole('navigation', { name: 'Components' });

    expect(
      within(list ?? document.body)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Spinner']);
  });

  it('says so when the address names no component', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui/nothing-here');

    expect(
      await screen.findByRole('heading', { name: 'There is no component called nothing-here' }),
    ).toBeInTheDocument();
  });

  it('opens the list in a drawer on a phone', async () => {
    await renderWithRoutes(UiLibraryPage, '/ui/button');

    await userEvent.click(await screen.findByRole('button', { name: 'All components' }));

    expect(await screen.findByRole('dialog', { name: 'Components' })).toBeInTheDocument();
  });
});
