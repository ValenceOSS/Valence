import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import type { z } from 'zod';
import type { TextFieldBinding, ZodForm, ZodFormHelpers } from './useZodForm.types';
import { say } from '@ValenceI18n/say';

/**
 * Holds what a form has been given and judges it against a schema as it changes, so every field can
 * say what is wrong with it in the words the schema gives, and the form is only sent once all of it
 * parses. A field says nothing until it has been changed or a send has been tried, so an empty form
 * does not open already shouting.
 *
 * @param schema - What the answers must be, with the words to say where they are not.
 * @param initial - What the fields hold to begin with.
 * @param onSubmit - What to do with the answers once they parse, handed a way to empty the form
 *   again once they have been taken. What it answers with, where it is
 *   words rather than nothing, is why they were refused, and the form shows it as its problem; a
 *   send that fails outright is shown as one that could not be saved.
 * @returns The form: its values, a way to change each, what is wrong with each, and a way to send.
 */
const useZodForm = <Values extends object, Output>(
  schema: z.ZodType<Output, Values>,
  initial: Values,
  onSubmit: (
    answers: Output,
    helpers: ZodFormHelpers<Values>,
  ) => Promise<string | null | undefined> | string | null | undefined,
): ZodForm<Values, Output> => {
  const [values, setValues] = useState(initial);
  const [changed, setChanged] = useState<ReadonlySet<keyof Values>>(new Set());
  const [hasTried, setHasTried] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const reset = useCallback((next: Values) => {
    setValues(next);
    setChanged(new Set());
    setHasTried(false);
    setProblem(null);
  }, []);

  const parsed = schema.safeParse(values);
  const issues = new Map<PropertyKey, string>();

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];

      if (key !== undefined && !issues.has(key)) {
        issues.set(key, issue.message);
      }
    }
  }

  const set = <Key extends keyof Values>(key: Key, value: Values[Key]) => {
    setValues((current) => Object.assign({}, current, { [key]: value }));
    setChanged((current) => new Set([...current, key]));
    setProblem(null);
  };

  const assign = (next: Partial<Values>) => {
    setValues((current) => Object.assign({}, current, next));
    setChanged((current) => {
      const grown = new Set(current);

      for (const key in next) {
        grown.add(key);
      }

      return grown;
    });
    setProblem(null);
  };

  const errorOf = (key: keyof Values): string | undefined =>
    hasTried || changed.has(key) ? issues.get(key) : undefined;

  const text = <Key extends keyof Values>(key: Key): TextFieldBinding => {
    const value = values[key];
    const error = errorOf(key);

    return {
      value: typeof value === 'string' ? value : '',
      onValueChange: (next) => {
        setValues((current) => Object.assign({}, current, { [key]: next }));
        setChanged((current) => new Set([...current, key]));
        setProblem(null);
      },
      ...(error === undefined ? {} : { error }),
    };
  };

  const check = (): Output | null => {
    setHasTried(true);

    return parsed.success ? parsed.data : null;
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    setHasTried(true);

    if (!parsed.success || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setProblem(null);

    void Promise.resolve()
      .then(() => onSubmit(parsed.data, { reset }))
      .then(
        (refused) => {
          setProblem(refused === undefined || refused === '' ? null : refused);
        },
        () => {
          setProblem(say('common.thatCouldNotBeSaved'));
        },
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return {
    values,
    set,
    assign,
    errorOf,
    text,
    submit,
    check,
    reset,
    isValid: parsed.success,
    isSubmitting,
    problem,
  };
};

export { useZodForm };
