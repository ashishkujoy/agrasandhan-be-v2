
import { RedisSessionStore } from "./middlewares/session";

import { createApp } from "./app";


export const redisStore = RedisSessionStore.createInstance({
	hostname: process.env.REDIS_HOSTNAME,
	port: process.env.REDIS_PORT,
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	prefix: "test"
});

// Start a Hono app
const app = createApp(redisStore);

export default app;

