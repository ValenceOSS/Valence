import { describe, expect, it } from 'vitest';
import { describePictureFault } from './describePictureFault';
import { MOST_BYTES, MOST_PIXELS_AN_EDGE } from './whatIsWrongWithThePicture';

describe('saying why a picture was turned away', () => {
  it('says which thing was wrong, rather than that something was', () => {
    const said = [
      describePictureFault('notAPicture').error,
      describePictureFault('tooLarge').error,
      describePictureFault('tooDetailed').error,
      describePictureFault('unreadable').error,
      describePictureFault('notYours').error,
    ];

    expect(new Set(said).size).toBe(said.length);
  });

  it('names the limits from where they are set, so prose cannot drift from them', () => {
    expect(describePictureFault('tooLarge').error).toContain(
      (MOST_BYTES / (1024 * 1024)).toString(),
    );
    expect(describePictureFault('tooDetailed').error).toContain(MOST_PIXELS_AN_EDGE.toString());
  });

  it('answers a picture too big with the status that means exactly that', () => {
    expect(describePictureFault('tooLarge').status).toBe(413);
  });

  it('answers a profile on another account as absent rather than as a bad picture', () => {
    expect(describePictureFault('notYours').status).toBe(404);
  });

  it('answers the rest as the request being wrong', () => {
    expect(describePictureFault('notAPicture').status).toBe(400);
    expect(describePictureFault('tooDetailed').status).toBe(400);
    expect(describePictureFault('unreadable').status).toBe(400);
  });
});
