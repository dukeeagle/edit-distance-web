export interface Operation {
  position: number;
  source: string;
  target: string;
  op: "substitute" | "insert" | "delete";
}

export interface Step {
  step: number;
  operation: string;
  result: string;
}

export interface EditDistanceResult {
  distance: number;
  operations: Operation[];
  steps: Step[];
}

export function levenshtein(source: string, target: string): EditDistanceResult {
  const m = source.length;
  const n = target.length;

  // Build DP matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // substitute
          dp[i - 1][j],     // delete
          dp[i][j - 1]      // insert
        );
      }
    }
  }

  // Backtrace to extract operations
  const operations: Operation[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && source[i - 1] === target[j - 1]) {
      // match, no operation
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // substitute
      operations.unshift({
        position: i,
        source: source[i - 1],
        target: target[j - 1],
        op: "substitute",
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // delete
      operations.unshift({
        position: i,
        source: source[i - 1],
        target: "\u2014",
        op: "delete",
      });
      i--;
    } else {
      // insert
      operations.unshift({
        position: j,
        source: "\u2014",
        target: target[j - 1],
        op: "insert",
      });
      j--;
    }
  }

  // Generate step-by-step transformation
  const steps: Step[] = [];
  let current = source;
  let offset = 0;

  for (let k = 0; k < operations.length; k++) {
    const op = operations[k];
    const pos = op.position - 1 + offset;

    if (op.op === "substitute") {
      current = current.slice(0, pos) + op.target + current.slice(pos + 1);
      steps.push({
        step: k + 1,
        operation: `substitute '${op.source}' -> '${op.target}' at position ${op.position}`,
        result: current,
      });
    } else if (op.op === "delete") {
      current = current.slice(0, pos) + current.slice(pos + 1);
      steps.push({
        step: k + 1,
        operation: `delete '${op.source}' at position ${op.position}`,
        result: current,
      });
      offset--;
    } else if (op.op === "insert") {
      const insertPos = pos - offset + offset;
      current = current.slice(0, op.position - 1 + offset) + op.target + current.slice(op.position - 1 + offset);
      steps.push({
        step: k + 1,
        operation: `insert '${op.target}' at position ${op.position}`,
        result: current,
      });
      offset++;
    }
  }

  return {
    distance: dp[m][n],
    operations,
    steps,
  };
}
