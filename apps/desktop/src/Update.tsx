import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { z } from 'zod';
import { installDesktopPlatform } from '@ValenceDesktop/platform/installDesktopPlatform';
import { UpdateWindow } from '@ValenceScreens/components/UpdateWindow/UpdateWindow';
import './styles/main.css';

const AskedSchema = z.object({
  step: z.enum(['installing', 'finishing']).catch('installing'),
  version: z.string().max(64).catch(''),
});

installDesktopPlatform();

const container = document.querySelector('#root');

if (container === null) {
  throw new Error('Root container #root is missing from update.html');
}

const asked = AskedSchema.parse(Object.fromEntries(new URLSearchParams(window.location.search)));

createRoot(container).render(
  <StrictMode>
    <UpdateWindow step={asked.step} version={asked.version} />
  </StrictMode>,
);
