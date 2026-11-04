import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { CustomWebhookFormat } from '@ValenceContracts/schemas/Webhook';

type TemplateProblem =
  | { kind: 'notJson'; line: number | null; column: number | null }
  | { kind: 'formNotAnObject' };

type RenderedTemplate = { body: string; problem: TemplateProblem | null; unknown: string[] };

const WHOLE = /^\{\{\s*([\w.]+)\s*\}\}$/u;

const ANY = /\{\{\s*([\w.]+)\s*\}\}/gu;

const POSITION = /position (\d+)/u;

/**
 * Whether a value is an object of named values rather than a list or a single value.
 *
 * @param value - The value.
 * @returns Whether it is.
 */
const isRecord = (value: JsonValue | undefined): value is { [key: string]: JsonValue } =>
  value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);

/**
 * Finds a value by a dotted path such as `data.item.title`.
 *
 * @param path - The path.
 * @param values - What to look in.
 * @returns The value, or nothing where no value is there.
 */
const valueAt = (path: string, values: JsonValue): JsonValue | undefined =>
  path
    .split('.')
    .reduce<JsonValue | undefined>(
      (here, part) => (isRecord(here) ? here[part] : undefined),
      values,
    );

/**
 * Turns a value into the text a placeholder inside a longer string stands for.
 *
 * @param value - The value.
 * @returns Strings as they are, nothing as empty, and anything else as JSON.
 */
const asText = (value: JsonValue): string =>
  typeof value === 'string' ? value : value === null ? '' : JSON.stringify(value);

/**
 * Says where JSON that could not be read went wrong, from the message the parser gave.
 *
 * @param template - The template.
 * @param said - What the parser said.
 * @returns The problem, with the line and column where the parser said.
 */
const notJson = (template: string, said: string): TemplateProblem => {
  const at = POSITION.exec(said);

  if (at === null) {
    return { kind: 'notJson', line: null, column: null };
  }

  const before = template.slice(0, Number(at[1]));

  return {
    kind: 'notJson',
    line: before.split('\n').length,
    column: before.length - before.lastIndexOf('\n'),
  };
};

/**
 * Fills a Custom webhook's body template for one event. As JSON or a form, the template is read
 * first and only its string values are filled, so a value can never break it, and a string that is
 * a lone placeholder takes the value's own type. As text, placeholders are swapped in as they are.
 *
 * @param template - The template.
 * @param format - How the body is sent.
 * @param values - The event's values.
 * @returns The body, what is wrong with the template, and any placeholders nothing answers.
 */
const renderWebhookTemplate = (
  template: string,
  format: CustomWebhookFormat,
  values: JsonValue,
): RenderedTemplate => {
  const unknown = new Set<string>();

  const fill = (text: string): string =>
    text.replace(ANY, (_whole, path: string) => {
      const value = valueAt(path, values);

      if (value === undefined) {
        unknown.add(path);

        return '';
      }

      return asText(value);
    });

  if (format === 'text') {
    return { body: fill(template), problem: null, unknown: [...unknown] };
  }

  let parsed: JsonValue;

  try {
    parsed = JsonValueSchema.parse(JSON.parse(template));
  } catch (error) {
    return {
      body: '',
      problem: notJson(template, error instanceof Error ? error.message : ''),
      unknown: [],
    };
  }

  const walk = (node: JsonValue): JsonValue => {
    if (typeof node === 'string') {
      const path = WHOLE.exec(node)?.[1];

      if (path === undefined) {
        return fill(node);
      }

      const value = valueAt(path, values);

      if (value === undefined) {
        unknown.add(path);

        return null;
      }

      return value;
    }

    if (Array.isArray(node)) {
      return node.map(walk);
    }

    return isRecord(node)
      ? Object.fromEntries(Object.entries(node).map(([key, value]) => [key, walk(value)]))
      : node;
  };

  const filled = walk(parsed);

  if (format === 'form') {
    return isRecord(filled)
      ? {
          body: new URLSearchParams(
            Object.entries(filled).map(([key, value]): [string, string] => [key, asText(value)]),
          ).toString(),
          problem: null,
          unknown: [...unknown],
        }
      : { body: '', problem: { kind: 'formNotAnObject' }, unknown: [...unknown] };
  }

  return { body: JSON.stringify(filled, null, 2), problem: null, unknown: [...unknown] };
};

export type { RenderedTemplate, TemplateProblem };

export { renderWebhookTemplate };
