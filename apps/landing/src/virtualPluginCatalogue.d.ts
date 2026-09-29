declare module 'virtual:plugin-catalogue' {
  type PluginCatalogueJson = {
    format: number;
    generatedAt: string;
    plugins: object[];
  };

  const catalogue: PluginCatalogueJson;

  export type { PluginCatalogueJson };
  export default catalogue;
}
