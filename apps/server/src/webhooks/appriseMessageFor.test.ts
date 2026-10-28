import { describe, expect, it } from 'vitest';
import { appriseMessageFor } from './appriseMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Dune (2021)',
  description: 'Added to Films',
  tone: 'arrival',
  isUrgent: false,
  fields: [{ name: 'Library', value: 'Films', inline: true }],
  sections: [],
  posterUrl: null,
};

describe('appriseMessageFor', () => {
  it('sends the title and the details as Markdown for Apprise to convert', () => {
    expect(appriseMessageFor(aNotice)).toStrictEqual({
      title: 'Dune (2021)',
      body: 'Added to Films\n\n**Library:** Films',
      type: 'success',
      format: 'markdown',
    });
  });

  it('calls a problem somebody has to put right a failure', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'failure', isUrgent: true }).type).toBe('failure');
  });

  it('calls bad news that needs nothing put right a warning', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'failure' }).type).toBe('warning');
  });

  it('calls watching and quiet news information', () => {
    expect(appriseMessageFor({ ...aNotice, tone: 'viewing' }).type).toBe('info');
  });

  it('sends a notice with nothing beyond its title as the body, which Apprise needs', () => {
    const message = appriseMessageFor({ ...aNotice, description: '', fields: [] });

    expect(message.title).toBe('');
    expect(message.body).toBe('Dune (2021)');
  });
});
