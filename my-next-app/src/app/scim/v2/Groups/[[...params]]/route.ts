import { NextRequest, NextResponse } from 'next/server';

const SCIM_GROUP_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:Group';
const SCIM_LIST_RESPONSE_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';

// In-memory store for groups (for stubbing purposes)
const groupsDB: any = {};
let nextGroupId = 1;

async function parseBody(req: NextRequest) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const groupId = params.params?.[0];
  const queryParams = req.nextUrl.searchParams;
  console.log(`SCIM Groups GET request: Path: ${req.nextUrl.pathname}, ID: ${groupId}, Query: ${queryParams}`);

  if (groupId) {
    // Get group by ID
    const group = groupsDB[groupId];
    if (group) {
      console.log(`SCIM Groups GET: Found group ${groupId}`, group);
      return NextResponse.json(group, { status: 200 });
    } else {
      console.log(`SCIM Groups GET: Group ${groupId} not found`);
      return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group not found' }, { status: 404 });
    }
  } else {
    // List groups
    // Basic filtering support for displayName eq
    const filter = queryParams.get('filter');
    let resources = Object.values(groupsDB);

    if (filter && filter.includes('displayName eq')) {
        const displayNameToFilter = filter.split('displayName eq "')[1]?.slice(0, -1);
        if (displayNameToFilter) {
            resources = resources.filter((group: any) => group.displayName === displayNameToFilter);
        }
    }

    console.log(`SCIM Groups GET: Listing groups. Count: ${resources.length}`);
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
  console.log(`SCIM Groups POST request: Path: ${req.nextUrl.pathname}, Body:`, body);

  if (!body || !body.displayName) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Missing displayName' }, { status: 400 });
  }

  const existingGroup = Object.values(groupsDB).find((g: any) => g.displayName === body.displayName);
  if (existingGroup) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], scimType: "uniqueness", detail: 'Group with this displayName already exists' }, { status: 409 });
  }

  const newGroup = {
    schemas: [SCIM_GROUP_SCHEMA],
    id: String(nextGroupId++),
    displayName: body.displayName,
    members: body.members || [], // Validate member format if necessary
    meta: {
      resourceType: "Group",
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      location: `/scim/v2/Groups/${nextGroupId - 1}`,
    },
  };
  groupsDB[newGroup.id] = newGroup;

  console.log("SCIM Groups POST: Created new group:", newGroup);
  return NextResponse.json(newGroup, { status: 201, headers: { Location: newGroup.meta.location } });
}

export async function PUT(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const groupId = params.params?.[0];
  const body = await parseBody(req);
  console.log(`SCIM Groups PUT request: Path: ${req.nextUrl.pathname}, ID: ${groupId}, Body:`, body);

  if (!groupId) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group ID missing in path' }, { status: 400 });
  }
   if (!body) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Request body is missing or invalid' }, { status: 400 });
  }

  let existingGroup = groupsDB[groupId];
  if (!existingGroup) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group not found' }, { status: 404 });
  }

  // Simple full update - replace group object, keeping ID and meta
  const updatedGroup = {
    ...existingGroup,
    ...body,
    id: groupId, // Ensure ID is not changed
    meta: {
      ...existingGroup.meta,
      lastModified: new Date().toISOString(),
    },
  };
  groupsDB[groupId] = updatedGroup;

  console.log("SCIM Groups PUT: Updated group:", updatedGroup);
  return NextResponse.json(updatedGroup, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: { params?: string[] } }) {
    const groupId = params.params?.[0];
    const body = await parseBody(req);
    console.log(`SCIM Groups PATCH request: Path: ${req.nextUrl.pathname}, ID: ${groupId}, Body:`, body);

    if (!groupId) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group ID missing in path' }, { status: 400 });
    }
    if (!body || !body.Operations || !Array.isArray(body.Operations)) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Invalid PATCH request body' }, { status: 400 });
    }

    let group = groupsDB[groupId];
    if (!group) {
        return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group not found' }, { status: 404 });
    }

    // Basic PATCH operations for members
    // Example: { "op": "add", "path": "members", "value": [{"value": "userId1"}] }
    // Example: { "op": "remove", "path": "members[value eq \"userId1\"]" }
    // This is a very simplified stub. A full SCIM PATCH for groups is complex.
    body.Operations.forEach((op: any) => {
        if (op.op && typeof op.op === 'string') {
            op.op = op.op.toLowerCase();
        }

        if (op.path === "members" || op.path?.startsWith("members[")) {
            const membersValue = op.value; // Can be an array or single object

            if (op.op === "add") {
                if (Array.isArray(membersValue)) {
                    membersValue.forEach(member => group.members.push(member));
                } else if (membersValue) {
                    group.members.push(membersValue);
                }
            } else if (op.op === "remove") {
                if (op.path?.includes("[")) { // e.g. members[value eq "userId1"]
                    const userIdToRemove = op.path.split('value eq "')[1]?.slice(0, -2);
                    if (userIdToRemove) {
                        group.members = group.members.filter((m: any) => m.value !== userIdToRemove);
                    }
                } else { // remove all members if no specific path
                   // This case is not typical for specific member removal, usually for clearing all.
                   // Or if op.value provides specific members to remove (more complex logic).
                   // For a simple stub, we might ignore general "remove" on "members" path without specific value matching.
                }
            } else if (op.op === "replace") {
                 // If path is "members", SCIM expects the entire members array to be replaced by op.value
                 if (op.path === "members" && Array.isArray(op.value)) {
                    group.members = op.value;
                 }
            }
        }
        // Add other operations like replacing displayName etc.
        if (op.path === "displayName" && (op.op === "replace" || op.op === "add")) {
            group.displayName = op.value;
        }
    });

    group.meta.lastModified = new Date().toISOString();
    groupsDB[groupId] = group;

    console.log("SCIM Groups PATCH: Updated group:", group);
    return NextResponse.json(group, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: { params?: string[] } }) {
  const groupId = params.params?.[0];
  console.log(`SCIM Groups DELETE request: Path: ${req.nextUrl.pathname}, ID: ${groupId}`);

  if (!groupId) {
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group ID missing in path' }, { status: 400 });
  }

  if (groupsDB[groupId]) {
    delete groupsDB[groupId];
    console.log(`SCIM Groups DELETE: Deleted group ${groupId}`);
    return new NextResponse(null, { status: 204 }); // No content
  } else {
    console.log(`SCIM Groups DELETE: Group ${groupId} not found`);
    return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: 'Group not found' }, { status: 404 });
  }
}

// Fallback for other methods
export async function defaultHandler(req: NextRequest) {
  console.warn(`SCIM Groups: Method ${req.method} not implemented for ${req.nextUrl.pathname}`);
  return NextResponse.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: `Method ${req.method} not supported.` }, { status: 405 });
}
