import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Moon as MoonIcon, Sun as SunIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { keepSiteTheme } from './keepSiteTheme';
import { readSiteTheme } from './readSiteTheme';
import type { ThemeToggleProps } from './ThemeToggle.types';

/**
 * Switches the whole site between light and dark from the bar: a sun while it is dark, to go light,
 * and a moon while it is light, to go dark. It opens on the visitor's own choice, or their system's
 * if they never made one, and the sun and moon turn over one another as it changes.
 *
 * @param className - Extra classes for the caller's own layout.
 */
const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(readSiteTheme);
  const isStill = useReducedMotionConfig() === true;
  const next = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Button
      variant="secondary"
      size="xs"
      isIconOnly
      label={next === 'light' ? 'Switch to light mode' : 'Switch to dark mode'}
      {...(className === undefined ? {} : { className })}
      onClick={() => {
        keepSiteTheme(next);
        setTheme(next);
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          className="flex"
          initial={isStill ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={isStill ? { opacity: 0 } : { rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        >
          <Icon of={theme === 'dark' ? SunIcon : MoonIcon} size={14} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
