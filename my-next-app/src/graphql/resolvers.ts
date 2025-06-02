import { PubSub } from 'graphql-subscriptions';
import { sendSlackMessage } from '../utils/sendSlackMessage'; // Import the Slack utility

// Define a simple Task interface that matches our GraphQL schema
interface Task {
  id: string;
  title: string;
  assigneeId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock in-memory task list - in a real app, this would be a database.
let tasks: Task[] = [
  {
    id: '1',
    title: 'Initial Task',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Another Task',
    assigneeId: 'user123',
    status: 'IN_PROGRESS',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const pubsub = new PubSub();
const TASK_UPDATED_TOPIC = 'TASK_UPDATED';

export const resolvers = {
  Query: {
    // Placeholder for tasks query - assuming it's handled elsewhere or not needed for this subtask
    tasks: () => ({
      edges: tasks.map(task => ({ node: task, cursor: task.id })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
      totalCount: tasks.length,
    }),
  },
  Mutation: {
    updateTask: async ( // Make the function async
      _: any,
      {
        id,
        title,
        assigneeId,
        status,
        deadline,
      }: { id: string; title?: string; assigneeId?: string; status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'; deadline?: string }
    ): Promise<Task | undefined> => { // Return Promise<Task | undefined>
      const taskIndex = tasks.findIndex((task) => task.id === id);
      if (taskIndex === -1) {
        // In a real app, you might throw an error or return null
        // Consider throwing an actual error for GraphQL to pick up
        console.error(`Task with ID ${id} not found.`);
        throw new Error(`Task with ID ${id} not found.`);
      }

      const originalTask = tasks[taskIndex];
      const updatedTask = {
        ...originalTask,
        title: title !== undefined ? title : originalTask.title,
        assigneeId: assigneeId !== undefined ? assigneeId : originalTask.assigneeId,
        status: status !== undefined ? status : originalTask.status,
        deadline: deadline !== undefined ? deadline : originalTask.deadline,
        updatedAt: new Date().toISOString(),
      };

      tasks[taskIndex] = updatedTask;

      pubsub.publish(TASK_UPDATED_TOPIC, { taskUpdated: updatedTask });
      console.log(`Task ${id} updated. Publishing to ${TASK_UPDATED_TOPIC}`);

      // Call sendSlackMessage after successful update
      try {
        await sendSlackMessage({
          id: updatedTask.id,
          title: updatedTask.title,
          assigneeId: updatedTask.assigneeId,
          status: updatedTask.status, // status is already a string literal type
          deadline: updatedTask.deadline,
        });
      } catch (slackError) {
        // Log Slack error but don't let it fail the main GraphQL mutation
        console.error('Failed to send Slack message:', slackError);
      }

      return updatedTask;
    },
  },
  Subscription: {
    taskUpdated: {
      subscribe: () => pubsub.asyncIterator([TASK_UPDATED_TOPIC]),
    },
  },
  // Assuming TaskStatus enum is resolved automatically by Apollo Server if not specified here
  // Task resolver (if needed for nested fields, not strictly necessary for this subtask if fields match 1:1)
  // Task: {
  //   // Example: if your internal Task object differs from GraphQL type
  //   // id: (parent: Task) => parent.id,
  // },
};

// Helper to get current tasks if needed elsewhere (e.g. for initial state in server setup)
export const getTasks = () => tasks;
export const getPubSub = () => pubsub;
