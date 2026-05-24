import { method, send } from "../lib/http.js";
import { storageStatus } from "../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const storage = storageStatus();
  return send(res, storage.configured ? 200 : 503, {
    ok: storage.configured,
    message: storage.configured ? "Access systems online." : "Access is temporarily unavailable. Please try again shortly.",
    storage
  });
}
