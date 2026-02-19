import "./index.css";
import { useEffect, useMemo, useState } from "react";
import { levenshtein } from "./editDistance";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "edit-distance-theme";
const DEFAULT_TITLE = "Edit Distance Calculator";
const DEFAULT_SOCIAL_TITLE = "Edit Distance Calculator | Luke Igel";
const DEFAULT_DESCRIPTION =
  "Compare two strings and see edit distance, operations, and transformation trace by Luke Igel.";
const ABOUT_TITLE = "About Edit Distance | Luke Igel";
const ABOUT_DESCRIPTION =
  "The recurrence relation, a worked matrix example, and complexity notes for Levenshtein edit distance.";

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

function isAboutPath(pathname: string) {
  return pathname.replace(/\/+$/, "") === "/about";
}

export function App() {
  const initial = getInitialParams();
  const [source, setSource] = useState(initial.source);
  const [target, setTarget] = useState(initial.target);
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const aboutPage = isAboutPath(window.location.pathname);

  const result = useMemo(() => {
    if (aboutPage || (!source && !target)) return null;
    return levenshtein(source, target);
  }, [aboutPage, source, target]);

  // Sync calculator state to URL query string.
  useEffect(() => {
    if (aboutPage) return;
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (target) params.set("target", target);
    const qs = params.toString();
    const url = qs ? `/?${qs}` : "/";
    window.history.replaceState(null, "", url);
  }, [aboutPage, source, target]);

  // Persist theme choice and force it over system preference.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Update title + social tags for route/content.
  useEffect(() => {
    if (aboutPage) {
      document.title = ABOUT_TITLE;
      setMeta("description", ABOUT_DESCRIPTION);
      setMeta("og:title", ABOUT_TITLE);
      setMeta("twitter:title", ABOUT_TITLE);
      setMeta("og:description", ABOUT_DESCRIPTION);
      setMeta("twitter:description", ABOUT_DESCRIPTION);
      return;
    }

    if (source && target && result) {
      const title = `${source} -> ${target} = ${result.distance}`;
      document.title = title;
      setMeta("description", `Distance ${result.distance} from "${source}" to "${target}".`);
      setMeta("og:title", title);
      setMeta("twitter:title", title);
      const desc = result.operations.length > 0
        ? `Distance: ${result.distance} | ${result.operations.map((o) => o.op).join(", ")}`
        : `Distance: ${result.distance}`;
      setMeta("og:description", desc);
      setMeta("twitter:description", desc);
    } else {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESCRIPTION);
      setMeta("og:title", DEFAULT_SOCIAL_TITLE);
      setMeta("twitter:title", DEFAULT_SOCIAL_TITLE);
      setMeta("og:description", DEFAULT_DESCRIPTION);
      setMeta("twitter:description", DEFAULT_DESCRIPTION);
    }
  }, [aboutPage, source, target, result]);

  const shareUrl = useMemo(() => {
    if (aboutPage || (!source && !target)) return null;
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (target) params.set("target", target);
    return `/share?${params.toString()}`;
  }, [aboutPage, source, target]);

  const navLinkClass = (active: boolean) =>
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground";

  return (
    <div className={`${aboutPage ? "max-w-[920px]" : "max-w-[720px]"} mx-auto px-4 sm:px-8 py-8 overflow-x-hidden`}>
      <header className="mb-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-sm font-bold tracking-tight">
            {aboutPage ? "About Edit Distance" : "Edit Distance"}
          </h1>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.08em]">
            <a href="/" aria-current={aboutPage ? undefined : "page"} className={navLinkClass(!aboutPage)}>
              calculator
            </a>
            <a href="/about" aria-current={aboutPage ? "page" : undefined} className={navLinkClass(aboutPage)}>
              about
            </a>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle light and dark mode"
              aria-pressed={theme === "dark"}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {theme}
            </button>
          </div>
        </div>
        <div className="border-b border-dotted border-border mt-2" />
      </header>

      {aboutPage ? (
        <AboutPage />
      ) : (
        <CalculatorPage
          source={source}
          target={target}
          setSource={setSource}
          setTarget={setTarget}
          result={result}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}

interface CalculatorPageProps {
  source: string;
  target: string;
  setSource: (value: string) => void;
  setTarget: (value: string) => void;
  result: ReturnType<typeof levenshtein> | null;
  shareUrl: string | null;
}

function CalculatorPage({
  source,
  target,
  setSource,
  setTarget,
  result,
  shareUrl,
}: CalculatorPageProps) {
  return (
    <>
      <div className="flex flex-col gap-0">
        <div className="flex border border-border">
          <label className="text-sm px-4 py-3 border-r border-border bg-secondary w-20 shrink-0 flex items-center">
            source
          </label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="flex-1 px-4 py-3 text-base bg-transparent outline-none"
          />
        </div>
        <div className="flex border border-border border-t-0">
          <label className="text-sm px-4 py-3 border-r border-border bg-secondary w-20 shrink-0 flex items-center">
            target
          </label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            spellCheck={false}
            className="flex-1 px-4 py-3 text-base bg-transparent outline-none"
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
              <p className="text-sm">{[source, ...result.steps.map((s) => s.result)].join(" -> ")}</p>
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
    </>
  );
}

function AboutPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 max-w-[72ch]">
        Edit distance (Levenshtein distance) is the minimum number of single-character edits —
        insertions, deletions, or substitutions — needed to transform one string into another.
        This implementation builds the full DP matrix and backtraces it to recover the edit sequence.
      </p>

      <section>
        <div className="border-b border-dotted border-border mb-3">
          <span className="text-sm font-bold">Recurrence</span>
        </div>
        <div className="border border-border bg-secondary p-4 overflow-x-auto">
          <pre className="text-[12px] leading-5 whitespace-pre">
{`Let s = source (length m), t = target (length n)

D(i, 0) = i
D(0, j) = j

D(i, j) = min(
  D(i-1, j)   + 1,          delete
  D(i,   j-1) + 1,          insert
  D(i-1, j-1) + cost(i, j)  substitute/match
)

cost(i, j) = 0 when s[i-1] == t[j-1], else 1`}
          </pre>
        </div>
      </section>

      <section>
        <div className="border-b border-dotted border-border mb-3">
          <span className="text-sm font-bold">Matrix Diagram</span>
        </div>
        <div className="border border-border p-4 overflow-x-auto">
          <pre className="text-[12px] leading-5 whitespace-pre">
{`Example: source = "CAT", target = "CUT"

            j ->    0   1   2   3
                    -   C   U   T
i
0   -              0   1   2   3
1   C              1   0   1   2
2   A              2   1   1   2
3   T              3   2   2   1

Backtrace path:
  (3,3) -> (2,2) -> (1,1) -> (0,0)
    |        |        |
  match   substitute  match

Emitted edit script (forward order):
  substitute A -> U at position 2`}
          </pre>
        </div>
      </section>

      <section>
        <div className="border-b border-dotted border-border mb-3">
          <span className="text-sm font-bold">Process Sketch</span>
        </div>
        <div className="border border-border bg-secondary p-4 overflow-x-auto">
          <pre className="text-[12px] leading-5 whitespace-pre">
{`+---------------------+     +-------------------------+
| initialize borders  | --> | fill matrix row by row  |
+---------------------+     +-------------------------+
                                      |
                                      v
                        +-----------------------------+
                        | choose min(diag, up, left)  |
                        +-----------------------------+
                                      |
                                      v
                        +-----------------------------+
                        | backtrace from D(m,n)       |
                        | to D(0,0)                   |
                        +-----------------------------+
                                      |
                                      v
                        +-----------------------------+
                        | operations + visible trace  |
                        +-----------------------------+`}
          </pre>
        </div>
      </section>

      <section>
        <div className="border-b border-dotted border-border mb-3">
          <span className="text-sm font-bold">Complexity</span>
        </div>
        <div className="border border-border p-4">
          <pre className="text-[12px] leading-5 whitespace-pre-wrap">
{`Time  : O(m * n)
Space : O(m * n)

If you only need the distance (not the edit path), space can be reduced to:
Space : O(min(m, n)) via rolling rows.`}
          </pre>
        </div>
      </section>
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
