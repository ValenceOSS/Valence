import { say } from '@ValenceI18n/say';
import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import type { EmailContent, RenderedEmail } from './EmailContent';

const PARAGRAPH_STYLE = 'margin: 0 0 16px; line-height: 1.5';

const BUTTON_STYLE =
  'display: inline-block; padding: 12px 20px; border-radius: 8px; background: #2a5bd7; color: #ffffff; text-decoration: none; font-weight: 600';

const FAINT_STYLE = 'margin: 0 0 16px; line-height: 1.5; color: #6b7280; font-size: 13px';

/**
 * Lays an email out twice, as plain text and as simple HTML with everything escaped, so a mail
 * client that shows either says the same thing.
 *
 * @param content - What the email says.
 * @param server - Which server it is from, for the line it is signed with.
 * @returns The subject, the text and the HTML.
 */
const renderEmail = (content: EmailContent, server: string): RenderedEmail => {
  const { subject, heading, paragraphs, action, afterAction } = content;
  const signed = say('server.email.renderEmail.sentByValenceAt', { server });
  const fallback = say('server.email.renderEmail.ifTheButtonDoesNotWork');

  const text = [
    heading,
    ...paragraphs,
    ...(action === null ? [] : [`${action.label}:\n${action.url}`]),
    ...afterAction,
    signed,
  ].join('\n\n');

  const paragraph = (words: string, style = PARAGRAPH_STYLE): string =>
    `<p style="${style}">${escapeHtml(words)}</p>`;

  const html = [
    '<!doctype html>',
    '<html>',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>',
    '<body style="margin: 0; padding: 24px 16px; font-family: system-ui, -apple-system, sans-serif; color: #111827; background: #ffffff">',
    '<div style="max-width: 32rem; margin: 0 auto">',
    `<h1 style="font-size: 20px; margin: 0 0 16px">${escapeHtml(heading)}</h1>`,
    ...paragraphs.map((words) => paragraph(words)),
    ...(action === null
      ? []
      : [
          `<p style="${PARAGRAPH_STYLE}"><a href="${escapeHtml(action.url)}" style="${BUTTON_STYLE}">${escapeHtml(action.label)}</a></p>`,
          paragraph(fallback, FAINT_STYLE),
          `<p style="${FAINT_STYLE}; word-break: break-all"><a href="${escapeHtml(action.url)}">${escapeHtml(action.url)}</a></p>`,
        ]),
    ...afterAction.map((words) => paragraph(words)),
    paragraph(signed, FAINT_STYLE),
    '</div>',
    '</body>',
    '</html>',
  ].join('\n');

  return { subject, text, html };
};

export { renderEmail };
