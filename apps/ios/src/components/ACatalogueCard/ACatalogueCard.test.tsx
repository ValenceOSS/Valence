import { render, userEvent } from '@testing-library/react-native';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { ACatalogueCard } from './ACatalogueCard';

describe('ACatalogueCard', () => {
  it('opens the title it shows', async () => {
    const onAsk = jest.fn();
    const drawn = await render(<ACatalogueCard title={aCatalogueTitle()} onAsk={onAsk} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film', '438631');
  });

  it('says when it is here already', async () => {
    const drawn = await render(
      <ACatalogueCard
        title={aCatalogueTitle({
          standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
        })}
        onAsk={jest.fn()}
      />,
    );

    expect(drawn.getByText('In your library')).toBeTruthy();
  });

  it('says nothing where it can still be asked for', async () => {
    const drawn = await render(<ACatalogueCard title={aCatalogueTitle()} onAsk={jest.fn()} />);

    expect(drawn.queryByText('Requested')).toBeNull();
    expect(drawn.queryByText('In your library')).toBeNull();
  });

  it('draws nothing for music', async () => {
    const drawn = await render(
      <ACatalogueCard title={aCatalogueTitle({ kind: 'album' })} onAsk={jest.fn()} />,
    );

    expect(drawn.queryByRole('button')).toBeNull();
  });
});
