import { NextRequest, NextResponse } from 'next/server';
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';

// Placeholder for IdP public certificate - replace with actual certificate
const idpCert = `-----BEGIN CERTIFICATE-----
REPLACE_WITH_IDP_PUBLIC_CERTIFICATE
-----END CERTIFICATE-----`;

// Placeholder for IdP entry point (login URL) - replace with actual URL
const idpEntryPoint = 'REPLACE_WITH_IDP_LOGIN_URL';
const idpIssuer = 'REPLACE_WITH_IDP_ISSUER_URL';

passport.use(
  new SamlStrategy(
    {
      path: '/api/auth/saml',
      entryPoint: idpEntryPoint,
      issuer: 'http://localhost:3000/api/auth/saml/metadata', // Our SP issuer
      cert: idpCert, // IdP's public certificate
      callbackUrl: 'http://localhost:3000/api/auth/saml', // ACS URL
      // Other options like audience, privateKey for decryption (if needed)
    },
    (profile: any, done: any) => {
      // For now, log the user profile to the console
      console.log('SAML Profile:', profile);
      // In a real application, you would find or create a user based on the profile
      return done(null, profile);
    }
  )
);

// Initialize passport (typically done once in your app setup)
// For Next.js API routes, we might need to ensure it's initialized per request or globally.
// This is a simplified example.
// This file now ONLY handles the ACS POST request.
// Metadata is served from /api/auth/saml/metadata/route.ts
// Login initiation is handled by /api/auth/saml/login/route.ts

if (!passport._strategy('saml')) {
  console.log("ACS route: SAML strategy not found, attempting to initialize.");
  // Avoid re-registering strategy if hot-reloading.
  // Initialization logic should be consistent across all saml routes.
  passport.use(
    new SamlStrategy(
      {
        path: '/api/auth/saml', // This is the path this route handles for SAML assertions
        entryPoint: idpEntryPoint, // Must be defined (even if placeholder)
        issuer: 'http://localhost:3000/api/auth/saml/metadata',
        cert: idpCert, // Must be defined (even if placeholder)
        callbackUrl: 'http://localhost:3000/api/auth/saml',
      },
      (profile: any, done: any) => {
        console.log('SAML Profile (ACS):', profile);
        return done(null, profile);
      }
    )
  );
  passport.initialize();
  console.log("ACS route: SAML strategy initialized.");
} else {
  console.log("ACS route: SAML strategy already initialized.");
}


export async function POST(req: NextRequest) {
  // This is the Assertion Consumer Service (ACS) endpoint.
  // It processes the SAML assertion sent by the IdP.
  console.log("POST /api/auth/saml (ACS) called");

  return new Promise((resolve, reject) => {
    const mockRes = {
      redirect: (url: string) => {
        // ACS should not typically redirect, but handle the POST and respond.
        console.warn(`ACS trying to redirect to ${url}, this is unusual.`);
        resolve(NextResponse.redirect(url));
      },
      setHeader: (name: string, value: string) => { /* Next.js handles this in NextResponse */ },
      status: (statusCode: number) => ({
        send: (body: any) => resolve(NextResponse.json(body, { status: statusCode })),
        end: () => resolve(NextResponse.json({}, { status: statusCode }))
      }),
      send: (body: any) => resolve(NextResponse.json(body)),
      end: (data?: any) => {
        // If passport calls res.end() without data, resolve with a success if no error.
        // This path might be taken if the strategy handles the response itself.
        console.log("ACS mockRes.end() called with data:", data);
        resolve(NextResponse.json( data || { message: "SAML processing ended." }));
      }
    };

    try {
      const authenticate = passport.authenticate('saml', { session: false }, (err: any, user: any, info: any) => {
        if (err) {
          console.error('SAML Authentication Error (ACS):', err);
          return resolve(NextResponse.json({ error: 'SAML Authentication Failed', details: err.message || (err.stack ? err.stack.split('\n')[0] : 'Unknown error') }, { status: 500 }));
        }
        if (!user) {
          console.error('SAML Authentication Failed (ACS): No user profile returned.', info);
          return resolve(NextResponse.json({ error: 'SAML Authentication Failed', details: info?.message || 'No user profile.' }, { status: 401 }));
        }
        console.log('SAML Authentication Successful (ACS), Profile:', user);
        // In a real app, you'd establish a session (e.g., using cookies or a JWT)
        // For now, just returning the user profile.
        return resolve(NextResponse.json({ message: 'SAML Assertion Consumed Successfully', user }));
      });

      (authenticate as any)(req, mockRes, (errorFromMiddlewareNext: any) => {
        if (errorFromMiddlewareNext) {
          console.error("Error passed to 'next' function in passport.authenticate (ACS):", errorFromMiddlewareNext);
          return resolve(NextResponse.json({ error: 'Internal Server Error during SAML processing', details: errorFromMiddlewareNext.message }, { status: 500 }));
        }
        // If 'next' is called without error, it might mean the response is already sent by the strategy
        // or there's an issue. Given our mockRes, a response should have been resolved already.
        console.log("'Next' callback in ACS reached without error, assuming response handled.");
      });

    } catch (e) {
      console.error("Exception when calling passport.authenticate for ACS:", e);
      resolve(NextResponse.json({ error: "SAML ACS processing exception", details: (e as Error).message }, { status: 500 }));
    }
  });
}

// Helper to ensure passport is initialized (though above check might be enough)
// Redundant due to the check at the top of the file, but harmless.
function ensurePassportInitialized() {
  if (!passport._strategy('saml')) {
    // This block should ideally not be reached if the top-level check works.
    console.warn("ensurePassportInitialized called and strategy was not found - this might indicate an issue.");
    passport.initialize();
  }
}

// Call it once when the module loads, or ensure it's called before strategy use.
ensurePassportInitialized();
