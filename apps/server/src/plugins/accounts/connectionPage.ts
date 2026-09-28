const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Makes the plain page a browser is left on after connecting an account where there is no Valence
 * page to go back to — the system browser a phone opened, or a connection that failed. It carries
 * no script, no picture and no colour of its own, and escapes everything it says.
 *
 * @param heading - What happened, in a few words.
 * @param detail - What to do next.
 * @returns The page.
 */
const connectionPage = (heading: string, detail: string): string => {
  const escape = (text: string): string =>
    text.replace(/[&<>"']/g, (found) => ESCAPES[found] ?? '');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    `<title>${escape(heading)}</title>`,
    '</head>',
    '<body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 20vh auto; padding: 0 16px; text-align: center">',
    `<h1 style="font-size: 1.25rem">${escape(heading)}</h1>`,
    `<p>${escape(detail)}</p>`,
    '</body>',
    '</html>',
  ].join('\n');
};

export { connectionPage };
