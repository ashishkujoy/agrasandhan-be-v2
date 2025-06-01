import { Context, MiddlewareHandler, Next } from "hono";
import { getCookie } from "hono/cookie";
import { createRedis } from "redis-on-workers";

import { UserZodType } from "../types";
import { z } from "zod/v4"; 


export type User = z.infer<typeof UserZodType>;

export interface SessionStore {
    create(user: User): Promise<string>;
    get(sessionId: string): Promise<User|null|undefined>;
    close(): Promise<any>;
}

export class RedisSessionStore implements SessionStore {
    private redisClient: ReturnType<typeof createRedis>;
    private sessionPrefix: string;

    constructor(redisClient: ReturnType<typeof createRedis>, sessionPrefix: string) {
        this.redisClient = redisClient;
        this.sessionPrefix = sessionPrefix;
    }

    async create(user: User): Promise<string> {
        const sessionId = crypto.randomUUID();
        await this.redisClient.sendRaw("SET", `${this.sessionPrefix}_${sessionId}`, JSON.stringify(user));

        return sessionId;
    }

    async get(sessionId: string): Promise<User | null | undefined> {
        const user = await this.redisClient.sendOnce("GET", `${this.sessionPrefix}_${sessionId}`);
        if(user) {
            return JSON.parse(user as string) as User;
        }
    }

    async close() {
        return this.redisClient.close();
    }

    static createInstance(options: RedisSessionStoreOptions) {
        const redisClient = createRedis({...options});
        return new RedisSessionStore(redisClient, options.prefix);
    }
}

export type RedisSessionStoreOptions = {
    hostname: string;
    port: string;
    username: string;
    password: string;
    prefix: string;
}

export const createSessionMiddleware = (sessionStore: SessionStore): MiddlewareHandler => {
    return async (c: Context, n: Next) => {
        const cookie = getCookie(c, "sconnectid");
        const user = await sessionStore.get(cookie);
        if(user) {
            c.set("isAuthenticated", true);
            c.set("loggedInUser", user);
        }
        return n();
    }
}