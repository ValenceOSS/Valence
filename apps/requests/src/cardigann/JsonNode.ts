type JsonNode =
  string | number | boolean | null | readonly JsonNode[] | { readonly [key: string]: JsonNode };

export type { JsonNode };
