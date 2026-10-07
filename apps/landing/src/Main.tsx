import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { MotionConfig } from 'motion/react';
import { hasHardwareGraphics } from '@ValenceUI/hasHardwareGraphics';
import { buildRouter } from '@ValenceLanding/routes/buildRouter';
import './styles/main.css';

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

const router = buildRouter();

const isDrawnInSoftware = !hasHardwareGraphics();

if (isDrawnInSoftware) {
  document.documentElement.dataset.graphics = 'software';
  document.documentElement.dataset.motion = 'reduced';
}

createRoot(container).render(
  <StrictMode>
    <MotionConfig reducedMotion={isDrawnInSoftware ? 'always' : 'user'}>
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
);
