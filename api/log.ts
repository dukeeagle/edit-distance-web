import { put } from "@vercel/blob";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { source, target, distance } = req.body || {};
  if (!source && !target) {
    return res.status(400).json({ error: "missing source or target" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const entry = {
    source: source || "",
    target: target || "",
    distance: distance ?? null,
    ip,
    ts: new Date().toISOString(),
    ua: req.headers["user-agent"] || "",
  };

  const key = `entries/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;

  await put(key, JSON.stringify(entry), { access: "public", addRandomSuffix: false });

  return res.status(200).json({ ok: true });
}
