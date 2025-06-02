import { NextRequest, NextResponse } from 'next/server';

const SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_LIST_RESPONSE_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

// In-memory store for users (for stubbing purposes)
const usersDB: any = {};
let nextUserId = 1;

async function parseBody(req: NextRequest) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const userId = params.params?.[0];
  const queryParams = req.nextUrl.searchParams;
  console.log(`SCIM Users GET request: Path: ${req.nextUrl.pathname}, ID: ${userId}, Query: ${queryParams}`);

  if (userId) {
    // Get user by ID
    const user = usersDB[userId];
    if (user) {
      console.log(`SCIM Users GET: Found user ${userId}`, user);
      return NextResponse.json(user, { status: 200 });
    } else {
      console.log(`SCIM Users GET: User ${userId} not found`);
      return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User not found' }, { status: 404 });
    }
  } else {
    // List users
    // Basic filtering support for userName eq (as per many IdP checks)
    const filter = queryParams.get('filter');
    let resources = Object.values(usersDB);

    if (filter && filter.includes('userName eq')) {
        const userNameToFilter = filter.split('userName eq "')[1]?.slice(0, -1);
        if (userNameToFilter) {
            resources = resources.filter((user: any) => user.userName === userNameToFilter);
        }
    }

    console.log(`SCIM Users GET: Listing users. Count: ${resources.length}`);
    return NextResponse.json({
      schemas: [SCIM_LIST_RESPONSE_SCHEMA],
      totalResults: resources.length,
      startIndex: 1,
      itemsPerPage: resources.length,
      Resources: resources,
    }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  console.log(`SCIM Users POST request: Path: ${req.nextUrl.pathname}, Body:`, body);

  if (!body || !body.userName) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Missing userName' }, { status: 400 });
  }

  // Check if user already exists (based on userName for simplicity)
  const existingUser = Object.values(usersDB).find((u: any) => u.userName === body.userName);
  if (existingUser) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "uniqueness", detail: 'User with this userName already exists' }, { status: 409 });
  }

  const newUser = {
    schemas: [SCIM_USER_SCHEMA],
    id: String(nextUserId++),
    userName: body.userName,
    name: body.name || { givenName: "Test", familyName: "User" },
    emails: body.emails || [{ primary: true, value: `${body.userName}@example.com`, type: "work" }],
    active: body.active !== undefined ? body.active : true,
    meta: {
      resourceType: "User",
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      location: `/scim/v2/Users/${nextUserId -1}`,
    },
  };
  usersDB[newUser.id] = newUser;

  console.log("SCIM Users POST: Created new user:", newUser);
  return NextResponse.json(newUser, { status: 201, headers: { Location: newUser.meta.location } });
}

export async function PUT(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const userId = params.params?.[0];
  const body = await parseBody(req);
  console.log(`SCIM Users PUT request: Path: ${req.nextUrl.pathname}, ID: ${userId}, Body:`, body);

  if (!userId) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User ID missing in path' }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Request body is missing or invalid' }, { status: 400 });
  }

  let existingUser = usersDB[userId];
  if (!existingUser) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User not found' }, { status: 404 });
  }

  // Simple full update - replace user object, keeping ID and meta
  // A real implementation needs to handle partial updates (PATCH) and specific attribute replacements.
  const updatedUser = {
    ...existingUser, // Keep original ID, meta.created
    ...body, // Apply updates from body
    id: userId, // Ensure ID is not changed
    meta: {
      ...existingUser.meta,
      lastModified: new Date().toISOString(),
    },
  };
  usersDB[userId] = updatedUser;

  console.log("SCIM Users PUT: Updated user:", updatedUser);
  return NextResponse.json(updatedUser, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: { params?: string[] } }) {
    const userId = params.params?.[0];
    const body = await parseBody(req);
    console.log(`SCIM Users PATCH request: Path: ${req.nextUrl.pathname}, ID: ${userId}, Body:`, body);

    if (!userId) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User ID missing in path' }, { status: 400 });
    }
    if (!body || !body.Operations || !Array.isArray(body.Operations)) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Invalid PATCH request body' }, { status: 400 });
    }

    let user = usersDB[userId];
    if (!user) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User not found' }, { status: 404 });
    }

    // Basic PATCH operations (add, replace, remove for 'active' and 'members')
    // This is a very simplified stub. A full SCIM PATCH is complex.
    body.Operations.forEach((op: any) => {
        if (op.op && typeof op.op === 'string') {
            op.op = op.op.toLowerCase();
        }

        // Example: Patching user's active status
        // { "op": "Replace", "path": "active", "value": false }
        // { "op": "Replace", "value": { "active": false } }
        if (op.path === "active" || (op.path === undefined && op.value && op.value.active !== undefined)) {
            const value = op.path === "active" ? op.value : op.value.active;
            if (op.op === "replace" || op.op === "add") { // 'add' can act like 'replace' for single-value attributes
                user.active = value;
            }
        }
        // Add more operations here, e.g., for emails, name, etc.
    });

    user.meta.lastModified = new Date().toISOString();
    usersDB[userId] = user;

    console.log("SCIM Users PATCH: Updated user:", user);
    return NextResponse.json(user, { status: 200 });
}


export async function DELETE(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const userId = params.params?.[0];
  console.log(`SCIM Users DELETE request: Path: ${req.nextUrl.pathname}, ID: ${userId}`);

  if (!userId) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User ID missing in path' }, { status: 400 });
  }

  if (usersDB[userId]) {
    delete usersDB[userId];
    console.log(`SCIM Users DELETE: Deleted user ${userId}`);
    return new NextResponse(null, { status: 204 }); // No content
  } else {
    console.log(`SCIM Users DELETE: User ${userId} not found`);
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'User not found' }, { status: 404 });
  }
}

// Fallback for other methods
export async function defaultHandler(req: NextRequest) {
  console.warn(`SCIM Users: Method ${req.method} not implemented for ${req.nextUrl.pathname}`);
  return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: `Method ${req.method} not supported.` }, { status: 405 });
}
