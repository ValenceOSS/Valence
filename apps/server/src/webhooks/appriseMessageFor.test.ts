import { describe, expect, it } from 'vitest';
import { appriseMessageFor } from './appriseMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'The Long Night (2021)',
  lead: ['Added to ', { strong: 'Films' }],
  context: [],
  body: '',
  tags: ['Film'],
  details: [{ label: 'Release', text: 'A.Release', look: 'code' }],
  sections: [],
  link: null,
  footer: 'Films',
  tone: 'arrival',
  isUrgent: false,
  posterUrl: null,
};

describe('appriseMessageFor', () => {
  it('sends the title and the body as Markdown for Apprise to convert', () => {
    expect(appriseMessageFor(aNotice)).toStrictEqual({
      title: 'The Long Night (2021)',
      body: 'Added to **Films**\n\n`Film`\n\n**Release**\n`A.Release`',
      type: 'success',
      format: 'markdown',
    });
  });

  it('calls a problem somebody has to put right a failure', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'failure', isUrgent: true }).type).toBe('failure');
  });

  it('calls bad news that needs nothing put right a warning', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'failure' }).type).toBe('warning');
    expect(appriseMessageFor({ ...aNotice, tone: 'attention' }).type).toBe('warning');
  });

  it('calls watching and quiet news information', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'viewing' }).type).toBe('info');
    expect(appriseMessageFor({ ...aNotice, tone: 'quiet' }).type).toBe('info');
  });

  it('sends a notice with nothing beyond its title as the body, which Apprise needs', () => {
    const message = appriseMessageFor({ ...aNotice, lead: [], tags: [], details: [] });

    expect(message.title).toBe('');
    expect(message.body).toBe('The Long Night (2021)');
  });
});
