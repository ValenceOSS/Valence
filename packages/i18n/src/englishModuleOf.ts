/**
 * The source of the module the apps read English from: each handler's words and nothing else,
 * before it is formatted.
 *
 * @param words - Each handler's English words, in handler order.
 */
const englishModuleOf = (words: Readonly<Record<string, string>>): string =>
  `const ENGLISH = ${JSON.stringify(words)};\n\nexport { ENGLISH };\n`;

export { englishModuleOf };
