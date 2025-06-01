import { googleAuth } from "@hono/oauth-providers/google";
import { setCookie } from "hono/cookie";
import { App, AppContext } from "../types";

const googleAuthMiddleware = googleAuth({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    scope: ['openid', 'email', 'profile'],
    redirect_uri: process.env.OAUTH_REDIRECTION,
});

const handleGoogleRedirection = async (c: AppContext) => {
    const user = c.get('user-google');
    const sessionStore = c.get("sessionStore");
    const sessionId = await sessionStore.create({ name: user.name, email: user.email, id: user.id });

    setCookie(c, "sconnectid", sessionId, {
        path: "/",
        domain: process.env.COOKIE_DOMAIN,
        sameSite: "None",
        secure: true,
        httpOnly: true,
    });

    return c.redirect(process.env.SUCCESSFULL_LOGIN_REDIRECT);
}

export const setupAuth = (app: App) => {
    app.use("/google", googleAuthMiddleware);
    app.get("/google", handleGoogleRedirection);
}