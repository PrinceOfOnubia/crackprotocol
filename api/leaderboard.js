import { method, send } from "../lib/http.js";
import { getJSON } from "../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const entries = await getJSON("leaderboard", []);
  return send(res, 200, {
    entries: entries.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      wallet: entry.walletShort,
      agent: entry.agent,
      result: entry.result,
      prize: entry.prize,
      time: entry.time,
      reviewedStatus: entry.reviewedStatus
    }))
  });
}
