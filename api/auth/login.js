import { body, method, send } from "../../lib/http.js";
import { createSession, isValidWalletAddress, normalizeWallet, publicUser, verifyPassword, walletKey } from "../../lib/auth.js";
import { getJSON } from "../../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const data = await body(req);
  const password = String(data.password || "").trim();
  const walletAddress = normalizeWallet(data.walletAddress);

  if (!password || !walletAddress) return send(res, 400, { error: "Password and wallet address are required." });
  if (!isValidWalletAddress(walletAddress)) return send(res, 400, { error: "Wallet address format is not recognized." });

  const user = await getJSON(`user:${walletKey(walletAddress)}`, null);
  if (!user || !verifyPassword(password, user.passwordHash)) return send(res, 401, { error: "Invalid wallet or password." });

  try {
    const session = await createSession(user);
    return send(res, 200, { user: publicUser(user, session.sessionId) });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Unable to create session." });
  }
}
