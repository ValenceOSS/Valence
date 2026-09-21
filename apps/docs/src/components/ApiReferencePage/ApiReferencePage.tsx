import { Suspense, lazy, useEffect } from 'react';
import { Spinner } from '@ValenceUI/Spinner';

const ApiReference = lazy(() =>
  import('@ValenceDocs/components/ApiReferencePage/components/ApiReference/ApiReference').then(
    ({ ApiReference: loaded }) => ({ default: loaded }),
  ),
);

/**
 * The API reference, loaded only when somebody opens it because the viewer is larger than the rest
 * of the site put together.
 */
const ApiReferencePage = () => {
  useEffect(() => {
    document.title = 'API reference | Valence Docs';
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner label="Loading the API reference" />
        </div>
      }
    >
      <ApiReference />
    </Suspense>
  );
};

ApiReferencePage.displayName = 'ApiReferencePage';

export { ApiReferencePage };
