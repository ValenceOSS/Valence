import { translateRegex } from '@ValenceRequests/cardigann/translateRegex';
import { translateReplacement } from '@ValenceRequests/cardigann/translateReplacement';
import type {
  TemplateValue,
  TemplateVariables,
} from '@ValenceRequests/cardigann/TemplateVariables';

type Expression =
  | { kind: 'variable'; name: string }
  | { kind: 'text'; value: string }
  | { kind: 'call'; name: string; args: Expression[] };

type TemplateNode =
  | { kind: 'text'; text: string }
  | { kind: 'print'; expression: Expression }
  | { kind: 'if'; condition: Expression; whenSet: TemplateNode[]; otherwise: TemplateNode[] }
  | {
      kind: 'range';
      list: Expression;
      index: string | null;
      element: string | null;
      body: TemplateNode[];
    };

type Scope = { variables: TemplateVariables; locals: Readonly<Record<string, TemplateValue>> };

const TRUE = 'True';

/**
 * Whether a value counts as set, the way the template language reads it: text with something in
 * it, or a list with something in it.
 *
 * @param value - The value.
 * @returns Whether it is set.
 */
const isSet = (value: TemplateValue): boolean =>
  value !== null && (typeof value === 'string' ? value.trim() !== '' : value.length > 0);

/**
 * Writes a value out as text.
 *
 * @param value - The value.
 * @returns The text.
 */
const asText = (value: TemplateValue): string =>
  value === null ? '' : typeof value === 'string' ? value : value.join(',');

/**
 * Splits what is inside a `{{ }}` into words, strings and brackets.
 *
 * @param source - The action's text.
 * @returns The tokens.
 */
const tokenise = (source: string): string[] => {
  const tokens: string[] = [];
  let at = 0;

  while (at < source.length) {
    const character = source[at] ?? '';

    if (/\s/.test(character)) {
      at += 1;
    } else if (character === '(' || character === ')') {
      tokens.push(character);
      at += 1;
    } else if (character === '"') {
      let end = at + 1;
      let text = '';

      while (end < source.length && source[end] !== '"') {
        text += source[end] === '\\' ? (source[end + 1] ?? '') : (source[end] ?? '');
        end += source[end] === '\\' ? 2 : 1;
      }

      tokens.push(`"${text}`);
      at = end + 1;
    } else {
      const word = /^[^\s()"]+/.exec(source.slice(at))?.[0] ?? character;

      tokens.push(word);
      at += word.length;
    }
  }

  return tokens;
};

/**
 * Reads tokens into an expression: a function applied to its arguments, or a single term.
 *
 * @param tokens - The tokens, consumed as they are read.
 * @param isNested - Whether this is inside brackets, which a `)` ends.
 * @returns The expression.
 */
const readExpression = (tokens: string[], isNested = false): Expression => {
  const terms: Expression[] = [];

  while (tokens.length > 0) {
    const token = tokens.shift() ?? '';

    if (token === ')') {
      if (isNested) {
        break;
      }

      continue;
    }

    if (token === '(') {
      terms.push(readExpression(tokens, true));
    } else if (token.startsWith('"')) {
      terms.push({ kind: 'text', value: token.slice(1) });
    } else if (token.startsWith('.') || token.startsWith('$')) {
      terms.push({ kind: 'variable', name: token.replace(/,$/, '') });
    } else {
      terms.push({ kind: 'call', name: token, args: [] });
    }
  }

  const [first, ...rest] = terms;

  if (first === undefined) {
    return { kind: 'text', value: '' };
  }

  return first.kind === 'call' && rest.length > 0
    ? { kind: 'call', name: first.name, args: rest }
    : first;
};

/**
 * Parses a template into its text and actions, nesting what sits between an `if` or a `range` and
 * its `end`. An `end` with nothing open is ignored, and anything left open at the end is closed.
 *
 * @param template - The template.
 * @returns The nodes.
 */
const parse = (template: string): TemplateNode[] => {
  type Open =
    | { kind: 'root'; nodes: TemplateNode[] }
    | { kind: 'if'; node: Extract<TemplateNode, { kind: 'if' }>; branch: 'whenSet' | 'otherwise' }
    | { kind: 'range'; node: Extract<TemplateNode, { kind: 'range' }> };

  const root: Open = { kind: 'root', nodes: [] };
  const stack: Open[] = [root];
  const into = (): TemplateNode[] => {
    const open = stack.at(-1) ?? root;

    return open.kind === 'root'
      ? open.nodes
      : open.kind === 'range'
        ? open.node.body
        : open.node[open.branch];
  };

  for (const part of template.split(/({{.*?}})/s)) {
    const action = /^{{-?\s*(.*?)\s*-?}}$/s.exec(part)?.[1];

    if (action === undefined) {
      if (part !== '') {
        into().push({ kind: 'text', text: part });
      }

      continue;
    }

    const words = action.split(/\s+/);
    const keyword = words[0] ?? '';

    if (keyword === 'if') {
      const node: Extract<TemplateNode, { kind: 'if' }> = {
        kind: 'if',
        condition: readExpression(tokenise(action.slice(2))),
        whenSet: [],
        otherwise: [],
      };

      into().push(node);
      stack.push({ kind: 'if', node, branch: 'whenSet' });
    } else if (keyword === 'else') {
      const open = stack.at(-1);

      if (open?.kind === 'if') {
        open.branch = 'otherwise';

        if (words[1] === 'if') {
          const node: Extract<TemplateNode, { kind: 'if' }> = {
            kind: 'if',
            condition: readExpression(tokenise(action.replace(/^else\s+if/, ''))),
            whenSet: [],
            otherwise: [],
          };

          open.node.otherwise.push(node);
          stack.pop();
          stack.push({ kind: 'if', node, branch: 'whenSet' });
        }
      }
    } else if (keyword === 'end') {
      if (stack.length > 1) {
        stack.pop();
      }
    } else if (keyword === 'range') {
      const binding = /^range\s+(\$\w+)\s*,\s*(\$\w+)\s*:=\s*(.+)$/s.exec(action);
      const node: Extract<TemplateNode, { kind: 'range' }> = {
        kind: 'range',
        list: readExpression(tokenise(binding?.[3] ?? action.slice(5))),
        index: binding?.[1] ?? null,
        element: binding?.[2] ?? null,
        body: [],
      };

      into().push(node);
      stack.push({ kind: 'range', node });
    } else {
      into().push({ kind: 'print', expression: readExpression(tokenise(action)) });
    }
  }

  return root.nodes;
};

/**
 * Works out what an expression comes to.
 *
 * @param expression - The expression.
 * @param scope - The variables, and any a `range` has bound.
 * @returns Its value.
 */
const evaluate = (expression: Expression, scope: Scope): TemplateValue => {
  if (expression.kind === 'text') {
    return expression.value;
  }

  if (expression.kind === 'variable') {
    return expression.name in scope.locals
      ? (scope.locals[expression.name] ?? null)
      : (scope.variables[expression.name] ?? null);
  }

  const values = expression.args.map((arg) => evaluate(arg, scope));

  switch (expression.name) {
    case 'and':
      return values.find((value) => !isSet(value)) ?? values.at(-1) ?? null;
    case 'or':
      return values.find(isSet) ?? values.at(-1) ?? null;
    case 'not':
      return isSet(values[0] ?? null) ? null : TRUE;
    case 'eq':
    case 'ne': {
      const [left = null, right = null] = values;
      const isEqual =
        left === null || right === null ? left === right : asText(left) === asText(right);

      return isEqual === (expression.name === 'eq') ? TRUE : null;
    }
    case 're_replace': {
      const [value = null, pattern = null, replacement = null] = values;

      try {
        return asText(value).replace(
          translateRegex(asText(pattern), true),
          translateReplacement(asText(replacement)),
        );
      } catch {
        return asText(value);
      }
    }
    case 'join': {
      const [list = null, separator = null] = values;

      return list === null ? '' : typeof list === 'string' ? list : list.join(asText(separator));
    }
    default:
      return null;
  }
};

/**
 * Writes the nodes out.
 *
 * @param nodes - What was parsed.
 * @param scope - The variables.
 * @param escape - What to do to every value written into the text, such as encoding it for a URL.
 * @returns The text.
 */
const write = (
  nodes: readonly TemplateNode[],
  scope: Scope,
  escape: (text: string) => string,
): string =>
  nodes
    .map((node) => {
      switch (node.kind) {
        case 'text':
          return node.text;
        case 'print':
          return escape(asText(evaluate(node.expression, scope)));
        case 'if':
          return write(
            isSet(evaluate(node.condition, scope)) ? node.whenSet : node.otherwise,
            scope,
            escape,
          );
        case 'range': {
          const list = evaluate(node.list, scope);
          const items = list === null ? [] : typeof list === 'string' ? [list] : list;

          return items
            .map((item, index) =>
              write(
                node.body,
                {
                  variables: scope.variables,
                  locals: {
                    ...scope.locals,
                    '.': item,
                    ...(node.index === null ? {} : { [node.index]: index.toString() }),
                    ...(node.element === null ? {} : { [node.element]: item }),
                  },
                },
                escape,
              ),
            )
            .join('');
        }
      }
    })
    .join('');

/**
 * Fills in a Cardigann template: `{{ .Config.username }}`, `{{ if .Keywords }}…{{ else }}…{{ end }}`,
 * `{{ range .Categories }}cat[]={{.}}&{{ end }}`, and the handful of functions definitions use —
 * `and`, `or`, `eq`, `ne`, `not`, `join` and `re_replace`.
 *
 * `and` and `or` return one of their arguments, as Go's templates do, so `{{ or .Query.Album
 * .Keywords }}` writes whichever is set. A comparison is true when it comes to the text "True".
 *
 * @param template - The template.
 * @param variables - What the names in it stand for, such as `.Config.username`.
 * @param escape - What to do to every value written in, such as encoding it for a URL. The template's
 *   own text is left as it is.
 * @returns The text.
 */
const renderTemplate = (
  template: string,
  variables: TemplateVariables,
  escape: (text: string) => string = (text) => text,
): string =>
  template.includes('{{') ? write(parse(template), { variables, locals: {} }, escape) : template;

export { renderTemplate };
