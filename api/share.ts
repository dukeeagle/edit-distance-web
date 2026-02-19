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

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function handler(req: any, res: any) {
  const source = (req.query.source as string) || "";
  const target = (req.query.target as string) || "";

  const result = levenshtein(source, target);
  const hasInputs = source || target;

  const title = hasInputs
    ? `the edit distance between ${source} and ${target} is ${result.distance}`
    : "Edit Distance Calculator | Luke Igel";

  const description = hasInputs
    ? result.operations.length > 0
      ? `${result.operations.map((o) => o.op).join(", ")} | ${[source, ...result.steps.map((s) => s.result)].join(" \u2192 ")}`
      : `Distance: ${result.distance}`
    : "Compare two strings and see edit distance, operations, and transformation trace.";

  const host = req.headers?.host || "edit-distance.igel.mov";
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;

  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (target) params.set("target", target);
  const appUrl = `/?${params.toString()}`;
  const ogImageUrl = `${origin}/api/og?${params.toString()}`;

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="author" content="Luke Igel" />
  <meta name="theme-color" content="#ffffff" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
  <style>body { font-family: "SF Mono", ui-monospace, monospace; margin: 2rem; }</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${appUrl}">Open calculator</a></p>
</body>
</html>`);
}
