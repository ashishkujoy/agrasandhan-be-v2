import { Hono } from "hono";

import { createSessionMiddleware, RedisSessionStore, SessionStore, User } from "./middlewares/session";
import { home, login } from "./endpoints/auth";
import { googleAuth } from "@hono/oauth-providers/google";
import { setCookie } from "hono/cookie";

type Variables = {
	isAuthenticated: boolean;
	loggedInUser: User;
	sessionStore: SessionStore;
}

// Start a Hono app
const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const redisStore = RedisSessionStore.createInstance({
	hostname: process.env.REDIS_HOSTNAME,
	port: process.env.REDIS_PORT,
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	prefix: "test"
});

app.use("*", (c, n) => {
	console.log(`${c.req.method} ${c.req.url}`);
	return n();
});
app.use("*", (c, n) => {
	c.set("sessionStore", redisStore)
	return n();
});
app.use("*", async (c, n) => {
	const r = await n();
	redisStore.close();
	return r;
});
app.use("*", createSessionMiddleware(redisStore));

app.use(
	'/google',
	googleAuth({
		client_id: process.env.GOOGLE_CLIENT_ID,
		client_secret: process.env.GOOGLE_CLIENT_SECRET,
		scope: ['openid', 'email', 'profile'],
		redirect_uri: process.env.OAUTH_REDIRECTION,
	})
);

app.get('/google', async (c) => {
	const user = c.get('user-google');

	const sessionId = await redisStore.create({ name: user.name, email: user.email, id: user.id });
	setCookie(c, "sconnectid", sessionId);
	return c.redirect("/");
});

app.get("/", home);
app.post("/login", login);

export default app;
