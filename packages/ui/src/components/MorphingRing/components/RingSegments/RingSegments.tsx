import type { RingSegmentsProps } from './RingSegments.types';

const GAP_SHARE = 0.38;

const CORNER_SHARE = 0.35;

const ICON_SHARE = 0.8;

/**
 * A ring of short segments with softened corners with gaps between them, the first few lit and the rest left as
 * a faint track. Each is a short bar laid along the ring rather than an arc, which at this length
 * reads the same. It keeps the margin an icon of the same size keeps, so it stands no larger than
 * the icons beside it.
 *
 * @param size - How large the ring is, in pixels.
 * @param lit - Where the lit segments end, counting round from the top.
 * @param litFrom - Where they start, the top unless said otherwise.
 * @param count - How many segments the ring is cut into.
 */
const RingSegments = ({ size, lit, litFrom = 0, count }: RingSegmentsProps) => {
  const drawn = size * ICON_SHARE;
  const stroke = Math.max(1.5, drawn / 9);
  const radius = (drawn - stroke) / 2;
  const length = ((2 * Math.PI * radius) / count) * (1 - GAP_SHARE);

  return (
    <span className="absolute inset-0">
      {Array.from({ length: count }, (_, at) => (
        <span
          key={at}
          className="absolute top-1/2 left-1/2 bg-current transition-opacity duration-300 ease-out"
          style={{
            width: length,
            height: stroke,
            borderRadius: stroke * CORNER_SHARE,
            opacity: at >= litFrom && at < lit ? 1 : 0.18,
            transform: `translate(-50%, -50%) rotate(${((360 / count) * at).toString()}deg) translateY(-${radius.toString()}px)`,
          }}
        />
      ))}
    </span>
  );
};

RingSegments.displayName = 'RingSegments';

export { RingSegments };
