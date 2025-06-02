import { PrismaClient, Task } from '@prisma/client';
// import { CreateTaskInput, UpdateTaskInput } from './generated/graphql'; // Placeholder

const prisma = new PrismaClient();

// Define input types directly for now if not using GraphQL Code Generator
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

export const resolvers = {
  Query: {
    tasks: async (): Promise<Task[]> => {
      return prisma.task.findMany();
    },
  },
  Mutation: {
    createTask: async (_: any, { data }: { data: CreateTaskInput }): Promise<Task> => {
      return prisma.task.create({
        data: {
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : null,
        },
      });
    },
    updateTask: async (_: any, { data }: { data: UpdateTaskInput }): Promise<Task | null> => {
      const { id, ...updatePayload } = data;
      const updateData: any = {};

      // Iterate over the properties in updatePayload and build the data object for Prisma
      // This ensures that only provided fields are part of the update
      // and handles null assignments correctly.
      for (const key in updatePayload) {
        if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
          const value = (updatePayload as any)[key];
          if (value !== undefined) { // only include if value is actually provided
            if (key === 'deadline') {
              updateData.deadline = value ? new Date(value) : null;
            } else {
              updateData[key] = value; // This includes nulls e.g. title: null
            }
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        // Avoid making an update call if no data is provided other than ID
        // Fetch and return the existing task or handle as an error/noop
        // For simplicity, returning null if no actual update fields are provided beyond id.
        // Depending on requirements, you might fetch the current task or throw an error.
        const currentTask = await prisma.task.findUnique({ where: { id } });
        if (!currentTask) {
            throw new Error(`Task with ID ${id} not found.`);
        }
        return currentTask;
      }

      return prisma.task.update({
        where: { id },
        data: updateData,
      });
    },
  },
};
