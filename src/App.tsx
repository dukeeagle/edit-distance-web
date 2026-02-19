import "./index.css";
import { useState, useMemo, useEffect } from "react";
import { levenshtein } from "./editDistance";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "edit-distance-theme";

function getInitialTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("source") || "",
    target: params.get("target") || "",
  };
}

export function App() {
  const initial = getInitialParams();
  const [source, setSource] = useState(initial.source);
  const [target, setTarget] = useState(initial.target);
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const result = useMemo(() => {
    if (!source && !target) return null;
    return levenshtein(source, target);
  }, [source, target]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (target) params.set("target", target);
    const qs = params.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [source, target]);

  // Persist theme choice and force it over system preference.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Update OG meta tags client-side
  useEffect(() => {
    if (source && target && result) {
      const title = `${source} \u2192 ${target} = ${result.distance}`;
      document.title = title;
      setMeta("og:title", title);
      setMeta("twitter:title", title);
      const desc = result.operations.length > 0
        ? `Distance: ${result.distance} | ${result.operations.map((o) => o.op).join(", ")}`
        : `Distance: ${result.distance}`;
      setMeta("og:description", desc);
      setMeta("twitter:description", desc);
    } else {
      document.title = "Edit Distance Calculator";
      setMeta("og:title", "Edit Distance Calculator | Luke Igel");
      setMeta("twitter:title", "Edit Distance Calculator | Luke Igel");
      const defaultDesc = "Compare two strings and see edit distance, operations, and transformation trace by Luke Igel.";
      setMeta("og:description", defaultDesc);
      setMeta("twitter:description", defaultDesc);
    }
  }, [source, target, result]);

  const shareUrl = useMemo(() => {
    if (!source && !target) return null;
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (target) params.set("target", target);
    return `/share?${params.toString()}`;
  }, [source, target]);

  return (
    <div className="max-w-[720px] mx-auto px-8 py-8">
      <header className="mb-6">
        <h1 className="text-sm font-bold tracking-tight">Edit Distance</h1>
        <div className="border-b border-dotted border-border mt-2" />
      </header>

      <div className="flex flex-col gap-0">
        <div className="flex border border-border">
          <label className="text-sm px-4 py-3 border-r border-border bg-secondary w-20 shrink-0 flex items-center">
            source
          </label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
          />
          <button
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label="Toggle light and dark mode"
            aria-pressed={theme === "dark"}
            className="shrink-0 min-w-20 px-3 py-3 border-l border-border bg-secondary hover:bg-accent text-xs uppercase tracking-tight cursor-pointer"
          >
            {theme}
          </button>
        </div>
        <div className="flex border border-border border-t-0">
          <label className="text-sm px-4 py-3 border-r border-border bg-secondary w-20 shrink-0 flex items-center">
            target
          </label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            spellCheck={false}
            className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
          />
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-sm text-muted-foreground">distance</span>
            <span className="text-3xl font-bold leading-none">{result.distance}</span>
          </div>

          {result.operations.length > 0 && (
            <>
              <div className="border-b border-dotted border-border mb-3">
                <span className="text-sm font-bold">Operations</span>
              </div>
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left py-1.5 px-3 font-normal border border-border">Pos</th>
                    <th className="text-left py-1.5 px-3 font-normal border border-border">Source</th>
                    <th className="text-left py-1.5 px-3 font-normal border border-border">Target</th>
                    <th className="text-left py-1.5 px-3 font-normal border border-border">Op</th>
                  </tr>
                </thead>
                <tbody>
                  {result.operations.map((op, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-3 border border-border">{op.position}</td>
                      <td className="py-1.5 px-3 border border-border">{op.source}</td>
                      <td className="py-1.5 px-3 border border-border">{op.target}</td>
                      <td className="py-1.5 px-3 border border-border">{op.op}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {result.steps.length > 0 && (
            <div className="mt-4">
              <div className="border-b border-dotted border-border mb-3">
                <span className="text-sm font-bold">Trace</span>
              </div>
              <p className="text-sm">
                {[source, ...result.steps.map((s) => s.result)].join(" \u2192 ")}
              </p>
            </div>
          )}

          {shareUrl && (
            <div className="mt-6 border-t border-dotted border-border pt-3">
              <button
                onClick={() => {
                  const full = window.location.origin + shareUrl;
                  navigator.clipboard.writeText(full);
                }}
                className="text-xs border border-border px-2 py-1 hover:bg-secondary cursor-pointer"
              >
                copy share link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function setMeta(property: string, content: string) {
  const el =
    document.querySelector(`meta[property="${property}"]`) ||
    document.querySelector(`meta[name="${property}"]`);
  if (el) el.setAttribute("content", content);
}

export default App;
