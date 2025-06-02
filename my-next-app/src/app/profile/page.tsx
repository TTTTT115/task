import SessionDisplay from "../components/SessionDisplay"; // Adjust path as needed
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div>
      <h1>User Profile</h1>
      <SessionDisplay />
      <br />
      <Link href="/">Go to Home</Link>
      <br />
      <Link href="/login/oidc">Go to OIDC Login Page</Link>
    </div>
  );
}
