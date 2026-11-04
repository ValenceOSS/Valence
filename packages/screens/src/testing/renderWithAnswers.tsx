import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Draws something that asks the server through queries, with a fresh cache that never retries, so a
 * test controls every answer it gets.
 *
 * @param drawn - What to draw.
 * @param answers - The cache to draw it with, where the test seeds answers beforehand.
 * @returns The rendering.
 */
const renderWithAnswers = (
  drawn: ReactElement,
  answers = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
): RenderResult => render(<QueryClientProvider client={answers}>{drawn}</QueryClientProvider>);

export { renderWithAnswers };
