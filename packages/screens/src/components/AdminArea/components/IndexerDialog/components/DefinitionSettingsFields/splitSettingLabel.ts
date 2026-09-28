const SEPARATOR = /\s[-–—]\s/u;

const LONGEST_TITLE = 48;

/**
 * Splits a site setting's label, as indexer definitions write it — `Disable sorting - the site stops
 * sorting under load, so disable this if you get no results` — into a short title and the
 * explanation that follows, so the explanation can sit beneath the title in smaller type.
 *
 * @param label - The label as the definition gives it.
 * @returns The title, and the explanation where there is one.
 */
const splitSettingLabel = (label: string): { title: string; detail: string | null } => {
  const found = SEPARATOR.exec(label);

  if (found === null || found.index > LONGEST_TITLE) {
    return { title: label, detail: null };
  }

  const detail = label.slice(found.index + found[0].length).trim();

  return {
    title: label.slice(0, found.index).trim(),
    detail: detail === '' ? null : `${detail.charAt(0).toUpperCase()}${detail.slice(1)}`,
  };
};

export { splitSettingLabel };
