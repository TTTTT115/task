"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';

export default function OidcLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div>
        <h1>OIDC Login</h1>
        <p>Welcome, {session.user?.name || session.user?.email}!</p>
        <p>You are already signed in.</p>
        <button onClick={() => router.push('/profile')}>View Profile (Session)</button>
        <br />
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <h1>OIDC Login</h1>
      <p>You are not signed in.</p>
      {/* Using "okta" as the provider ID, as configured in [...nextauth]/route.ts */}
      <button onClick={() => signIn("okta")}>Sign in with Okta (OIDC)</button>
    </div>
  );
}
