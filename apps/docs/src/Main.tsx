import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { reloadWhenCodeIsGone } from '@ValenceUI/reloadWhenCodeIsGone';
import { buildRouter } from '@ValenceDocs/routes/buildRouter';
import './styles/main.css';

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

const router = buildRouter();

reloadWhenCodeIsGone(window);

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
