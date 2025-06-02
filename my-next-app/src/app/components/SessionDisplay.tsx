"use client";

import { useSession } from "next-auth/react";

export default function SessionDisplay() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading session information...</p>;
  }

  if (status === "unauthenticated") {
    return <p>You are not authenticated. Please log in.</p>;
  }

  if (session) {
    return (
      <div>
        <h2>Current Session Information</h2>
        <p>
          <strong>User:</strong> {session.user?.name || session.user?.email || "N/A"}
        </p>
        <p>
          <strong>User ID (from token.sub):</strong> {session.user?.id || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {session.user?.email || "N/A"}
        </p>
        <p>
          <strong>Expires:</strong> {session.expires ? new Date(session.expires).toLocaleString() : "N/A"}
        </p>
        <h3>Tokens (for demonstration - handle with care):</h3>
        <pre style={{ background: "#f0f0f0", padding: "10px", overflowX: "auto" }}>
          {JSON.stringify({ accessToken: session.accessToken, idToken: session.idToken }, null, 2)}
        </pre>
        <details>
          <summary>Full Session Object (for debugging)</summary>
          <pre style={{ background: "#f0f0f0", padding: "10px", overflowX: "auto" }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return <p>No active session.</p>;
}
