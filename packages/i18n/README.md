# Valence strings

Every word Valence shows a person, and the helpers that say them. Nothing a person reads is
written inline in the code. Each string is an entry in `strings-en.json`, and the code refers to it
by its handler.

## The strings files

`strings-en.json` is an array of entries, sorted by handler:

```json
{
  "handler": "error.requests.noSuchBlockedRelease",
  "text": "No such blocked release.",
  "context": "An error the server answers with (HTTP 404) in the media requests in the requests service (from `createRequestRoutes`)."
}
```

- **handler** is the code a client translates by. It is dotted and camelCase, and its first
  segment is where the string is used: `error`, `common`, `server`, `requests`, `core`,
  `contracts`. Once released, a handler is permanent, because servers store it and clients look it
  up.
- **text** is the English. A `{name}` in it is a gap, filled when it is said.
- **context** is written for the translator: where the text appears and what fills each gap.

No two entries share a handler, and no two share a text. If the same words are needed twice, the
second place uses the first entry.

A string that changes with a number has two entries, `<handler>.one` and `<handler>.other`. Both
fill `{count}`, and these are the only entries allowed to repeat a text. Languages with more forms
add `.few`, `.many`, `.two` or `.zero` in their own file.

Every other language has a file of its own, `strings-<language>.json`, with the same handlers in
the same order. Each one holds the English until it is translated. `LANGUAGES.ts` lists the
languages, and a test checks that every file keeps the same handlers and fills the same gaps as the
English.

### Adding or changing a string

1. Edit `strings-en.json`. Order doesn't matter, and a new entry can go anywhere.
2. Run `pnpm i18n:write`. It sorts the English, adds new entries to every other language in
   English, removes deleted ones, and regenerates `src/ENGLISH.ts`, which is what makes a handler a
   type.
3. Refer to the string by its handler. A mistyped handler is a type error.

Changing the English of an existing entry doesn't change its translations. They become stale,
and a translator has to catch that. If the meaning changes, give the string a new handler.

## Saying things

| Helper                                | Returns                 | For                                                            |
| ------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `say(key, values?)`                   | `string`                | English for this process: logs, webhooks, anything not shown   |
| `sayCount(key, count, values?)`       | `string`                | The same, choosing `.one` or `.other`                          |
| `sayParts(key, fillings)`             | `(string \| Filling)[]` | A sentence whose gap holds an element, such as a link          |
| `sayCountParts(key, count, fillings)` | `(string \| Filling)[]` | The same, counted, where `{count}` is itself an element        |
| `saying(key, values?)`                | `Said`                  | Something a server tells a person, to store or to send         |
| `sayingCount(key, count, values?)`    | `Said`                  | The same, counted                                              |
| `sayingAll(items)`                    | `Said`                  | Several names or things said, as "a, b and c"                  |
| `sayingList(saids)`                   | `Said`                  | Several separate reasons, run together                         |
| `sayVerbatim(text)`                   | `Said`                  | Text from elsewhere (a download client, a plugin), not our own |
| `sayAgain(said)`                      | `string`                | A client showing a `Said` in the language it was built with    |
| `sayAgainIfAny(said)`                 | `string \| null`        | The same, for something that may be absent                     |
| `refuse(key, values?)`                | `RefusalBody`           | The body of an error response                                  |
| `refuseWith(said)`                    | `RefusalBody`           | An error response for a reason already held as a `Said`        |

### What a server sends

Anything a server sends or stores for a person to read is a `Said`:

```json
{
  "code": "server.service.pluginService.thisVersionAsksForMoreThan",
  "message": "This version asks for more than the one installed: reading the library.",
  "values": { "permissions": "reading the library" }
}
```

`message` holds the English with the gaps already filled. A value can itself
be a `Said`, so a reason can sit inside a sentence and still be translated. `code` is `null` for
text that isn't ours to translate. A client that doesn't know the code, such as an older app
talking to a newer server, shows `message`.

An error response keeps the English under `error`, where every client has always read it, and adds
the code and values next to it:

```json
{
  "error": "No such blocked release.",
  "code": "error.requests.noSuchBlockedRelease",
  "values": {}
}
```

`SaidSchema` and `RefusalSchema` describe these in the API contract. A failure that crosses a
`throw` carries its `Said` on a `SaidError`.

Log lines and webhook payloads stay in English. They use `.message` or `say`, never a code.

### Sentences with elements in them

In `packages/screens`, a sentence whose gap holds an element, such as a link or a number that
updates, is drawn with `Sentence`:

```tsx
<Sentence words="common.doneOfTotal" fillings={{ done: <FormattedBytes bytes={done} />, total }} />
<Sentence counted="common.count.items" count={n} fillings={{ count: <FormattedNumber value={n} /> }} />
```

The phone and TV clients map `sayParts` or `sayCountParts` into keyed fragments the same way.

## Enforcement

The oxlint rule `valence/no-hard-coded-strings` covers every package and app except the docs,
landing and plugin SDK. It reports:

- a string literal that reads like words for a person: a capitalised phrase, a sentence, or text
  inside JSX or in a label-like property;
- a template with words around its values, such as `` `${count} episodes` `` or `` `${time} left` ``;
- a choice made on whether a number is one, such as `count === 1 ? 'song' : 'songs'`, which
  belongs in `sayCount`.

It skips class names, keys, header names, handlers, measures such as `1080p`, style values such
as font stacks, and anything passed to a logger or to one of the helpers above. Where type
information is available, a lower-case literal that is one of the values its type allows, such as
`'every library'` passed where `'one library' | 'every library'` is expected, counts as a key.
Tests are exempt.

Machine values that look like words, such as a cookie's `sameSite`, a user agent, or a mode a
client matches on, take a disable comment with a reason:

```ts
// oxlint-disable-next-line valence/no-hard-coded-strings -- a user agent, read by sites rather than by people
```

## Testing

`src/testing/saidMatchesItsEnglish.ts` is a Vitest equality tester. When a package's setup file
registers it, `toEqual` accepts an English string where a `Said` is expected, as long as that
string is the `Said`'s `message`. Tests can then assert on the words a person sees without
repeating the code and values.
