import { body, method, send } from "../../lib/http.js";
import { createSession, hashPassword, isValidWalletAddress, normalizeWallet, publicUser, walletKey } from "../../lib/auth.js";
import { getJSON, incr, nowISO, setJSON } from "../../lib/store.js";

export default async function handler(req, res) {
  try {
    if (!method(req, res, ["POST"])) return;
    const data = await body(req);
    const username = String(data.username || "").trim();
    const password = String(data.password || "").trim();
    const walletAddress = normalizeWallet(data.walletAddress);

    if (!username || !password || !walletAddress) return send(res, 400, { error: "Username, password, and wallet address are required." });
    if (!isValidWalletAddress(walletAddress)) return send(res, 400, { error: "Wallet address format is not recognized." });
    if (password.length < 6) return send(res, 400, { error: "Password must be at least 6 characters." });

    const key = `user:${walletKey(walletAddress)}`;
    const existing = await getJSON(key, null);
    if (existing) return send(res, 409, { error: "Wallet already registered. Log in to continue.", code: "WALLET_REGISTERED" });

    const user = {
      username,
      walletAddress,
      passwordHash: hashPassword(password),
      createdAt: await nowISO()
    };
    await setJSON(key, user);
    await incr("stats:totalUsers");

    const session = await createSession(user);
    return send(res, 200, { user: publicUser(user, session.sessionId) });
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Unable to create session." });
  }
}
