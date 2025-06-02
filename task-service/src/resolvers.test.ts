import { PrismaClient, Task } from '@prisma/client';
import { resolvers } from './resolvers'; // Adjust path as necessary

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;

// Define input types for tests (mirroring resolvers.ts for now)
interface CreateTaskInput {
  title: string;
  assigneeId?: string | null;
  status: string;
  deadline?: string | null;
}

interface UpdateTaskInput {
  id: string;
  title?: string | null;
  assigneeId?: string | null;
  status?: string | null;
  deadline?: string | null;
}

describe('GraphQL Resolvers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query', () => {
    it('tasks resolver should fetch all tasks', async () => {
      const mockTasks: Task[] = [
        { id: '1', title: 'Task 1', assigneeId: null, status: 'OPEN', deadline: null, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Task 2', assigneeId: 'user1', status: 'IN_PROGRESS', deadline: new Date(), createdAt: new Date(), updatedAt: new Date() },
      ];
      (prismaMock.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const result = await resolvers.Query.tasks();
      expect(result).toEqual(mockTasks);
      expect(prismaMock.task.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mutation', () => {
    it('createTask resolver should create a new task', async () => {
      const input: CreateTaskInput = { title: 'New Task', status: 'TODO', deadline: '2024-12-31T00:00:00.000Z' };
      const mockCreatedTask: Task = {
        id: '3',
        ...input,
        assigneeId: null,
        deadline: new Date(input.deadline!),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (prismaMock.task.create as jest.Mock).mockResolvedValue(mockCreatedTask);

      const result = await resolvers.Mutation.createTask(null, { data: input });
      expect(result).toEqual(mockCreatedTask);
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          ...input,
          deadline: new Date(input.deadline!),
        },
      });
    });

    it('createTask resolver should handle null deadline', async () => {
      const input: CreateTaskInput = { title: 'New Task Without Deadline', status: 'TODO', deadline: null };
      const mockCreatedTask: Task = {
        id: '4',
        title: input.title,
        status: input.status,
        assigneeId: null,
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (prismaMock.task.create as jest.Mock).mockResolvedValue(mockCreatedTask);

      const result = await resolvers.Mutation.createTask(null, { data: input });
      expect(result.deadline).toBeNull();
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          ...input,
          deadline: null,
        },
      });
    });

    it('updateTask resolver should update an existing task', async () => {
      const input: UpdateTaskInput = { id: '1', title: 'Updated Task Title', status: 'DONE' };
      const mockUpdatedTask: Task = {
        id: '1',
        title: 'Updated Task Title',
        assigneeId: null,
        status: 'DONE',
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (prismaMock.task.update as jest.Mock).mockResolvedValue(mockUpdatedTask);

      const result = await resolvers.Mutation.updateTask(null, { data: input });
      expect(result).toEqual(mockUpdatedTask);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: {
          title: input.title,
          status: input.status,
        },
      });
    });

    it('updateTask resolver should handle deadline update to a new date', async () => {
        const input: UpdateTaskInput = { id: '1', deadline: '2025-01-01T00:00:00.000Z' };
        const mockUpdatedTask: Task = {
          id: '1',
          title: 'Existing Task',
          assigneeId: null,
          status: 'OPEN',
          deadline: new Date(input.deadline!),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        (prismaMock.task.update as jest.Mock).mockResolvedValue(mockUpdatedTask);

        const result = await resolvers.Mutation.updateTask(null, { data: input });
        expect(result?.deadline).toEqual(new Date(input.deadline!));
        expect(prismaMock.task.update).toHaveBeenCalledWith({
          where: { id: input.id },
          data: {
            deadline: new Date(input.deadline!),
          },
        });
      });

    it('updateTask resolver should handle deadline update to null', async () => {
      const input: UpdateTaskInput = { id: '1', deadline: null };
      const mockUpdatedTask: Task = {
        id: '1',
        title: 'Existing Task',
        assigneeId: null,
        status: 'OPEN',
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (prismaMock.task.update as jest.Mock).mockResolvedValue(mockUpdatedTask);

      const result = await resolvers.Mutation.updateTask(null, { data: input });
      expect(result?.deadline).toBeNull();
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: {
          deadline: null,
        },
      });
    });

    it('updateTask resolver should not update deadline if not provided', async () => {
        const input: UpdateTaskInput = { id: '1', title: 'Only Title Update' }; // Deadline not provided
        const mockOriginalTask: Task = {
            id: '1',
            title: 'Original Title',
            assigneeId: null,
            status: 'OPEN',
            deadline: new Date('2024-01-01T00:00:00.000Z'), // Has an existing deadline
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // For this test, assume update returns the task with the new title and original deadline
        const mockUpdatedTask: Task = {
            ...mockOriginalTask,
            title: 'Only Title Update',
            updatedAt: new Date() // prisma updates this
        };

        (prismaMock.task.update as jest.Mock).mockResolvedValue(mockUpdatedTask);

        const result = await resolvers.Mutation.updateTask(null, { data: input });
        expect(result?.title).toBe(input.title);
        // Deadline should remain unchanged because it wasn't in the input
        expect(result?.deadline).toEqual(mockOriginalTask.deadline);
        expect(prismaMock.task.update).toHaveBeenCalledWith({
          where: { id: input.id },
          data: { // Only title should be in the data for update
            title: input.title,
          },
        });
      });
  });
});
