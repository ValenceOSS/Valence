import { describe, expect, it } from 'vitest';
import { renderTemplate } from './renderTemplate';

const VARIABLES = {
  '.Config.sitelink': 'https://tracker.example/',
  '.Config.username': 'ada',
  '.Config.freeleech-only': null,
  '.Keywords': 'dune part two',
  '.Query.Album': null,
  '.Query.Artist': 'Blur',
  '.Result._cat': 'movie',
  '.Categories': ['101', '201'],
  '.True': 'True',
  '.False': null,
};

describe('renderTemplate', () => {
  it('leaves text with no actions alone', () => {
    expect(renderTemplate('browse.php', VARIABLES)).toBe('browse.php');
  });

  it('writes variables in, including names with hyphens', () => {
    expect(renderTemplate('{{ .Config.sitelink }}u/{{.Config.username}}', VARIABLES)).toBe(
      'https://tracker.example/u/ada',
    );
    expect(renderTemplate('[{{ .Config.freeleech-only }}]', VARIABLES)).toBe('[]');
  });

  it('writes nothing for a variable nobody set', () => {
    expect(renderTemplate('x{{ .Query.Nothing }}y', VARIABLES)).toBe('xy');
  });

  it('chooses a branch on whether a value is set', () => {
    const template = '{{ if .Keywords }}search.php{{ else }}latest.php{{ end }}';

    expect(renderTemplate(template, VARIABLES)).toBe('search.php');
    expect(renderTemplate(template, { ...VARIABLES, '.Keywords': '  ' })).toBe('latest.php');
    expect(renderTemplate('{{ if .Config.freeleech-only }}free{{ end }}', VARIABLES)).toBe('');
  });

  it('follows else-if', () => {
    expect(
      renderTemplate(
        '{{ if .Query.Album }}a{{ else if .Query.Artist }}b{{ else }}c{{ end }}',
        VARIABLES,
      ),
    ).toBe('b');
  });

  it('nests conditions', () => {
    expect(
      renderTemplate(
        '{{ if .Keywords }}{{ if .Query.Album }}1{{ else }}2{{ end }}{{ else }}3{{ end }}',
        VARIABLES,
      ),
    ).toBe('2');
  });

  it('returns whichever argument or finds set, and what and stops on', () => {
    expect(renderTemplate('{{ or .Query.Album .Query.Artist }}', VARIABLES)).toBe('Blur');
    expect(renderTemplate('{{ or (.Query.Album) (.Query.Nothing) }}', VARIABLES)).toBe('');
    expect(
      renderTemplate('{{ if and .Keywords .Query.Artist }}both{{ else }}not{{ end }}', VARIABLES),
    ).toBe('both');
    expect(
      renderTemplate('{{ if and .Keywords .Query.Album }}both{{ else }}not{{ end }}', VARIABLES),
    ).toBe('not');
  });

  it('compares text with eq and ne, nested inside and and or', () => {
    expect(
      renderTemplate('{{ if eq .Result._cat "movie" }}2 GB{{ else }}512 MB{{ end }}', VARIABLES),
    ).toBe('2 GB');
    expect(renderTemplate('{{ if ne .Result._cat "movie" }}y{{ else }}n{{ end }}', VARIABLES)).toBe(
      'n',
    );
    expect(
      renderTemplate(
        '{{ if or (eq .Result._cat "series") (or (eq .Result._cat "movie_etc") (eq .Result._cat "movie")) }}yes{{ else }}no{{ end }}',
        VARIABLES,
      ),
    ).toBe('yes');
    expect(
      renderTemplate(
        '{{ if and (.Keywords) (eq .Config.username "ada") (.Query.Artist) }}ok{{ end }}',
        VARIABLES,
      ),
    ).toBe('ok');
  });

  it('treats an unset value as equal only to another unset one', () => {
    expect(renderTemplate('{{ if eq .Query.Album .Query.Nothing }}same{{ end }}', VARIABLES)).toBe(
      'same',
    );
    expect(
      renderTemplate('{{ if eq .Query.Album "" }}same{{ else }}different{{ end }}', VARIABLES),
    ).toBe('different');
  });

  it('negates with not', () => {
    expect(renderTemplate('{{ if not .Query.Album }}none{{ end }}', VARIABLES)).toBe('none');
    expect(renderTemplate('{{ if not .Keywords }}none{{ else }}some{{ end }}', VARIABLES)).toBe(
      'some',
    );
  });

  it('loops over a list, with and without an index', () => {
    expect(renderTemplate('{{ range .Categories }}cat[]={{.}}&{{end}}', VARIABLES)).toBe(
      'cat[]=101&cat[]=201&',
    );
    expect(
      renderTemplate(
        '{{ range $i, $e := .Categories }}&categories[{{$i}}]={{ $e }}{{end}}',
        VARIABLES,
      ),
    ).toBe('&categories[0]=101&categories[1]=201');
    expect(renderTemplate('{{ range .Keywords }}[{{.}}]{{end}}', VARIABLES)).toBe(
      '[dune part two]',
    );
    expect(renderTemplate('{{ range .Query.Nothing }}x{{end}}', VARIABLES)).toBe('');
  });

  it('joins a list, and passes text straight through', () => {
    expect(renderTemplate('{{ join .Categories "," }}', VARIABLES)).toBe('101,201');
    expect(renderTemplate('{{ join .Keywords "," }}', VARIABLES)).toBe('dune part two');
    expect(renderTemplate('{{ join .Query.Nothing "," }}', VARIABLES)).toBe('');
    expect(renderTemplate('{{ .Categories }}', VARIABLES)).toBe('101,201');
  });

  it('replaces by pattern, as .NET would', () => {
    expect(renderTemplate('{{ re_replace .Keywords "[^a-zA-Z0-9]+" "%" }}', VARIABLES)).toBe(
      'dune%part%two',
    );
    expect(renderTemplate('{{ re_replace .Keywords "(?i)DUNE" "[$0]" }}', VARIABLES)).toBe(
      '[dune] part two',
    );
    expect(renderTemplate('{{ re_replace .Keywords "((?<-o>)" "x" }}', VARIABLES)).toBe(
      'dune part two',
    );
  });

  it('escapes only the values written in', () => {
    expect(renderTemplate('search/{{ .Keywords }}/1', VARIABLES, encodeURIComponent)).toBe(
      'search/dune%20part%20two/1',
    );
  });

  it('forgives an end with nothing open, an if left open, and a stray bracket', () => {
    expect(renderTemplate('a{{ end }}b', VARIABLES)).toBe('ab');
    expect(renderTemplate('{{ if .Keywords }}open', VARIABLES)).toBe('open');
    expect(
      renderTemplate('{{ if and (.Keywords) (eq .Config.username "ada")) }}ok{{ end }}', VARIABLES),
    ).toBe('ok');
    expect(renderTemplate('{{if}}x{{else}}y{{end}}', VARIABLES)).toBe('y');
  });

  it('writes nothing for a function it does not know, and nothing for an empty action', () => {
    expect(renderTemplate('[{{ printf "%s" .Keywords }}]', VARIABLES)).toBe('[]');
    expect(renderTemplate('[{{ }}]', VARIABLES)).toBe('[]');
    expect(renderTemplate('{{ else }}x', VARIABLES)).toBe('x');
  });

  it('writes a quoted literal as itself, keeping escaped quotes', () => {
    expect(renderTemplate('{{ "say \\"hi\\"" }}', VARIABLES)).toBe('say "hi"');
  });
});
