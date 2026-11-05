import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { mediaItem, versionChoice } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type VersionChoice = { label?: string | null; isStanding?: boolean };

/**
 * Keeps what an administrator chose for a film's versions, by file, so every scan after it keeps the
 * choice: the name a version goes by, such as "Director's Cut", and which version stands for the
 * film, the one every app plays unless another is chosen.
 *
 * @param db - The database.
 * @returns How to make a choice, and how to lay the choices kept back over a library.
 */
const createVersionChoices = (db: AnyValenceDatabase) => {
  /**
   * Makes one version stand for its film: every other version, and the film's extras, hang from it
   * instead of from the one that stood before.
   *
   * @param id - The version.
   */
  const standFor = async (id: string) => {
    const [version] = await db
      .select({ parentId: mediaItem.parentId, extraKind: mediaItem.extraKind })
      .from(mediaItem)
      .where(eq(mediaItem.id, id))
      .limit(1);
    const before = version?.parentId ?? null;

    if (version === undefined || version.extraKind !== null || before === null) {
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(mediaItem)
        .set({ parentId: id })
        .where(and(eq(mediaItem.parentId, before), ne(mediaItem.id, id)));
      await tx.update(mediaItem).set({ parentId: id }).where(eq(mediaItem.id, before));
      await tx.update(mediaItem).set({ parentId: null }).where(eq(mediaItem.id, id));
    });
  };

  /**
   * Lays the choices kept for a library back over its films, as the last step of a scan, since a
   * scan names and links versions again from their file names.
   *
   * @param libraryId - The library.
   */
  const apply = async (libraryId: string) => {
    const choices = await db
      .select()
      .from(versionChoice)
      .where(eq(versionChoice.libraryId, libraryId));

    if (choices.length === 0) {
      return;
    }

    const files = await db
      .select({ id: mediaItem.id, path: mediaItem.path })
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, libraryId),
          isNull(mediaItem.extraKind),
          inArray(
            mediaItem.path,
            choices.map((one) => one.path),
          ),
        ),
      );
    const idOf = new Map(files.map((file) => [file.path, file.id]));

    for (const choice of choices) {
      const id = idOf.get(choice.path);

      if (id === undefined) {
        continue;
      }

      if (choice.label !== null) {
        await db
          .update(mediaItem)
          .set({ versionLabel: choice.label === '' ? null : choice.label })
          .where(eq(mediaItem.id, id));
      }

      if (choice.isStanding) {
        await standFor(id);
      }
    }
  };

  /**
   * Chooses what a version is called, or that it stands for its film, and makes it so at once.
   *
   * @param mediaId - The version.
   * @param choice - Its name, empty for none or null to go back to what its file name says, and
   *   whether it is to stand for the film.
   * @returns Whether there was such a version.
   */
  const choose = async (mediaId: string, choice: VersionChoice): Promise<boolean> => {
    const [file] = await db
      .select({
        libraryId: mediaItem.libraryId,
        path: mediaItem.path,
        extraKind: mediaItem.extraKind,
      })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    if (file === undefined || file.extraKind !== null) {
      return false;
    }

    const where = and(
      eq(versionChoice.libraryId, file.libraryId),
      eq(versionChoice.path, file.path),
    );
    const [held] = await db.select().from(versionChoice).where(where).limit(1);
    const label = choice.label === undefined ? (held?.label ?? null) : choice.label;
    const isStanding = choice.isStanding ?? held?.isStanding ?? false;

    await db.transaction(async (tx) => {
      await tx.delete(versionChoice).where(where);

      if (label !== null || isStanding) {
        await tx
          .insert(versionChoice)
          .values({ libraryId: file.libraryId, path: file.path, label, isStanding });
      }
    });

    if (choice.label !== undefined) {
      await db
        .update(mediaItem)
        .set({ versionLabel: label === null || label === '' ? null : label })
        .where(eq(mediaItem.id, mediaId));
    }

    if (choice.isStanding === true) {
      await standFor(mediaId);

      const others = await db
        .select({ path: mediaItem.path })
        .from(mediaItem)
        .where(and(eq(mediaItem.parentId, mediaId), isNull(mediaItem.extraKind)));

      if (others.length > 0) {
        await db
          .update(versionChoice)
          .set({ isStanding: false })
          .where(
            and(
              eq(versionChoice.libraryId, file.libraryId),
              inArray(
                versionChoice.path,
                others.map((one) => one.path),
              ),
            ),
          );
      }
    }

    return true;
  };

  return { apply, choose };
};

export type { VersionChoice };

export { createVersionChoices };
