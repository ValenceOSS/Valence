# @valence/i18n

Every word Valence shows somebody, in one place, so it can be translated.

The words themselves live in [Valence-Translations](https://github.com/ValenceOSS/Valence-Translations),
checked out here as a git submodule at `strings/`. After cloning, run
`git submodule update --init`. To add or change a string, change it there in a pull request, then
move the submodule here to that commit.

## The strings file

`strings/strings-en.json` holds each string under a dotted key, grouped by where it is used:

```json
{
  "common.delete": {
    "value": "Delete",
    "usage": "Deletes something, or confirms deleting it in a dialog that has just asked.",
    "context": "/images/web.confirmDelete.png"
  }
}
```

- `value` is the words. `{name}` marks a gap the app fills in, such as `{title}`. Keep every gap when translating.
- `usage` says where the words appear and what they do, for a translator who has not seen the app.
- `context` is a screenshot of the screen they appear on, under `images/`.

Anything counted has two forms, `.one` and `.other`, and the app picks between them with the
language's own plural rules.

## The screens file

`strings/screens.json` lists every screen a `context` can point at: which client draws it, where it
is, and how to reach it. The screenshots in `strings/images/` are captured from it with `pnpm i18n:screens`, one per screen.

## In code

```ts
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

say('common.delete');
say('common.nothingMatches', { query });
sayCount('common.episodesLeft', left);
```

The `valence/no-hard-coded-strings` lint rule refuses words written straight into a component,
screen or server response.
