"use client"; // Required for event handlers

import { useRouter } from 'next/navigation';

export default function SamlLoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // This will redirect the user to the IdP.
    // The SAML strategy configured on the server-side (/api/auth/saml)
    // has an 'entryPoint' which is the IdP's login URL.
    // Passport's authenticate middleware (when not handling a POST) will redirect.
    // We need a way to trigger this redirection from the client.
    // Typically, the server would handle the redirect when a protected route is accessed
    // or a specific login URL is hit on the server that then calls passport.authenticate.

    // For a client-initiated login, we can have a specific API route
    // that calls passport.authenticate('saml') which then redirects.
    // Let's assume we will create such a route e.g., /api/auth/saml/login

    router.push('/api/auth/saml/login'); // This route will trigger SAML flow
  };

  return (
    <div>
      <h1>SAML Login</h1>
      <p>Click the button below to log in via SAML.</p>
      <button onClick={handleLogin}>Login with SAML</button>
    </div>
  );
}
