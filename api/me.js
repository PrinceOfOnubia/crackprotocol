import { method, send } from "../lib/http.js";
import { getSession, publicUser, walletKey } from "../lib/auth.js";
import { getJSON } from "../lib/store.js";
import { publicStatus } from "../lib/neo.js";

export default async function handler(req, res) {
  try {
    if (!method(req, res, ["GET"])) return;
    const sessionId = req.headers["x-session-id"] || req.query?.sessionId;
    const session = await getSession(sessionId);
    if (!session) return send(res, 401, { error: "No active session." });
    const user = await getJSON(`user:${walletKey(session.walletAddress)}`, null);
    if (!user) return send(res, 401, { error: "No active session." });
    return send(res, 200, {
      user: publicUser(user, session.sessionId),
      session: {
        sessionId: session.sessionId,
        attempts: Number(session.attempts || 0),
        status: publicStatus(session.currentResult)
      }
    });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Session service unavailable." });
  }
}
