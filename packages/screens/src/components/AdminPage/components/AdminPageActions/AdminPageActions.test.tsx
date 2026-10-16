import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN_PAGE_ACTIONS } from '@ValenceScreens/components/AdminPage/ADMIN_PAGE_ACTIONS';
import { AdminPageActions } from './AdminPageActions';

describe('AdminPageActions', () => {
  it('puts a page’s actions in the bar along the top', () => {
    render(
      <>
        <div id={ADMIN_PAGE_ACTIONS} data-testid="bar" />
        <AdminPageActions>
          <span>Add a library</span>
        </AdminPageActions>
      </>,
    );

    expect(screen.getByTestId('bar')).toContainElement(screen.getByText('Add a library'));
  });

  it('draws nothing where there is no bar to put them in', () => {
    render(
      <AdminPageActions>
        <span>Add a library</span>
      </AdminPageActions>,
    );

    expect(screen.queryByText('Add a library')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AdminPageActions.displayName).toBe('AdminPageActions');
  });
});
