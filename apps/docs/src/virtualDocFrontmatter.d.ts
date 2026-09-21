declare module 'virtual:doc-frontmatter' {
  const frontmatters: Readonly<
    Record<string, { title?: string; description?: string; order?: number }>
  >;

  export default frontmatters;
}
