import { render, userEvent } from '@testing-library/react-native';
import { readBookDocument } from '@ValenceClient/books/readBookDocument';
import { TheBookText } from './TheBookText';

const aPart = (html: string, onLink = jest.fn(), onAnchors = jest.fn()) => (
  <TheBookText
    nodes={readBookDocument(html)}
    size={19}
    leading={1.6}
    ink="#1e1b18"
    onLink={onLink}
    onAnchors={onAnchors}
  />
);

describe('TheBookText', () => {
  it('draws headings and paragraphs, with emphasis running on in them', async () => {
    const drawn = await render(aPart('<h1>Chapter one</h1><p>It was <em>cold</em> there.</p>'));

    expect(drawn.getByText('Chapter one')).toBeTruthy();
    expect(drawn.getByText('cold')).toBeTruthy();
  });

  it('folds whitespace as a browser does', async () => {
    const drawn = await render(aPart('<p>far   \n  away</p>'));

    expect(drawn.getByText('far away')).toBeTruthy();
  });

  it('follows a link, handing it to the reader', async () => {
    const onLink = jest.fn();
    const drawn = await render(
      aPart('<p>See <a href="#valence-part-3:note">note 1</a>.</p>', onLink),
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Follow the link to note 1' }));

    expect(onLink).toHaveBeenCalledWith('#valence-part-3:note');
  });
});
