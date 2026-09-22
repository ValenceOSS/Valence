import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import type { ServerChoicesProps } from './ServerChoices.types';

/**
 * A few servers to press instead of an address to type, under a word saying where they came from.
 *
 * Where they came from is the point of the heading: one found on this machine, one heard on the
 * network and one used last week are all offered the same way, but somebody choosing between two
 * that share a name wants to know which is which. Nothing is drawn where there is nothing to offer,
 * so an empty heading never sits above the box.
 *
 * @param title - Where these came from.
 * @param choices - What to offer, each with what to call it and, where it helps, where it is.
 * @param onChoose - Told the address pressed.
 * @param isDisabled - Whether pressing is held off, while an address is already being tried.
 */
const ServerChoices = ({ title, choices, onChoose, isDisabled = false }: ServerChoicesProps) => {
  const prefersReducedMotion = useReducedMotionConfig();

  if (choices.length === 0) {
    return null;
  }

  return (
    <motion.section
      aria-label={title}
      variants={revealVariants(prefersReducedMotion)}
      transition={revealTransition(prefersReducedMotion)}
      className="flex w-full max-w-sm flex-col items-center gap-3"
    >
      <p className="text-sm text-text-muted">{title}</p>

      {choices.map((choice) => (
        <Button
          key={choice.address}
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={isDisabled}
          onClick={() => {
            onChoose(choice.address);
          }}
        >
          <span className="truncate">{choice.label}</span>

          {choice.detail === undefined ? null : (
            <span className="truncate text-text-muted">{choice.detail}</span>
          )}
        </Button>
      ))}
    </motion.section>
  );
};

ServerChoices.displayName = 'ServerChoices';

export { ServerChoices };
