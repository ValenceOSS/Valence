declare module 'virtual:ui-catalogue' {
  type UiPropDoc = {
    name: string;
    type: string;
    values: string[];
    isRequired: boolean;
    defaultValue: string | null;
    description: string | null;
  };

  type UiComponentDoc = {
    name: string;
    summary: string;
    props: UiPropDoc[];
    inherits: string[];
    builtOn: { name: string; url: string }[];
  };

  const components: UiComponentDoc[];

  export type { UiComponentDoc, UiPropDoc };
  export default components;
}
