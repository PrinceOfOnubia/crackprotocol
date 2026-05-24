import { body, ip, method, send } from "../lib/http.js";
import { getSession, isValidWalletAddress, normalizeWallet } from "../lib/auth.js";
import { classifyConversation, enforceRateLimit, getConversationMemory, neoReply, recordAttempt, rejectSpam, validateMessage, publicStatus } from "../lib/neo.js";

export default async function handler(req, res) {
  if (!method(req, res, ["POST"])) return;
  const data = await body(req);
  const username = String(data.username || "").trim();
  const walletAddress = normalizeWallet(data.walletAddress);
  const sessionId = String(data.sessionId || "").trim();
  const validation = validateMessage(data.message);

  if (!username || !walletAddress || !sessionId) return send(res, 400, { error: "Identity and session are required." });
  if (!isValidWalletAddress(walletAddress)) return send(res, 400, { error: "Wallet address format is not recognized." });
  if (!validation.ok) return send(res, 400, { error: validation.error });

  const session = await getSession(sessionId);
  if (!session || session.walletAddress !== walletAddress || session.username !== username) return send(res, 401, { error: "Session rejected. Re-authenticate." });

  const ipAddress = ip(req);
  const allowed = await enforceRateLimit(walletAddress, ipAddress);
  if (!allowed) return send(res, 429, { error: "Rate limit reached. Cooldown active." });
  if (await rejectSpam(sessionId, validation.message)) return send(res, 400, { error: "Repeated vector rejected." });

  const classification = classifyConversation(validation.message);
  const memory = await getConversationMemory(sessionId, validation.message);
  const reply = await neoReply({ username, message: validation.message, result: classification.result, category: classification.category, attempts: memory.attempts, recentReplies: memory.recentReplies, repeated: memory.repeated });
  const attempt = await recordAttempt({ username, walletAddress, sessionId, message: validation.message, reply, result: classification.result, category: classification.category, label: classification.label, ipAddress });

  return send(res, 200, {
    reply,
    status: publicStatus(classification.result),
    eligibleForReview: classification.result === "BREACHED" || classification.result === "PARTIAL BREACH",
    attempt: {
      at: attempt.at,
      agent: "NEO"
    }
  });
}
