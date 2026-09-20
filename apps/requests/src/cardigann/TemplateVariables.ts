type TemplateValue = string | readonly string[] | null;

type TemplateVariables = Readonly<Record<string, TemplateValue>>;

export type { TemplateValue, TemplateVariables };
