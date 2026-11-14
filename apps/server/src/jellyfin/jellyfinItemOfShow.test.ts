import { describe, expect, it } from 'vitest';
import { jellyfinItemOfShow } from './jellyfinItemOfShow';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinShow } from './testing/aJellyfinShow';

const viewing = { serverId: 'server', progress: new Map(), favourites: new Set<string>() };

describe('jellyfinItemOfShow', () => {
  it('describes a programme as a series in its library', () => {
    const show = aJellyfinShow();

    expect(jellyfinItemOfShow(show, viewing)).toMatchObject({
      Name: 'Twin Peaks',
      Type: 'Series',
      Id: showJellyfinId(show.libraryId, 'twin-peaks'),
      ParentId: '9b2d6e3a1f4c4e7a9d3b5c8e2f1a0b7d',
      IsFolder: true,
      ChildCount: 2,
      ImageTags: { Primary: 'cccccccccccccccccccccccccccccccc' },
      UserData: { Played: false, UnplayedItemCount: 2 },
    });
  });

  it('adds the story where the programme itself was asked for', () => {
    const show = aJellyfinShow({ overview: 'A town with secrets.' });

    expect(jellyfinItemOfShow(show, viewing, show).Overview).toBe('A town with secrets.');
  });
});
