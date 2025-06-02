import { NextRequest, NextResponse } from 'next/server';
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';

// This file handles the initiation of the SAML login flow.
// It will redirect the user to the Identity Provider (IdP).

// Make sure passport and the SAML strategy are initialized.
// Ideally, this initialization is done in a central place.
// For this example, we'll re-ensure it here, but in a larger app, refactor.

if (!passport._strategy('saml')) {
  console.log("Login route: SAML strategy not found, attempting to initialize.");
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
        path: '/api/auth/saml', // ACS URL path
        entryPoint: idpEntryPoint,
        issuer: 'http://localhost:3000/api/auth/saml/metadata', // Our SP issuer
        cert: idpCert, // IdP's public certificate
        callbackUrl: 'http://localhost:3000/api/auth/saml', // ACS URL
        // Other options like audience, privateKey for decryption (if needed)
      },
      (profile: any, done: any) => {
        console.log('SAML Profile (from login route context, should not be called here):', profile);
        return done(null, profile);
      }
    )
  );
  passport.initialize();
  console.log("Login route: SAML strategy initialized.");
} else {
  console.log("Login route: SAML strategy already initialized.");
}

export async function GET(req: NextRequest) {
  console.log("GET /api/auth/saml/login called");
  return new Promise((resolve, reject) => {
    // Adapt Express middleware to Next.js API Route
    const mockRes = {
      redirect: (url: string) => {
        console.log(`Redirecting to IdP: ${url}`);
        resolve(NextResponse.redirect(url));
      },
      setHeader: (name: string, value: string) => {
        // NextResponse handles headers automatically in redirect
      },
      end: () => {
        // Should not be called for a redirect
        console.error("mockRes.end() called unexpectedly in SAML login initiation");
        resolve(NextResponse.json({ error: "Login initiation failed" }, { status: 500 }));
      },
      status: (statusCode: number) => ({ // Added to handle potential errors from passport.authenticate
        send: (body: any) => {
            console.error("mockRes.status.send called in SAML login", body);
            resolve(NextResponse.json(body, { status: statusCode }));
        },
        end: () => {
            console.error("mockRes.status.end called in SAML login");
            resolve(NextResponse.json({}, { status: statusCode }));
        }
      }),
    };

    // `passport.authenticate` when called for SAML without a request from IdP (i.e., not an ACS request)
    // will generate the SAML AuthnRequest and redirect the user to the IdP.
    try {
      const authenticate = passport.authenticate('saml', {
        session: false,
        // Additional SAML options if needed for AuthnRequest, e.g.
        // samlFallback: 'login-request', // Or other options
        // forceAuthn: true, // If you want to force re-authentication
      });

      (authenticate as any)(req, mockRes, (err: any) => {
        // This callback is typically for errors in the middleware chain itself,
        // not for the redirect functionality.
        if (err) {
          console.error('Error during SAML authentication initiation:', err);
          resolve(NextResponse.json({ error: 'SAML login initiation failed', details: err.message }, { status: 500 }));
        } else {
          // This part should ideally not be reached if a redirect occurs.
          // If it is, it means passport.authenticate didn't redirect.
          console.warn("/api/auth/saml/login: passport.authenticate finished without redirecting or erroring.");
          resolve(NextResponse.json({ error: "SAML login did not initiate redirect as expected." }, { status: 500 }));
        }
      });
    } catch (e) {
      console.error("Exception when calling passport.authenticate for login:", e);
      resolve(NextResponse.json({ error: "SAML login initiation exception", details: (e as Error).message }, { status: 500 }));
    }
  });
}
