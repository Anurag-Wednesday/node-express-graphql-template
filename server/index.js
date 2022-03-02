import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLSchema, execute, subscribe } from 'graphql';
import dotenv from 'dotenv';
import multer from 'multer';
import cors from 'cors';
import { SubscriptionServer } from 'subscriptions-transport-ws/dist/server';
import 'whatwg-fetch';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { SubscriptionRoot } from '@gql/subscriptions';
import { initQueues } from '@utils/queue';
import rTracer from 'cls-rtracer';
import bodyParser from 'body-parser';
import { connect } from '@database';
import { QueryRoot } from '@gql/queries';
import { MutationRoot } from '@gql/mutations';
import { isTestEnv, logger, unless } from '@utils/index';
import { signUpRoute, signInRoute, recalibrateRoute } from '@server/auth';
import cluster from 'cluster';
import os from 'os';
import authenticateToken from '@middleware/authenticate/index';
import 'source-map-support/register';

const totalCPUs = os.cpus().length;

let app;
export const init = async () => {
  // configure environment variables
  dotenv.config({ path: `.env.${process.env.ENVIRONMENT_NAME}` });

  // connect to database
  connect();

  // create the graphQL schema
  const schema = new GraphQLSchema({ query: QueryRoot, mutation: MutationRoot, subscription: SubscriptionRoot });

  if (!app) {
    app = express();
  }

  app.use(express.json());
  app.use(rTracer.expressMiddleware());
  app.use(cors());
  app.use(unless(authenticateToken, '/', '/sign-in', '/sign-up', '/recalibrateRoute'));
  app.use(
    '/graphql',
    graphqlHTTP({
      schema: schema,
      graphiql: true,
      customFormatErrorFn: e => {
        logger().info({ e });
        return e;
      }
    })
  );

  const createBodyParsedRoutes = routeConfigs => {
    if (!routeConfigs.length) {
      return;
    }
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    const validate = configs => configs.every(({ path, handler, method }) => !!path && !!handler && !!method);
    try {
      if (validate(routeConfigs)) {
        routeConfigs.forEach(({ path, handler, method }) => app[method](path, multer().array(), handler));
      } else {
        throw new Error('Invalid route config');
      }
    } catch (error) {
      console.error(error);
    }
  };
  createBodyParsedRoutes([signUpRoute, signInRoute, recalibrateRoute]);

  app.use('/', (req, res) => {
    const message = 'Service up and running!';
    logger().info(message);
    res.json(message);
  });
  /* istanbul ignore next */
  if (!isTestEnv()) {
    const httpServer = createServer(app);
    const server = new ApolloServer({
      schema
    });
    await server.start();
    server.applyMiddleware({ app });
    const subscriptionServer = SubscriptionServer.create(
      { schema, execute, subscribe },
      { server: httpServer, path: server.graphqlPath }
    );
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => subscriptionServer.close());
    });
    httpServer.listen(9000, () => {
      console.log(`Server is now running on http://localhost:9000/graphql`);
    });
    initQueues();
  }
};

logger().info({ ENV: process.env.NODE_ENV });

if (!isTestEnv() && cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  init();
}

export { app };
