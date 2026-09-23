import type { PageAnswer } from '@ValenceRequests/solver/PageAnswerSchema';

type AnAnswerOptions = {
  url?: string;
  status?: number;
  body?: string;
  headers?: Record<string, string>;
};

/**
 * What a page says back to a request made from inside it.
 *
 * @param url - Where the answer came from.
 * @param status - Its status.
 * @param body - What it said.
 * @param headers - Its headers.
 * @returns The answer.
 */
const anAnswer = ({
  url = 'https://example.org/',
  status = 200,
  body = '<title>Search</title>',
  headers = { 'content-type': 'text/html; charset=utf-8' },
}: AnAnswerOptions = {}): PageAnswer => ({
  url,
  status,
  headers,
  dataUrl: `data:text/html;base64,${Buffer.from(body).toString('base64')}`,
});

export { anAnswer };
