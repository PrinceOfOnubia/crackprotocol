import { method, send } from "../lib/http.js";
import { getJSON } from "../lib/store.js";

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  const totalChallenges = Number(await getJSON("stats:totalChallenges", 0));
  const breached = Number(await getJSON("stats:result:BREACHED", 0));
  const partial = Number(await getJSON("stats:result:PARTIAL BREACH", 0));
  const detected = Number(await getJSON("stats:result:DETECTED", 0));
  const failed = Number(await getJSON("stats:result:FAILED", 0));
  const leaderboard = await getJSON("leaderboard", []);
  const successRate = totalChallenges ? ((breached / totalChallenges) * 100).toFixed(2) + "%" : "0%";

  return send(res, 200, {
    weeklyPrizePool: "1,000 USDC",
    totalChallenges,
    successRate,
    topBreach: leaderboard.find((entry) => entry.result === "BREACHED")?.username || "None Yet",
    totalUsers: Number(await getJSON("stats:totalUsers", 0)),
    totalMessages: Number(await getJSON("stats:totalMessages", 0)),
    results: { breached, partial, detected, failed }
  });
}
