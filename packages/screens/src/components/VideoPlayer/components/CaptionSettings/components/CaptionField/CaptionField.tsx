import type { CaptionFieldProps } from './CaptionField.types';

/**
 * One setting in the caption panel: its name on the left, what it is set to on the right, and the
 * control underneath, so every setting reads the same way whatever kind of control it has.
 *
 * @param label - What is being set.
 * @param value - What it is set to, in words, where the control does not already say.
 * @param children - The control.
 */
const CaptionField = ({ label, value, children }: CaptionFieldProps) => (
  <div className="flex flex-col gap-2.5">
    <span className="flex items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      {value === undefined ? null : (
        <span className="truncate tabular-nums text-text-muted">{value}</span>
      )}
    </span>

    {children}
  </div>
);

CaptionField.displayName = 'CaptionField';

export { CaptionField };
