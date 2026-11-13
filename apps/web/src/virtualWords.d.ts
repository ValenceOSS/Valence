declare module 'virtual:valence-words' {
  const loadWords: (language: string) => Promise<Readonly<Record<string, string>>>;

  export { loadWords };
}
