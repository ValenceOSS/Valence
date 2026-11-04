import { describe, expect, it } from 'vitest';
import { renderWebhookTemplate } from '@ValenceContracts/functions/renderWebhookTemplate';

const VALUES = {
  title: 'Job failed',
  urgent: true,
  quote: 'a "quoted" word',
  data: { item: { title: 'Films', year: 2024 } },
};

describe('renderWebhookTemplate', () => {
  it('swaps placeholders into text as they are', () => {
    expect(renderWebhookTemplate('{{title}}: {{data.item.title}}', 'text', VALUES)).toStrictEqual({
      body: 'Job failed: Films',
      problem: null,
      unknown: [],
    });
  });

  it('keeps a lone placeholder’s own type in JSON, and escapes what is swapped into a string', () => {
    const rendered = renderWebhookTemplate(
      '{"urgent": "{{urgent}}", "line": "{{quote}} in {{data.item.year}}"}',
      'json',
      VALUES,
    );

    expect(JSON.parse(rendered.body)).toStrictEqual({
      urgent: true,
      line: 'a "quoted" word in 2024',
    });
  });

  it('says which placeholders nothing answers, leaving them empty', () => {
    const rendered = renderWebhookTemplate(
      '{"a": "{{missing}}", "b": "x{{gone}}"}',
      'json',
      VALUES,
    );

    expect(JSON.parse(rendered.body)).toStrictEqual({ a: null, b: 'x' });
    expect(rendered.unknown).toStrictEqual(['missing', 'gone']);
  });

  it('says where JSON that cannot be read goes wrong', () => {
    expect(renderWebhookTemplate('{\n  "a": nope\n}', 'json', VALUES).problem).toMatchObject({
      kind: 'notJson',
    });
  });

  it('sends a form’s fields from a JSON object, and refuses anything else', () => {
    expect(
      renderWebhookTemplate('{"title": "{{title}}", "urgent": "{{urgent}}"}', 'form', VALUES).body,
    ).toBe('title=Job+failed&urgent=true');
    expect(renderWebhookTemplate('["a"]', 'form', VALUES).problem).toStrictEqual({
      kind: 'formNotAnObject',
    });
  });
});
