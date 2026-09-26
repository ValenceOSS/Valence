const A_STRIP_FROM = 60;

const THE_OTHER_SIDE_BELOW = 20;

/**
 * The strip down one side of a folding phone's screen, where the system moves its status and bars,
 * read from the safe area: deep on one side and next to nothing on the other. An ordinary phone
 * held on its side keeps clear of its island on both sides alike, so it is never taken for one.
 *
 * @param room - The safe area's insets.
 * @returns Which side the strip is on and how wide it is, or nothing where there is none.
 */
const sideStripOf = (room: {
  left: number;
  right: number;
}): { side: 'left' | 'right'; breadth: number } | null => {
  if (room.right >= A_STRIP_FROM && room.left < THE_OTHER_SIDE_BELOW) {
    return { side: 'right', breadth: room.right };
  }

  if (room.left >= A_STRIP_FROM && room.right < THE_OTHER_SIDE_BELOW) {
    return { side: 'left', breadth: room.left };
  }

  return null;
};

export { sideStripOf };
