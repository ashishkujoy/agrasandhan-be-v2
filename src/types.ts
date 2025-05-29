
import type { Context } from "hono";
import { z } from "zod/v4";
import { SessionStore, User } from "./middlewares/session";

type Variables = {
	isAuthenticated: boolean;
	loggedInUser: User;
	sessionStore: SessionStore;
}

export type AppContext = Context<{ Bindings: Env; Variables: Variables }>;


export const UserZodType = z.object({
	username: z.string(),
	age: z.number(),
});

