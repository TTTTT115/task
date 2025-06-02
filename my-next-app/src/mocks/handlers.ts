import { graphql, HttpResponse } from 'msw';

// Define the Task type similar to GraphQL schema for clarity
interface MockTask {
  id: string;
  title: string;
  assigneeId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Generate mock tasks
const mockTasks: MockTask[] = Array.from({ length: 15 }, (_, i) => {
  const id = (i + 1).toString();
  const statusOptions: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  const now = new Date();
  const createdAt = new Date(now.setDate(now.getDate() - (15 - i))).toISOString();
  const updatedAt = new Date(now.setDate(now.getDate() + i % 3)).toISOString(); // Vary updatedAt
  const deadline = new Date(now.setDate(now.getDate() + i * 2)).toISOString().split('T')[0]; // Future deadline

  return {
    id,
    title: `Task ${id}: Implement feature ${id}`,
    assigneeId: (i % 5 === 0) ? undefined : `user_${(i % 3) + 1}`, // Some tasks unassigned
    status: statusOptions[i % statusOptions.length],
    deadline: (i % 4 === 0) ? undefined : deadline, // Some tasks without deadline
    createdAt,
    updatedAt,
  };
});

export const handlers = [
  graphql.query('GetTasks', ({ /* query, */ variables }) => { // Commented out query
    // Basic parsing of 'first' and 'after' from variables.
    // A more robust solution would parse the actual query AST if needed.
    const first = variables.first || 5;
    const afterCursor = variables.after;

    let startIndex = 0;
    if (afterCursor) {
      // For this mock, cursor is base64 encoded index `cursor:${index}`
      try {
        const decodedCursor = Buffer.from(afterCursor, 'base64').toString('ascii');
        if (decodedCursor.startsWith('cursor:')) {
          const idx = parseInt(decodedCursor.split(':')[1], 10);
          if (!isNaN(idx)) {
            startIndex = idx + 1;
          }
        }
      } catch (e) {
        console.error("Failed to decode cursor:", afterCursor, e);
        // Potentially return an error response or default to first page
      }
    }

    const endIndex = Math.min(startIndex + first, mockTasks.length);
    const paginatedTasks = mockTasks.slice(startIndex, endIndex);

    const edges = paginatedTasks.map((task, indexInSlice) => ({
      node: task,
      cursor: Buffer.from(`cursor:${startIndex + indexInSlice}`).toString('base64'),
    }));

    const pageInfo = {
      hasNextPage: endIndex < mockTasks.length,
      hasPreviousPage: startIndex > 0,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    return HttpResponse.json({
      data: {
        tasks: {
          edges,
          pageInfo,
          totalCount: mockTasks.length,
        },
      },
    });
  }),
  // You can add other handlers here, e.g. for mutations
];
