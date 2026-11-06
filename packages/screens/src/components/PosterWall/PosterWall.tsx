import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { WallField } from './components/WallField/WallField';
import type { PosterWallProps } from './PosterWall.types';

/**
 * Everything there is to watch on one screen, as a wall of posters that fades in over the page and
 * settles from a little closer, as if stepping back to take it in. Titles open over it, so closing
 * one comes back to the wall where it was left.
 *
 * @param isOpen - Whether the wall is showing.
 * @param onClose - Closes it.
 * @param onOpenFilm - Opens a film.
 * @param onOpenShow - Opens a programme.
 */
const PosterWall = ({ isOpen, onClose, onOpenFilm, onOpenShow }: PosterWallProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="wall"
          className="fixed inset-0 z-40 bg-shade"
          initial={{ opacity: 0, transform: isStill ? 'none' : 'scale(1.04)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          exit={{ opacity: 0, transform: isStill ? 'none' : 'scale(1.04)' }}
          transition={{ duration: isStill ? 0.15 : 0.32, ease: [0.23, 1, 0.32, 1] }}
        >
          <WallField onClose={onClose} onOpenFilm={onOpenFilm} onOpenShow={onOpenShow} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

PosterWall.displayName = 'PosterWall';

export { PosterWall };
