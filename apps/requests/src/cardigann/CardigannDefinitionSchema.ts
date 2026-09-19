import { z } from 'zod';

const Scalar = z.union([z.string(), z.number(), z.boolean()]).transform(String);

const FilterSchema = z.object({
  name: z.string(),
  args: z
    .union([Scalar, z.array(Scalar)])
    .nullish()
    .transform((args) => args ?? null),
});

const SelectorSchema = z.object({
  selector: z.string().optional(),
  optional: z.boolean().default(false),
  default: Scalar.optional(),
  text: Scalar.optional(),
  attribute: z.string().optional(),
  remove: z.string().optional(),
  filters: z
    .array(FilterSchema)
    .nullish()
    .transform((filters) => filters ?? []),
  case: z.record(z.string(), Scalar).optional(),
});

const SelectorFieldSchema = z.object({
  selector: z.string(),
  attribute: z.string().optional(),
  usebeforeresponse: z.boolean().default(false),
  filters: z
    .array(FilterSchema)
    .nullish()
    .transform((filters) => filters ?? []),
});

const Inputs = z
  .record(z.string(), Scalar.nullable())
  .nullish()
  .transform((inputs) =>
    Object.fromEntries(Object.entries(inputs ?? {}).map(([key, value]) => [key, value ?? ''])),
  );

const Headers = z
  .record(z.string(), z.union([z.array(Scalar), Scalar]))
  .nullish()
  .transform((headers) =>
    Object.fromEntries(
      Object.entries(headers ?? {}).map(([key, value]) => [
        key,
        Array.isArray(value) ? (value[0] ?? '') : value,
      ]),
    ),
  );

const ErrorSchema = z.object({
  path: z.string().optional(),
  selector: z.string(),
  message: SelectorSchema.optional(),
});

const SettingSchema = z.object({
  name: z.string(),
  type: z.string(),
  label: z.string().default(''),
  default: Scalar.nullish(),
  defaults: z.array(Scalar).optional(),
  options: z.record(z.string(), Scalar).optional(),
});

const CategoryMappingSchema = z.object({
  id: Scalar,
  cat: z.string().optional(),
  desc: z.string().optional(),
  default: z.boolean().default(false),
});

const SearchPathSchema = z.object({
  path: z.string(),
  method: z.string().optional(),
  inputs: Inputs,
  queryseparator: z.string().default('&'),
  categories: z.array(Scalar).optional(),
  inheritinputs: z.boolean().default(true),
  followredirect: z.boolean().default(false),
  response: z
    .object({ type: z.string().default('html'), noResultsMessage: z.string().optional() })
    .optional(),
});

const RequestSchema = z.object({
  path: z.string().default(''),
  method: z.string().optional(),
  inputs: Inputs,
  queryseparator: z.string().default('&'),
  pathselector: SelectorFieldSchema.optional(),
});

const CardigannDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  type: z.string().default('private'),
  language: z.string().default('en-US'),
  encoding: z.string().default('UTF-8'),
  requestDelay: z.number().optional(),
  links: z.array(z.string()).min(1),
  legacylinks: z
    .array(z.string())
    .nullish()
    .transform((links) => links ?? []),
  followredirect: z.boolean().default(false),
  testlinktorrent: z.boolean().default(true),
  settings: z
    .array(SettingSchema)
    .nullish()
    .transform((settings) => settings ?? null),
  caps: z.object({
    categories: z.record(z.string(), z.string()).optional(),
    categorymappings: z.array(CategoryMappingSchema).optional(),
    modes: z.record(z.string(), z.array(z.string()).nullable()).default({ search: ['q'] }),
    allowrawsearch: z.boolean().default(false),
  }),
  login: z
    .object({
      path: z.string().default(''),
      submitpath: z.string().optional(),
      cookies: z.array(z.string()).optional(),
      method: z.string().default('post'),
      form: z.string().optional(),
      selectors: z.boolean().default(false),
      inputs: Inputs,
      selectorinputs: z.record(z.string(), SelectorSchema).optional(),
      getselectorinputs: z.record(z.string(), SelectorSchema).optional(),
      error: z.array(ErrorSchema).optional(),
      test: z.object({ path: z.string().optional(), selector: z.string().optional() }).optional(),
      captcha: z
        .object({ type: z.string(), selector: z.string().optional(), input: z.string().optional() })
        .optional(),
      headers: Headers,
    })
    .optional(),
  search: z.object({
    path: z.string().optional(),
    paths: z.array(SearchPathSchema).optional(),
    headers: Headers,
    keywordsfilters: z
      .array(FilterSchema)
      .nullish()
      .transform((filters) => filters ?? []),
    allowEmptyInputs: z.boolean().default(false),
    inputs: Inputs,
    preprocessingfilters: z
      .array(FilterSchema)
      .nullish()
      .transform((filters) => filters ?? []),
    rows: SelectorSchema.extend({
      after: z.number().int().default(0),
      dateheaders: SelectorSchema.optional(),
      count: SelectorSchema.optional(),
      multiple: z.boolean().default(false),
      missingAttributeEqualsNoResults: z.boolean().default(false),
    }),
    fields: z.array(z.tuple([z.string(), SelectorSchema])),
  }),
  download: z
    .object({
      selectors: z.array(SelectorFieldSchema).optional(),
      method: z.string().optional(),
      before: RequestSchema.optional(),
      infohash: z
        .object({
          hash: SelectorFieldSchema,
          title: SelectorFieldSchema,
          usebeforeresponse: z.boolean().default(false),
        })
        .optional(),
      headers: Headers,
    })
    .optional(),
});

type CardigannDefinition = z.infer<typeof CardigannDefinitionSchema>;
type CardigannFilter = z.infer<typeof FilterSchema>;
type CardigannSelector = z.infer<typeof SelectorSchema>;
type CardigannSelectorField = z.infer<typeof SelectorFieldSchema>;
type CardigannSetting = z.infer<typeof SettingSchema>;
type CardigannSearchPath = z.infer<typeof SearchPathSchema>;
type CardigannRequestBlock = z.infer<typeof RequestSchema>;
type CardigannErrorBlock = z.infer<typeof ErrorSchema>;

export type {
  CardigannDefinition,
  CardigannErrorBlock,
  CardigannFilter,
  CardigannRequestBlock,
  CardigannSearchPath,
  CardigannSelector,
  CardigannSelectorField,
  CardigannSetting,
};

export { CardigannDefinitionSchema };
