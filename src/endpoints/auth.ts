import { Context } from "hono";
import { SessionStore, User } from "../middlewares/session";
import { setCookie } from "hono/cookie";

export const login = async (c: Context) => {
    const user = (await c.req.json()) as User;
    const sessionStore = c.get("sessionStore") as SessionStore;

    const sessionId = await sessionStore.create(user);
    setCookie(c, "sconnectid", sessionId);
    return c.redirect("/");
}

export const home = async (c: Context) => {
    const isAuthenticated = c.get("isAuthenticated") as boolean;
    if(!isAuthenticated) {
        return c.redirect("/login");
    }

    return c.json(c.get("loggedInUser"));
}