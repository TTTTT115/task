import { NextRequest, NextResponse } from 'next/server';
import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';

// This file serves the Service Provider (SP) metadata XML.

// Ensure passport and SAML strategy are initialized.
// This configuration should be identical to the one used in ACS and Login routes.
if (!passport._strategy('saml')) {
  console.log("Metadata route: SAML strategy not found, attempting to initialize.");
  const idpCert = `-----BEGIN CERTIFICATE-----
REPLACE_WITH_IDP_PUBLIC_CERTIFICATE
-----END CERTIFICATE-----`;
  const idpEntryPoint = 'REPLACE_WITH_IDP_LOGIN_URL';
  const idpIssuer = 'REPLACE_WITH_IDP_ISSUER_URL';

  passport.use(
    new SamlStrategy(
      {
        path: '/api/auth/saml', // ACS URL path where IdP sends assertions
        entryPoint: idpEntryPoint, // IdP's SSO URL
        issuer: 'http://localhost:3000/api/auth/saml/metadata', // Our SP's entity ID
        cert: idpCert, // IdP's public signing certificate
        callbackUrl: 'http://localhost:3000/api/auth/saml', // Full ACS URL
        // decryptionPvk: "REPLACE_WITH_YOUR_SP_PRIVATE_KEY_FOR_DECRYPTION", // If you need to decrypt assertions
        // privateKey: "REPLACE_WITH_YOUR_SP_PRIVATE_KEY_FOR_SIGNING_AUTHNREQUESTS", // If you sign AuthnRequests
      },
      (profile: any, done: any) => {
        // This callback is for processing the SAML assertion, not directly used by metadata generation.
        console.log('SAML Profile (from metadata route context, should not be called here):', profile);
        return done(null, profile);
      }
    )
  );
  passport.initialize();
  console.log("Metadata route: SAML strategy initialized.");
} else {
  console.log("Metadata route: SAML strategy already initialized.");
}

export async function GET(req: NextRequest) {
  console.log("GET /api/auth/saml/metadata called");
  const strategy = passport._strategy('saml') as SamlStrategy;
  if (!strategy) {
    console.error("SAML strategy not initialized when trying to generate metadata.");
    return NextResponse.json({ error: 'SAML strategy not initialized' }, { status: 500 });
  }

  try {
    // The generateServiceProviderMetadata method may require the decryption public cert
    // and signing public cert if you've configured private keys for those operations.
    // For this example, we assume no specific SP signing/decryption certs are passed here,
    // meaning either they are not used or the strategy handles them internally if configured.
    // If you use SP signing or encryption, you might need to pass:
    // - strategy.generateServiceProviderMetadata(decryptionCert, signingCert)
    //   where decryptionCert and signingCert are the public keys corresponding to
    //   decryptionPvk and privateKey configured in the strategy.
    // For now, passing null as per typical examples when these are not explicitly managed here.
    // @ts-ignore // passport-saml types might not expose this directly or clearly
    const metadata = strategy.generateServiceProviderMetadata(null, null);

    return new NextResponse(metadata, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error("Error generating SAML SP metadata:", error);
    return NextResponse.json({ error: 'Failed to generate SAML metadata', details: (error as Error).message }, { status: 500 });
  }
}
