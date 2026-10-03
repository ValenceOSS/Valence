import type { FormEvent } from 'react';

type ZodFormHelpers<Values extends object> = {
  reset: (next: Values) => void;
};

type TextFieldBinding = {
  value: string;
  onValueChange: (next: string) => void;
  error?: string;
};

type ZodForm<Values extends object, Output> = {
  values: Values;
  set: <Key extends keyof Values>(key: Key, value: Values[Key]) => void;
  assign: (next: Partial<Values>) => void;
  errorOf: (key: keyof Values) => string | undefined;
  text: <
    Key extends {
      [Field in keyof Values]: Values[Field] extends string ? Field : never;
    }[keyof Values],
  >(
    key: Key,
  ) => TextFieldBinding;
  submit: (event?: FormEvent) => void;
  check: () => Output | null;
  reset: (next: Values) => void;
  isValid: boolean;
  isSubmitting: boolean;
  problem: string | null;
};

export type { TextFieldBinding, ZodForm, ZodFormHelpers };
