import { screen } from '@testing-library/react';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { describe, expect, it } from 'vitest';
import { MissingRow } from './MissingRow';

describe('MissingRow', () => {
  it('says which episode is not here', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={3} />);

    expect(screen.getByText('Episode 3')).toBeInTheDocument();
  });

  it('says why the row is empty rather than leaving a blank', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={3} />);

    expect(screen.getByText('Not in any library')).toBeInTheDocument();
  });

  it('offers nothing to press, since there is nothing to play', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={3} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('leads its title with its number, as the real rows do', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={12} title="The Answer" />);

    expect(screen.getByText('12. The Answer')).toBeInTheDocument();
  });

  it('calls the episode what the catalogue calls it, when it said', () => {
    renderWithAnswers(
      <MissingRow showTitle="A show" episodeNumber={3} title="Someone Is Thinking of Someone" />,
    );

    expect(screen.getByText('3. Someone Is Thinking of Someone')).toBeInTheDocument();
  });

  it('falls back to the number when nothing named it', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={3} />);

    expect(screen.getByText('Episode 3')).toBeInTheDocument();
  });

  it("shows the catalogue's still, so the gap is a picture rather than a blank", () => {
    renderWithAnswers(
      <MissingRow
        showTitle="A show"
        episodeNumber={3}
        title="An episode"
        stillUrl="https://example.com/a.jpg"
      />,
    );

    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      'https://example.com/a.jpg',
    );
  });

  it('draws no picture when the catalogue had none', () => {
    const { container } = renderWithAnswers(
      <MissingRow showTitle="A show" episodeNumber={3} title="An episode" />,
    );

    expect(container.querySelector('img')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MissingRow.displayName).toBe('MissingRow');
  });

  it('says when the episode airs, so a gap that is only the future is not mistaken for a hole', () => {
    renderWithAnswers(<MissingRow showTitle="A show" episodeNumber={4} airs="Airs in 7 days" />);

    expect(screen.getByText('Not in any library · Airs in 7 days')).toBeInTheDocument();
  });
});
