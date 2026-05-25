import { body, method, send } from "../../lib/http.js";
import { createSession, publicUser, usernameKey, verifyPassword } from "../../lib/auth.js";
import { getJSON } from "../../lib/store.js";

export default async function handler(req, res) {
  try {
    if (!method(req, res, ["POST"])) return;
    const data = await body(req);
    const username = String(data.username || "").trim();
    const password = String(data.password || "").trim();

    if (!username || !password) return send(res, 400, { error: "Username and password are required." });

    const user = await getJSON(`user:username:${usernameKey(username)}`, null);
    if (!user || !verifyPassword(password, user.passwordHash)) return send(res, 401, { error: "Invalid username or password." });

    const session = await createSession(user);
    return send(res, 200, { user: publicUser(user, session.sessionId) });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Unable to create session." });
  }
}
