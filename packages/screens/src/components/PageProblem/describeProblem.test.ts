import { describe, expect, it } from 'vitest';
import { describeProblem } from './describeProblem';

describe('describeProblem', () => {
  it('says a page fetched after an update is from an older version', () => {
    expect(
      describeProblem('Failed to fetch dynamically imported module: /assets/Films-1a2b.js')
        .headline,
    ).toBe('Valence has been updated');
  });

  it('says the server could not be reached when a request failed outright', () => {
    expect(describeProblem('TypeError: Failed to fetch').headline).toBe(
      'Valence could not be reached',
    );
  });

  it('says when somebody is not allowed', () => {
    expect(describeProblem('Request failed with status 403').headline).toBe(
      'You are not allowed to see this page',
    );
  });

  it('says when a page could not be found', () => {
    expect(describeProblem('404 not found').headline).toBe('This page could not be found');
  });

  it('keeps the usual words for anything it does not recognise', () => {
    expect(describeProblem('undefined is not a function').headline).toBe(
      'This page stopped working',
    );
    expect(describeProblem(null).headline).toBe('This page stopped working');
  });
});
