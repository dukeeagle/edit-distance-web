import { serve } from "bun";
import index from "./index.html";
import { levenshtein } from "./editDistance";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const server = serve({
  routes: {
    "/share": {
      GET(req) {
        const url = new URL(req.url);
        const source = url.searchParams.get("source") || "";
        const target = url.searchParams.get("target") || "";

        const result = levenshtein(source, target);
        const hasInputs = source || target;

        const title = hasInputs
          ? `${source} \u2192 ${target} = ${result.distance}`
          : "Edit Distance Calculator | Luke Igel";

        const description = hasInputs
          ? result.operations.length > 0
            ? `Distance: ${result.distance} | ${result.operations.map((o) => o.op).join(", ")}`
            : `Distance: ${result.distance}`
          : "Compare two strings and see edit distance, operations, and transformation trace by Luke Igel.";

        const trace = hasInputs && result.steps.length > 0
          ? [source, ...result.steps.map((s) => s.result)].join(" \u2192 ")
          : "";

        const appParams = new URLSearchParams();
        if (source) appParams.set("source", source);
        if (target) appParams.set("target", target);
        const appUrl = `/?${appParams.toString()}`;

        return new Response(
          `<!DOCTYPE html>
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
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
  <style>
    body { font-family: "Berkeley Mono", "SF Mono", ui-monospace, monospace; margin: 2rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  ${trace ? `<p>${escapeHtml(trace)}</p>` : ""}
  <p><a href="${appUrl}">Open calculator</a></p>
</body>
</html>`,
          { headers: { "content-type": "text/html; charset=utf-8" } }
        );
      },
    },

    "/*": index,
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`Server running at ${server.url}`);
