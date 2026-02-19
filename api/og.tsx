import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

interface Operation {
  position: number;
  source: string;
  target: string;
  op: "substitute" | "insert" | "delete";
}

interface Step {
  step: number;
  operation: string;
  result: string;
}

function levenshtein(source: string, target: string) {
  const m = source.length;
  const n = target.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const operations: Operation[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && source[i - 1] === target[j - 1]) { i--; j--; }
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      operations.unshift({ position: i, source: source[i - 1], target: target[j - 1], op: "substitute" }); i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      operations.unshift({ position: i, source: source[i - 1], target: "\u2014", op: "delete" }); i--;
    } else {
      operations.unshift({ position: j, source: "\u2014", target: target[j - 1], op: "insert" }); j--;
    }
  }
  const steps: Step[] = [];
  let current = source;
  let offset = 0;
  for (let k = 0; k < operations.length; k++) {
    const op = operations[k];
    const pos = op.position - 1 + offset;
    if (op.op === "substitute") {
      current = current.slice(0, pos) + op.target + current.slice(pos + 1);
      steps.push({ step: k + 1, operation: "substitute", result: current });
    } else if (op.op === "delete") {
      current = current.slice(0, pos) + current.slice(pos + 1);
      steps.push({ step: k + 1, operation: "delete", result: current });
      offset--;
    } else {
      current = current.slice(0, op.position - 1 + offset) + op.target + current.slice(op.position - 1 + offset);
      steps.push({ step: k + 1, operation: "insert", result: current });
      offset++;
    }
  }
  return { distance: dp[m][n], operations, steps };
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "";
  const target = searchParams.get("target") || "";

  const fontData = await fetch(
    "https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n1iIq131nj-o.ttf"
  ).then((r) => r.arrayBuffer());

  const fontDataBold = await fetch(
    "https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n3oQIwlBFhA.ttf"
  ).then((r) => r.arrayBuffer());

  const result = levenshtein(source, target);
  const trace = result.steps.length > 0
    ? [source, ...result.steps.map((s) => s.result)].join(" \u2192 ")
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: '"IBM Plex Mono"',
          padding: "60px 80px",
          border: "3px solid #000000",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>
            Edit Distance
          </span>
          <span style={{ fontSize: 12, color: "#999" }}>
            edit-distance.igel.mov
          </span>
        </div>

        {/* Dotted divider */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px dotted #000000",
            marginBottom: "40px",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: 22, color: "#666", textAlign: "center" }}>
            the edit distance between
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
            <span style={{ fontSize: 42, fontWeight: 700 }}>
              {source || '""'}
            </span>
            <span style={{ fontSize: 22, color: "#666" }}>and</span>
            <span style={{ fontSize: 42, fontWeight: 700 }}>
              {target || '""'}
            </span>
            <span style={{ fontSize: 22, color: "#666" }}>is</span>
          </div>

          {/* Big number */}
          <span
            style={{
              fontSize: 160,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: "8px",
              marginBottom: "8px",
            }}
          >
            {result.distance}
          </span>

          {/* Trace */}
          {trace && (
            <span
              style={{
                fontSize: 16,
                color: "#666",
                textAlign: "center",
                maxWidth: "900px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {trace}
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "IBM Plex Mono", data: fontData, weight: 400, style: "normal" },
        { name: "IBM Plex Mono", data: fontDataBold, weight: 700, style: "normal" },
      ],
    }
  );
}
