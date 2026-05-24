import { method, send } from "../lib/http.js";
import { getSession, publicUser, walletKey } from "../lib/auth.js";
import { getJSON } from "../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const sessionId = req.headers["x-session-id"] || req.query?.sessionId;
  const session = await getSession(sessionId);
  if (!session) return send(res, 401, { error: "No active session." });
  const user = await getJSON(`user:${walletKey(session.walletAddress)}`, null);
  if (!user) return send(res, 401, { error: "No active session." });
  return send(res, 200, { user: publicUser(user, session.sessionId), session });
}
