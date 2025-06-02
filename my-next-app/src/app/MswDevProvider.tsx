'use client';

import React, { useEffect, useState } from 'react';

export default function MswDevProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function initMsw() {
      if (process.env.NODE_ENV === 'development') {
        const { worker } = await import('@/mocks/browser'); // Use alias
        // Start the worker
        // Specify onUnhandledRequest: 'bypass' to allow unhandled requests to pass through
        await worker.start({
          onUnhandledRequest: 'bypass',
          quiet: true // Suppress console logs about MSW activation
        });
        console.log('MSW worker started for development.');
        setMswReady(true);
      } else {
        // In non-development environments, or if MSW is not needed,
        // immediately mark as "ready" to render children.
        setMswReady(true);
      }
    }

    if (typeof window !== 'undefined') { // Ensure it runs only in the browser
      initMsw();
    } else {
      // If not in browser (e.g. during SSR build), mark as ready.
      setMswReady(true);
    }
  }, []);

  // Render children only after MSW is ready (or determined not to run)
  // This prevents rendering components that might make API calls before MSW is active.
  if (!mswReady && process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return null; // Or a loading spinner, etc.
  }

  return <>{children}</>;
}
