import { list } from "@vercel/blob";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const cursor = (req.query.cursor as string) || undefined;
  const result = await list({ prefix: "entries/", limit: 100, cursor });

  return res.status(200).json({
    entries: result.blobs.map((b: any) => ({
      url: b.url,
      key: b.pathname,
      uploadedAt: b.uploadedAt,
      size: b.size,
    })),
    cursor: result.cursor,
    hasMore: result.hasMore,
  });
}
