import type { DeckFaceProps } from './DeckFace.types';

/**
 * Draws one card's smile or frown as a ring cut down to its arc, with round ends, in the colour of
 * the ground behind the deck so it reads as a hole through the card.
 *
 * @param face - The arc, in the card's own space.
 * @param thickness - How thick the stroke is.
 * @param opacity - How far it has come in.
 * @returns The face.
 */
const DeckFace = ({ face, thickness, opacity }: DeckFaceProps) => {
  const outer = face.radius + thickness / 2;
  const inner = face.radius - thickness / 2;
  const middle = face.isSmile ? 180 : 0;
  const degrees = (face.half * 180) / Math.PI;
  const top = face.isSmile ? face.apex - face.radius - outer : face.apex + face.radius - outer;
  const ends = [middle - degrees, middle + degrees].map((angle) => {
    const turn = (angle * Math.PI) / 180;

    return [outer + face.radius * Math.sin(turn), outer - face.radius * Math.cos(turn)] as const;
  });

  return (
    <span
      className="absolute block"
      style={{ left: face.cx - outer, top, width: outer * 2, height: outer * 2, opacity }}
    >
      <span
        className="absolute inset-0 block bg-surface"
        style={{
          maskImage: `radial-gradient(circle, transparent ${inner}px, black ${inner}px, black ${outer}px, transparent ${outer}px), conic-gradient(from ${middle - degrees}deg, black 0deg ${degrees * 2}deg, transparent ${degrees * 2}deg)`,
          maskComposite: 'intersect',
        }}
      />
      {ends.map(([x, y]) => (
        <span
          key={x}
          className="absolute block rounded-full bg-surface"
          style={{
            width: thickness,
            height: thickness,
            left: x - thickness / 2,
            top: y - thickness / 2,
          }}
        />
      ))}
    </span>
  );
};

DeckFace.displayName = 'DeckFace';

export { DeckFace };
