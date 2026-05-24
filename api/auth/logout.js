import { body, method, send } from "../../lib/http.js";
import { del } from "../../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const data = await body(req);
  if (data.sessionId) await del(`session:${data.sessionId}`);
  return send(res, 200, { ok: true });
}
