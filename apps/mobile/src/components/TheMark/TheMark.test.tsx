import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { AppearanceSchema } from '@ValenceContracts/schemas/Roundness';
import { TheMark } from './TheMark';

/**
 * A cache that already knows how the server looks, with the brand given.
 */
const answersWith = (brand: { name: string | null; logo: string | null }) => {
  const answers = new QueryClient();

  answers.setQueryData(appearanceQueries.key, AppearanceSchema.parse({ brand }));

  return answers;
};

describe('TheMark', () => {
  it('draws Valence’s deck, named for anybody who cannot see it', async () => {
    const drawn = await render(
      <QueryClientProvider client={answersWith({ name: null, logo: null })}>
        <TheMark high={40} />
      </QueryClientProvider>,
    );

    expect(drawn.getByLabelText('Valence')).toBeTruthy();
  });

  it('draws the logo the server was given in place of Valence’s, named for the server', async () => {
    const drawn = await render(
      <QueryClientProvider client={answersWith({ name: 'Home Cinema', logo: '/api/brand/logo' })}>
        <TheMark high={40} />
      </QueryClientProvider>,
    );

    expect(drawn.getByLabelText('Home Cinema')).toBeTruthy();
    expect(drawn.queryByLabelText('Valence')).toBeNull();
  });
});
