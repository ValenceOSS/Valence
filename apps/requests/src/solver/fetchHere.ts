import type { PageRequest } from '@ValenceRequests/solver/PageRequest';

declare const FileReader: new () => {
  result: string | ArrayBuffer | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsDataURL: (blob: Blob) => void;
};

/**
 * Asks for a page from inside the browser, with the site's cookies and the browser's own way of
 * speaking, and says what came back as JSON text: the bytes as a data URL, since Firefox will not
 * let the script driving it read a typed array across the page's wall.
 *
 * It runs in the page, so it must not reach for anything outside itself.
 *
 * @param request - What to ask for.
 * @returns The answer, as JSON text.
 */
const fetchHere = async (request: PageRequest): Promise<string> => {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    credentials: 'include',
    redirect: 'follow',
    ...(request.body === null ? {} : { body: request.body }),
  });
  const headers: Record<string, string> = {};

  response.headers.forEach((value, name) => {
    headers[name] = value;
  });

  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error('The answer could not be read'));
    };
    reader.readAsDataURL(blob);
  });

  return JSON.stringify({ url: response.url, status: response.status, headers, dataUrl });
};

export { fetchHere };
