import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { A_REPORT } from '@ValenceScreens/components/ImportWizard/aMediaImportRun';
import { ImportReportView } from './ImportReportView';

describe('ImportReportView', () => {
  it('shows how much comes across, and what each person gets', () => {
    render(<ImportReportView report={A_REPORT} />);

    expect(screen.getByLabelText('What is imported')).toHaveTextContent('9 of 10');
    expect(
      screen.getByText('Watched 5, in progress 1, plays 12, favourites 2, ratings 3, playlists 1'),
    ).toBeVisible();
    expect(screen.getByText('Every library')).toBeVisible();
    expect(screen.getByText('You')).toBeVisible();
    expect(screen.getByText('Their Plex PIN was not given, so they were left out.')).toBeVisible();
  });

  it('lists what could not be matched and why, and what stays behind', () => {
    render(<ImportReportView report={A_REPORT} />);

    expect(screen.getByText('A Home Movie (2019)')).toBeVisible();
    expect(screen.getByText('And 3 more.')).toBeVisible();
    expect(screen.getByText(/Passwords cannot be copied/)).toBeVisible();
    expect(screen.queryByLabelText('What was written')).toBeNull();
  });

  it('shows what was written once the import is done, and who could not be brought across', () => {
    const [, ash] = A_REPORT.people;

    if (ash === undefined) {
      throw new Error('no second person');
    }

    render(
      <ImportReportView
        report={{
          ...A_REPORT,
          written: A_REPORT.counts,
          unmatchedTotal: 0,
          people: [{ ...ash, skipped: null, libraries: 2, maximumAge: 15, outcome: 'failed' }],
        }}
      />,
    );

    expect(screen.getByLabelText('What was written')).toBeInTheDocument();
    expect(screen.getByText('Could not be imported')).toBeVisible();
    expect(screen.getByText('2 libraries, nothing rated above 15')).toBeVisible();
    expect(screen.queryByText('Not matched')).toBeNull();
  });
});
