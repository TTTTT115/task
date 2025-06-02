import NextAuth from 'next-auth';
import OktaProvider from 'next-auth/providers/okta';

export const authOptions = {
  providers: [
    OktaProvider({
      clientId: process.env.OKTA_OIDC_CLIENT_ID as string,
      clientSecret: process.env.OKTA_OIDC_CLIENT_SECRET as string,
      issuer: process.env.OKTA_OIDC_ISSUER as string,
      // Ensure the authorization server is correctly configured in Okta
      // and the issuer URL points to it.
      // Example issuer: https://your-okta-domain.okta.com/oauth2/default
    }),
    // Add other providers here if needed
  ],
  callbacks: {
    async jwt({ token, account }: { token: any; account: any }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token; // Persist the ID token
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Send properties to the client, like an access_token and id_token from JWT
      session.accessToken = token.accessToken;
      session.idToken = token.idToken; // Add ID token to session
      session.user.id = token.sub; // Add user ID (subject) to session user object
      return session;
    },
  },
  // Enable debug messages in the console if you are having problems
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET, // A random string used to hash tokens, sign cookies and generate cryptographic keys.
  // pages: { // Optional: Customize NextAuth.js pages
  //   signIn: '/login/oidc', // Redirect users to this page for sign-in
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  // },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
