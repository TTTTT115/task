import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers'; // Assuming resolvers are in resolvers.ts

const typeDefs = readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

async function main() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
