# Next.js Multi-Authentication Example App

This Next.js application demonstrates implementations of SAML, OIDC (with Okta via NextAuth.js), and SCIM 2.0 provisioning endpoints.

## General Setup

1.  **Clone the repository.**
2.  **Navigate to the application directory:**
    ```bash
    cd my-next-app
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Variables:** Some authentication methods require environment variables. Copy the `.env.local.example` file (if one exists, otherwise create `.env.local`) and populate it as per the instructions in the relevant sections below.
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:3000`.

**Note on URL Paths and Locales:** This application uses a `[locale]` structure (e.g., `/en/...`, `/fr/...`). For simplicity, most URLs in this README are shown without a locale prefix (e.g., `/login/saml`). Depending on your setup and default locale, you may need to include a locale prefix in the path (e.g., `http://localhost:3000/en/login/saml`).

---

## SAML Configuration (using `passport-saml`)

This section details how to set up SAML Single Sign-On.

## SAML Configuration

To enable SAML authentication, you need to configure your Identity Provider (IdP) and update the application with your IdP's details.

### Service Provider (SP) Details

Your application (the Service Provider) exposes the following SAML endpoints:

-   **Assertion Consumer Service (ACS) URL:** `http://localhost:3000/api/auth/saml`
    *   This is the URL your IdP will send SAML assertions to.
-   **SP Metadata URL:** `http://localhost:3000/api/auth/saml/metadata`
    *   This URL provides the SP metadata XML, which you might need to upload or provide to your IdP. It includes the SP's entity ID, ACS URL, and any public certificates for signing or encryption (if configured).
-   **SP Entity ID (Issuer):** `http://localhost:3000/api/auth/saml/metadata` (This is also the metadata URL by default in this setup)

### Identity Provider (IdP) Configuration

Configuration requires updating placeholders directly in the SAML strategy code. These are found in:
*   `my-next-app/src/app/api/auth/saml/route.ts` (for ACS)
*   `my-next-app/src/app/api/auth/saml/login/route.ts` (for login initiation)
*   `my-next-app/src/app/api/auth/saml/metadata/route.ts` (for metadata generation)

**Specifically, update these placeholders:**

1.  `REPLACE_WITH_IDP_LOGIN_URL`: This is the Single Sign-On (SSO) URL of your IdP where the application will redirect users for authentication.
2.  `REPLACE_WITH_IDP_PUBLIC_CERTIFICATE`: This is the public X.509 certificate of your IdP, used by the application to verify the signature of SAML assertions. It should be the content of the certificate file, often in PEM format.
3.  `REPLACE_WITH_IDP_ISSUER_URL`: This is the entity ID or issuer URL of your IdP.

These values are typically found in your IdP's metadata file.

### Setting up Okta as a SAML IdP (Example)

1.  **In your Okta Developer Console:**
    *   Navigate to **Applications** > **Applications**.
    *   Click **Create App Integration**.
    *   Select **SAML 2.0** as the sign-in method. Click **Next**.
    *   **App name:** Give it a name (e.g., "My Next.js SAML App"). Click **Next**.

2.  **Configure SAML Settings:**
    *   **Single sign on URL (ACS URL):** `http://localhost:3000/api/auth/saml`
    *   **Audience URI (SP Entity ID):** `http://localhost:3000/api/auth/saml/metadata` (Matches our SP metadata URL/issuer)
    *   **Default RelayState:** Leave blank or as needed.
    *   **Name ID format:** Select `EmailAddress` or as appropriate for your application.
    *   **Application username:** Select `Email` or as appropriate.
    *   *(Optional)* Configure attribute statements if your application requires them.
    *   Click **Next**.

3.  **Feedback:** Select "I'm an Okta customer adding an internal app". Click **Finish**.

4.  **Obtain IdP Details:**
    *   After the app is created, you'll be on its "Sign On" tab.
    *   Look for a link or button like "**View SAML setup instructions**" or "**Identity Provider metadata**". Click it.
    *   From the provided information or metadata XML, you will find:
        *   **Identity Provider Single Sign-On URL:** This is your `REPLACE_WITH_IDP_LOGIN_URL` (for the `entryPoint` option in the SAML strategy).
        *   **Identity Provider Issuer:** This is your `REPLACE_WITH_IDP_ISSUER_URL` (for the `idpIssuer` option, though `passport-saml` often uses `issuer` for the SP and gets IdP issuer from metadata or `entryPoint`). Ensure the `issuer` in the strategy refers to *our* SP Entity ID. The IdP's issuer will be verified from the SAML assertion. The `idpIssuer` field in the strategy config can be used for this.
        *   **X.509 Certificate:** Download or copy the certificate. This is your `REPLACE_WITH_IDP_PUBLIC_CERTIFICATE`. Ensure it's the full certificate string, including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`.

5.  **Update Application Code:**
    *   Place the obtained values into the corresponding placeholders in the SAML strategy configuration files mentioned above.

### Example IdP Metadata XML (Generic)

Below is an example of what an IdP's metadata XML might look like. You will get a similar file from your SAML Identity Provider. You need to extract the `SingleSignOnService` URL (for `entryPoint`), the `X509Certificate` (for `cert`), and the `entityID` of the `EntityDescriptor` (for `idpIssuer`).

**This is only an example. DO NOT use it directly. Obtain the metadata from your actual IdP.**

```xml
<EntityDescriptor entityID="REPLACE_WITH_IDP_ISSUER_URL" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>
-----BEGIN CERTIFICATE-----
MIIC/jCCAeagAwIBAgIBADANBgkqhkiG9w0BAQsFADCBhjELMAkGA1UEBhMCVVMx
EzARBgNVBAgMCkNhbGlmb3JuaWExFDASBgNVBAcMC1NhbiBGcmFuY2lzY28xGTAX
BgNVBAoMEEV4YW1wbGUgT3JnYW5pY2UxGDAWBgNVBAsMD0V4YW1wbGUgSWRQIERl
... more certificate data ...
dHpDOVFnS3hqb01jVUR2c3R6Q1YrakZ0eWJ3PT0K
-----END CERTIFICATE-----
          </X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
    <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="REPLACE_WITH_IDP_LOGIN_URL_POST_BINDING"/>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="REPLACE_WITH_IDP_LOGIN_URL_REDIRECT_BINDING"/>
  </IDPSSODescriptor>
</EntityDescriptor>
```

**Instructions for placeholders in the code:**

*   `idpEntryPoint`: Use the `Location` URL from one of the `SingleSignOnService` elements (usually the HTTP-Redirect one for login initiation).
*   `idpCert`: Copy the content of the `X509Certificate` element, including the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` markers.
*   `idpIssuer`: Use the `entityID` from the `EntityDescriptor` element.

## Using SAML Authentication

*   **Login:** Navigate to `/login/saml` (e.g., `http://localhost:3000/en/login/saml`).
*   **SP Metadata:** Available at `/api/auth/saml/metadata`.
*   **ACS Endpoint:** `/api/auth/saml` (handles POST requests from IdP).

## Important Notes for SAML

*   **Security:** Ensure that your IdP certificate (`idpCert`) is correctly configured. In a production environment, consider using environment variables or a secure secret management system for these sensitive details instead of hardcoding them.
*   **HTTPS:** For production, SAML requires HTTPS for all communications. Ensure your application is served over HTTPS.
*   **Session Management:** This example logs the SAML profile to the console. In a real application, you would implement session management (e.g., using cookies, JWTs) to keep the user logged in.
*   **Error Handling:** Basic error handling is in place, but you may want to expand it for a production application.
*   **Passport Initialization:** The Passport.js strategy initialization is currently done in each SAML-related route file for simplicity in this example. In a larger application, centralize this initialization (e.g., in a `lib/passport.ts` or similar that runs once during application startup).

---

## OIDC Authentication (NextAuth.js with Okta)

This application also supports OIDC authentication using NextAuth.js, with Okta as the example provider.

### OIDC Configuration (Okta Example)

1.  **Set up an Okta Application:**
    *   Log in to your Okta Developer Console.
    *   Navigate to **Applications** > **Applications** and click **Create App Integration**.
    *   Select **OIDC - OpenID Connect** as the sign-in method.
    *   Select **Web Application** as the Application type. Click **Next**.
    *   **App integration name:** Give your application a name (e.g., "My Next.js App").
    *   **Grant type:** Ensure `Authorization Code` is checked. `Refresh Token` can also be enabled if needed.
    *   **Sign-in redirect URIs:** Add `http://localhost:3000/api/auth/callback/okta`
        *   This is the default callback URL NextAuth.js uses for providers. The `okta` part matches the provider ID.
    *   **Sign-out redirect URIs:** Add `http://localhost:3000/login/oidc` (or your desired post-logout page).
    *   **Assignments:** Assign the application to relevant users or groups.
    *   Save the application.

2.  **Obtain Okta Credentials:**
    *   After creating the application, you will find the **Client ID** and **Client secret** on the application's **General** tab.
    *   You will also need your Okta **Issuer URI**. This is typically found under **Security** > **API** in your Okta dashboard (e.g., `https://your-okta-domain.okta.com/oauth2/default`). Make sure it's the issuer for the authorization server you intend to use (e.g., 'default' or a custom one).

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root of the `my-next-app` directory (if it doesn't exist) and add the following variables:
    ```env
    OKTA_OIDC_CLIENT_ID="YOUR_OKTA_CLIENT_ID"
    OKTA_OIDC_CLIENT_SECRET="YOUR_OKTA_CLIENT_SECRET"
    OKTA_OIDC_ISSUER="YOUR_OKTA_ISSUER_URI"

    # Generate a random string for NEXTAUTH_SECRET (e.g., using `openssl rand -base64 32`)
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
    NEXTAUTH_URL="http://localhost:3000" # Or your production URL in production
    ```
    *   Replace `YOUR_OKTA_CLIENT_ID`, `YOUR_OKTA_CLIENT_SECRET`, and `YOUR_OKTA_ISSUER_URI` with your actual Okta application credentials.
    *   `NEXTAUTH_SECRET` is crucial for security in production. Generate a strong random string.
    *   `NEXTAUTH_URL` should be the base URL of your Next.js application. For local development, this is `http://localhost:3000`.

### Using OIDC Authentication

*   **Login Page:** Navigate to `http://localhost:3000/login/oidc`. Click the "Sign in with Okta (OIDC)" button.
*   **User Profile:** After successful authentication, you can view basic session information (including ID token and access token for demonstration) at `http://localhost:3000/profile`.
*   **API Route:** The NextAuth.js OIDC handler is located at `my-next-app/src/app/api/auth/[...nextauth]/route.ts`.

### Important Notes for OIDC:

*   **Environment Variables:** Ensure `OKTA_OIDC_CLIENT_ID`, `OKTA_OIDC_CLIENT_SECRET`, and `OKTA_OIDC_ISSUER` are correctly set in your environment.
*   **NEXTAUTH_SECRET:** Always use a strong, random string for `NEXTAUTH_SECRET` in production.
*   **HTTPS in Production:** For production deployments, ensure your `NEXTAUTH_URL` uses `https` and that your sign-in redirect URIs in Okta also use `https`.
*   **Okta Configuration:** The exact steps for Okta setup might vary slightly based on your Okta organization type (e.g., developer vs. enterprise) and any updates to their interface. Refer to the official Okta documentation for the most current guidance.
*   **Scopes:** By default, NextAuth.js requests `openid profile email` scopes. If you need additional scopes, you can configure them in the OktaProvider settings within `[...nextauth]/route.ts`.
*   **Session Handling:** NextAuth.js handles session management. The example `SessionDisplay.tsx` component and `/profile` page (e.g., `http://localhost:3000/en/profile`) show how to access session data.

---

## SCIM 2.0 Endpoints (Stub Implementation)

This application includes stub implementations for SCIM 2.0 User and Group provisioning endpoints. These are intended as a starting point for developing a full SCIM server.

### Endpoints

*   **Users:** `my-next-app/src/app/scim/v2/Users/[[...params]]/route.ts`
    *   Handles requests to `/scim/v2/Users` and `/scim/v2/Users/{id}`.
    *   Supports:
        *   `GET /scim/v2/Users`: Lists users. Supports basic `userName eq` filtering.
        *   `GET /scim/v2/Users/{id}`: Retrieves a user by ID.
        *   `POST /scim/v2/Users`: Creates a new user. Checks for `userName` uniqueness.
        *   `PUT /scim/v2/Users/{id}`: Updates a user by ID (full replace).
        *   `PATCH /scim/v2/Users/{id}`: Partially updates a user. Stubbed for basic operations like modifying the `active` status.
        *   `DELETE /scim/v2/Users/{id}`: Deletes a user by ID.
*   **Groups:** `my-next-app/src/app/scim/v2/Groups/[[...params]]/route.ts`
    *   Handles requests to `/scim/v2/Groups` and `/scim/v2/Groups/{id}`.
    *   Supports:
        *   `GET /scim/v2/Groups`: Lists groups. Supports basic `displayName eq` filtering.
        *   `GET /scim/v2/Groups/{id}`: Retrieves a group by ID.
        *   `POST /scim/v2/Groups`: Creates a new group. Checks for `displayName` uniqueness.
        *   `PUT /scim/v2/Groups/{id}`: Updates a group by ID (full replace).
        *   `PATCH /scim/v2/Groups/{id}`: Partially updates a group. Stubbed for basic member management and `displayName` changes.
        *   `DELETE /scim/v2/Groups/{id}`: Deletes a group by ID.

### Implementation Details

*   **In-Memory Store:** The SCIM endpoints currently use a simple in-memory JavaScript object (`usersDB` and `groupsDB`) to store data. This data will be lost when the server restarts.
*   **Stubbed Functionality:**
    *   Many SCIM features like complex filtering, sorting, pagination (beyond basic totalResults), and comprehensive PATCH operations are only minimally implemented or return a `501 Not Implemented` status.
    *   Error handling is basic.
    *   Schema validation is minimal.
*   **Authentication/Authorization:** These SCIM endpoints **do not currently implement any authentication or authorization**. In a production environment, you **MUST** secure these endpoints appropriately (e.g., using OAuth bearer tokens, API keys, or other standard mechanisms).
*   **Logging:** Requests to these endpoints (method, path, body) are logged to the console.

### Further Development

To develop these into a production-ready SCIM server, you would need to:
1.  Replace the in-memory store with a persistent database.
2.  Implement robust authentication and authorization.
3.  Fully implement SCIM schema validation, filtering, pagination, sorting, and complex PATCH operations.
4.  Add comprehensive error handling and logging.
5.  Consider rate limiting and other security best practices.

---

## SAML Metadata Test Script

This project includes a basic test script to validate the SAML Service Provider (SP) metadata endpoint.

### Running the SAML Metadata Test

1.  **Ensure the development server is running** (see "General Setup").
2.  **Run the test script from the root project directory:**
    ```bash
    npm run test:saml --prefix my-next-app
    ```
    Or, from the `my-next-app` directory:
    ```bash
    npm run test:saml
    # or by directly executing: node test-saml.js
    ```

### What the SAML Test Validates

The `test-saml.js` script performs the following checks on the `http://localhost:3000/api/auth/saml/metadata` endpoint:

*   **Status Code:** Verifies that the endpoint returns a `200 OK` status.
*   **Content-Type Header:** Checks if the `Content-Type` header is `application/xml` or `text/xml`.
*   **Basic XML Content:** Confirms the presence of essential SAML metadata tags like `<md:EntityDescriptor>` (or `<EntityDescriptor>`) and `<md:SPSSODescriptor>` (or `<SPSSODescriptor>`) in the response body using simple string inclusion checks.

### Limitations

*   **No XML Schema Validation:** The script does not perform a full XML schema validation. It only checks for the presence of certain substrings.
*   **No Cryptographic Validation:** It does not validate any signatures or encryption details within the metadata.
*   **Does Not Test Assertion Flow:** This script **only** tests the metadata endpoint. It does not simulate a full SAML login flow, IdP interaction, or assertion consumption by the ACS endpoint.
*   **Network Dependent:** Requires the Next.js development server to be running and accessible at `http://localhost:3000`.