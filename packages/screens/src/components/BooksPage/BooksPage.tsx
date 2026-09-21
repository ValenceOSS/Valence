import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import { revealTransition, revealVariants, staggerVariants } from '@ValenceUI/animations/reveal';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { BookShelf } from '@ValenceScreens/components/BookShelf/BookShelf';
import { ContinueReading } from '@ValenceScreens/components/ContinueReading/ContinueReading';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { Book } from '@ValenceContracts/schemas/Book';

/**
 * Everything there is to read.
 *
 * Choosing a book opens the dialog a film opens: what it is, how far through somebody is, what the
 * household made of it, and the ways to read it, keep it and share it — the button to read being the
 * largest thing in it. What somebody is partway through leads the page, the way a film half watched
 * leads the home page.
 *
 * Laid out as the other sections are: its heading is there for anybody reading the page rather than
 * looking at it, since the bar along the top already says where you are, and a banner saying it
 * again only pushed the books further down.
 */
const BooksPage = () => {
  const go = useNavigate();
  const { place, go: goTo } = usePlace();
  const { mayAdminister } = useWhatIMayDo();
  const open = (book: Book) => {
    goTo({ book: book.id });
  };
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.main
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className="flex flex-col gap-6 px-5 pt-6 pb-16 sm:px-10"
    >
      <h1 className="sr-only">Books</h1>

      <motion.section
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        aria-label="Books"
        className="flex flex-col gap-5"
      >
        <ContinueReading onOpen={open} />

        <BookShelf
          onOpen={open}
          libraryId={place.library}
          {...(mayAdminister
            ? {
                onAddLibrary: () => {
                  void go({ to: '/admin/$panel', params: { panel: 'libraries' } });
                },
              }
            : {})}
        />
      </motion.section>
    </motion.main>
  );
};

BooksPage.displayName = 'BooksPage';

export { BooksPage };
