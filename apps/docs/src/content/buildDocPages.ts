import { DOC_SECTIONS } from '@ValenceDocs/content/DOC_SECTIONS';
import { DocFrontmatterSchema } from '@ValenceDocs/content/DocFrontmatterSchema';
import type { DocFrontmatter } from '@ValenceDocs/content/DocFrontmatterSchema';
import type { DocModule, DocPage } from '@ValenceDocs/content/DocPage.types';

type DocFile = {
  file: string;
  frontmatter: Partial<DocFrontmatter>;
  load: () => Promise<DocModule>;
};

const FILE_PATH = /^\.\/(?<section>[a-z0-9-]+)\/(?<slug>[a-z0-9-]+)\.mdx$/u;

/**
 * Turns the MDX files under the content folder into the pages the site serves.
 *
 * A file's address comes from where it sits, `start/quick-start.mdx` becoming `/start/quick-start`,
 * so adding a page is adding a file and there is no list of pages to keep in step with them. Its
 * frontmatter is checked here rather than trusted, because a page missing its title should stop the
 * build with the file's name in the message rather than show up as a blank link in the sidebar.
 *
 * @param files - Each file's path relative to the content folder, its frontmatter and how to load it.
 * @returns The pages, in section order and then by their own order.
 * @throws If a file is in no known section or its frontmatter is incomplete.
 */
const buildDocPages = (files: readonly DocFile[]): readonly DocPage[] =>
  files
    .map((file): DocPage => {
      const { section, slug } = FILE_PATH.exec(file.file)?.groups ?? {};
      const known = DOC_SECTIONS.find((candidate) => candidate.id === section);

      if (section === undefined || slug === undefined || known === undefined) {
        throw new Error(
          `${file.file} is not in a section. Put it in one of: ${DOC_SECTIONS.map((s) => s.id).join(', ')}.`,
        );
      }

      const parsed = DocFrontmatterSchema.safeParse(file.frontmatter);

      if (!parsed.success) {
        throw new Error(`${file.file} has incomplete frontmatter: ${parsed.error.message}`);
      }

      return {
        path: `/${section}/${slug}`,
        section,
        sectionTitle: known.title,
        title: parsed.data.title,
        description: parsed.data.description,
        order: parsed.data.order,
        load: file.load,
      };
    })
    .toSorted(
      (a, b) =>
        DOC_SECTIONS.findIndex((s) => s.id === a.section) -
          DOC_SECTIONS.findIndex((s) => s.id === b.section) ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    );

export type { DocFile };

export { buildDocPages };
