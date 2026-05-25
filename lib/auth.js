import crypto from "node:crypto";
import { getJSON, setJSON, nowISO } from "./store.js";

const ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = "sha256";

export function normalizeWallet(walletAddress) {
  return String(walletAddress || "").trim();
}

export function walletKey(walletAddress) {
  return normalizeWallet(walletAddress).toLowerCase();
}

export function usernameKey(username) {
  return String(username || "").trim().toLowerCase();
}

export function isValidWalletAddress(value) {
  const wallet = normalizeWallet(value);
  if (wallet.length < 26 || wallet.length > 120) return false;

  const evm = /^0x[a-fA-F0-9]{40}$/;
  const solana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const bitcoin = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$/;
  const cosmosLike = /^[a-z]{2,20}1[ac-hj-np-z02-9]{20,90}$/;
  const tron = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

  return [evm, solana, bitcoin, cosmosLike, tron].some((pattern) => pattern.test(wallet));
}

export function shortenWallet(value) {
  const wallet = normalizeWallet(value);
  if (!wallet) return "Not set";
  if (wallet.length <= 14) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, encoded) {
  const [scheme, iter, salt, hash] = String(encoded || "").split(":");
  if (scheme !== "pbkdf2" || !iter || !salt || !hash) return false;
  const next = crypto.pbkdf2Sync(String(password), salt, Number(iter), KEYLEN, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
}

export function createSessionId() {
  return crypto.randomUUID();
}

export async function getSession(sessionId) {
  if (!sessionId) return null;
  return getJSON(`session:${sessionId}`, null);
}

export async function createSession(user) {
  const day = new Date().toISOString().slice(0, 10);
  const sessionsKey = `sessions:${usernameKey(user.username)}:${day}`;
  const sessions = await getJSON(sessionsKey, []);
  if (sessions.length >= 20) {
    const error = new Error("Session limit reached for this identity today.");
    error.statusCode = 429;
    throw error;
  }
  const sessionId = createSessionId();
  const session = {
    sessionId,
    username: user.username,
    walletAddress: user.walletAddress,
    createdAt: await nowISO(),
    agent: "NEO",
    attempts: 0,
    currentResult: "FAILED"
  };
  await setJSON(`session:${sessionId}`, session);
  sessions.push({ sessionId, createdAt: session.createdAt });
  await setJSON(sessionsKey, sessions);
  return session;
}

export function publicUser(user, sessionId) {
  return {
    sessionId,
    username: user.username,
    walletAddress: user.walletAddress,
    walletShort: shortenWallet(user.walletAddress)
  };
}
