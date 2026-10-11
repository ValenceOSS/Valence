/**
 * The groups a channel belongs to, read from its playlist's group, which may name several at once
 * as `Outdoor;Sports` does.
 *
 * @param group - The group as the playlist gives it.
 * @returns Each group on its own.
 */
const groupsOf = (group: string | null): string[] =>
  group === null
    ? []
    : group
        .split(';')
        .map((one) => one.trim())
        .filter((one) => one !== '');

export { groupsOf };
