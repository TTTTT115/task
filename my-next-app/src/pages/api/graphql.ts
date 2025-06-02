import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from '../../graphql/resolvers'; // Ensure this path is correct
// For WebSocket subscriptions, you would typically need a custom server setup
// with Next.js. The following imports would be used in such a setup:
// import { WebSocketServer } from 'ws';
// import { useServer } from 'graphql-ws/lib/use/ws';
// import { makeExecutableSchema } from '@graphql-tools/schema';
// import { createServer } from 'http'; // Or your preferred Node.js HTTP server

// Load GraphQL schema
const typeDefs = readFileSync(path.join(process.cwd(), 'src/graphql/schema.graphql'), 'utf8');

// Create the executable schema (needed for WebSocket setup, also good practice)
// This would be used with `useServer` from `graphql-ws` in a custom server.
// import { makeExecutableSchema } from '@graphql-tools/schema';
// const schema = makeExecutableSchema({ typeDefs, resolvers });

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // introspection: process.env.NODE_ENV !== 'production', // Good practice for production
});

// Export the Next.js handler
// This handles HTTP requests (queries, mutations).
// Subscriptions via WebSockets require a different setup (custom Next.js server).
export default startServerAndCreateNextHandler(server, {
  // Optional: pass context, etc.
  // context: async (req, res) => ({ req, res, /* other context like dataLoaders */ }),
});

/*
Guide for adding WebSocket Subscriptions (requires custom Next.js server):

1. Set up a custom server (e.g., using Express: `server.js` in your project root).
   See Next.js docs for custom server setup.

2. In your custom server file:
   - Create an HTTP server instance (e.g., `createServer` from `http`).
   - Initialize Next.js app: `const nextApp = next({ dev }); const nextHandler = nextApp.getRequestHandler();`
   - Create ApolloServer instance: `const apolloServer = new ApolloServer({ schema });` (using `schema` from `makeExecutableSchema`)
   - Apply Apollo middleware to the HTTP server (e.g., `apolloServer.applyMiddleware({ app: expressApp, path: '/api/graphql' });` if using Apollo Server 3 with Express).
     For Apollo Server 4 with Express, use `expressMiddleware(apolloServer)`.

   - Create a WebSocketServer:
     `const wsServer = new WebSocketServer({ server: httpServer, path: '/api/graphql/subscriptions' });`

   - Use `graphql-ws` to attach GraphQL to the WebSocket server:
     `const serverCleanup = useServer({ schema }, wsServer);`

   - Ensure proper server startup and shutdown, including disposing of `serverCleanup`.
     `httpServer.listen(PORT, () => { ... });`
     Handle 'SIGINT' and 'SIGTERM' for graceful shutdown.

   - Your Next.js app would then be handled by `nextHandler` for other routes.

3. Your `my-next-app/src/graphql/resolvers.ts` would remain largely the same (with PubSub).
   The `schema` used by both ApolloServer (HTTP) and the WebSocket server must be the same instance,
   created using `makeExecutableSchema({ typeDefs, resolvers })`.

This current file (`pages/api/graphql.ts`) sets up Apollo Server for HTTP ONLY,
as Next.js API routes are not designed for long-running WebSocket connections.
*/

console.log("Apollo Server for HTTP is set up at /api/graphql. WebSocket subscriptions require a custom server.");
