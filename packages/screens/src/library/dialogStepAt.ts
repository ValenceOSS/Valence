import { showIdOf } from '@ValenceClient/library/showIdOf';
import type { DialogKind } from '@ValenceClient/dialogs/DialogKind';
import type { DialogStep } from '@ValenceClient/dialogs/DialogStep';
import type { Place } from '@ValenceClient/navigation/readLocation';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Describes the dialog showing as a step that can be gone back to. The episodes of a show are one
 * step, so that turning through a season does not have to be walked back through.
 *
 * @param top - The kind of dialog showing.
 * @param place - Where the application is.
 * @param inspecting - The title open, once it is known.
 * @param showTitle - What the open show is called, once it is known.
 * @param personName - What the open person is called, once it is known.
 * @returns The step, null where no dialog shows, or undefined until the open title is known.
 */
const dialogStepAt = (
  top: DialogKind | null,
  place: Place,
  inspecting: MediaSummary | null,
  showTitle: string | null,
  personName: string | null,
): DialogStep | null | undefined => {
  if (top === null) {
    return null;
  }

  const { show, asking, person, collection } = place;
  const steps = (key: string, title: string | null): DialogStep => ({
    key,
    title,
    place: { show, inspecting: place.inspecting, asking, person, collection },
  });

  switch (top) {
    case 'film': {
      if (inspecting === null) {
        return undefined;
      }

      const series = showIdOf(inspecting);

      return steps(
        series === null ? `film:${inspecting.id}` : `episodes:${series}`,
        inspecting.title,
      );
    }
    case 'show':
      return steps(`show:${show ?? ''}`, showTitle);
    case 'person':
      return steps(`person:${String(person)}`, personName);
    case 'asking':
      return steps(`asking:${asking ?? ''}`, null);
    case 'collection':
      return steps(`collection:${collection ?? ''}`, null);
  }
};

export { dialogStepAt };
