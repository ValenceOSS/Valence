/**
 * A small definition, written out, for tests of everything that keeps or describes definitions.
 *
 * @param id - What to call it.
 * @param extra - Any YAML to add at the top level.
 * @returns The YAML.
 */
const aDefinitionYaml = (id: string, extra = ''): string => `id: ${id}
name: ${id.toUpperCase()}
description: "${id} is a tracker"
language: en-US
type: semi-private
links: [https://${id}.example/, https://mirror.${id}.example/]
caps:
  categorymappings:
    - {id: 1, cat: Movies/HD, desc: "Films"}
    - {id: 2, cat: TV, desc: "Series"}
  modes:
    search: [q]
${extra}
search:
  paths:
    - path: browse.php
  rows:
    selector: tr
  fields:
    title:
      selector: a
`;

export { aDefinitionYaml };
