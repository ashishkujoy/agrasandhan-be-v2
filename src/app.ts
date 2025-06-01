import { Hono } from "hono";
import { cors } from "hono/cors";
import { setupAuth } from "./endpoints/auth";
import { SessionStore, createSessionMiddleware } from "./middlewares/session";
import { Variables } from "./types";

export const createApp = (sessionStore: SessionStore) => {
    const app = new Hono<{ Bindings: Env; Variables: Variables; }>();

    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS.split(";"),
        credentials: true
    }));

    app.use("*", (c, n) => {
        console.log(`${c.req.method} ${c.req.url}`);
        return n();
    });

    app.use("*", async (c, n) => {
        c.set("sessionStore", sessionStore);
        const res = await n();
        sessionStore.close();
        return res;
    });

    app.use("*", createSessionMiddleware(sessionStore));
    setupAuth(app);
    return app;
};
