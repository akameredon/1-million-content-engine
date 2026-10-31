const STOP_WORDS = new Set([
  "a","about","after","again","all","also","an","and","any","are","as","at","be","because","been","before","being","between","but","by","can","could","did","do","does","doing","for","from","had","has","have","he","her","here","hers","him","his","how","i","if","in","into","is","it","its","just","may","me","more","most","my","no","not","of","on","once","one","only","or","our","out","over","own","same","she","should","so","some","such","than","that","the","their","them","then","there","these","they","this","those","through","to","too","under","up","us","very","was","we","were","what","when","where","which","while","who","why","will","with","would","you","your"
]);

const MISLEADING = [
  { code: "guaranteed-outcome", label: "Potentially misleading claim", pattern: /\b(guaranteed?|risk[- ]free|no risk|100\s?%\s?(certain|guaranteed)|cannot lose|get rich quick|instant wealth|double your money|beat the market)\b/i, severity: "critical", penalty: 50 },
  { code: "time-bound-wealth", label: "Unsubstantiated rapid-wealth promise", pattern: /\b(make|earn|get)\s+(\$|₦|\d)[\w\s,.-]{0,30}\b(in|within)\s+\d+\s+(days?|weeks?|months?)\b/i, severity: "critical", penalty: 45 },
];

const NUMBER_OR_METRIC = /(?:[$₦€£]\s?\d[\d,.]*(?:\s?(?:k|m|bn|million|billion))?|\b\d+(?:\.\d+)?\s?%|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?\s?(?:x|times)\b)/i;
const PERSONAL_INVESTMENT_ADVICE = /\b(you should|you must|i recommend you)\s+(buy|sell|hold|invest in|put|move)\b/i;
const FINANCE_TERMS = /\b(invest(?:ment|ing)?|stock market|shares|crypto(?:currency)?|bitcoin|forex|trading|portfolio|dividend|interest rate|loan|credit score|tax|retirement|mutual fund|etf|bond|yield|capital gains)\b/i;
const ASSERTIVE_FACT = /\b(always|never|everyone|nobody|the only way|proven to|will make you|will earn you|causes?\s)\b/i;

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(text) {
  const words = normalize(text).split(" ").filter(Boolean);
  if (words.length < 3) return new Set(words);
  const result = new Set();
  for (let i = 0; i <= words.length - 3; i += 1) {
    const gram = words.slice(i, i + 3);
    if (gram.every((word) => STOP_WORDS.has(word))) continue;
    result.add(gram.join(" "));
  }
  return result;
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const item of left) if (right.has(item)) overlap += 1;
  return overlap / (left.size + right.size - overlap);
}

function addFlag(flags, code, label, severity, penalty) {
  if (!flags.some((flag) => flag.code === code)) flags.push({ code, label, severity, penalty });
}

function findClaimFlags(post, text, flags) {
  for (const rule of MISLEADING) {
    if (rule.pattern.test(text)) addFlag(flags, rule.code, rule.label, rule.severity, rule.penalty);
  }
  const financeContent = /finance|investment|money|business/i.test(String(post.category || "")) || FINANCE_TERMS.test(text);
  if (NUMBER_OR_METRIC.test(text)) {
    addFlag(flags, "numeric-claim-needs-source", "Numeric, monetary, or performance claim needs a source", "warning", 25);
  }
  if (financeContent && PERSONAL_INVESTMENT_ADVICE.test(text)) {
    addFlag(flags, "personalized-investment-direction", "Potential personalized investment instruction", "critical", 40);
  }
  if (ASSERTIVE_FACT.test(text) && !post.evidenceSource && !post.evidenceUrl && !(post.evidenceUrls || []).length) {
    addFlag(flags, "assertive-claim-needs-evidence", "Broad factual assertion needs supporting evidence", "warning", 20);
  }
}

export function assessPosts(posts, options = {}) {
  const threshold = Math.min(0.99, Math.max(0.5, Number(options.nearDuplicateThreshold) || 0.82));
  const indexed = new Map();
  const exactSeen = new Map();
  const analyzed = [];

  for (const original of posts) {
    const text = String(original.text || "").trim();
    const normalized = normalize(text);
    const exactKey = normalized;
    const terms = shingles(text);
    const flags = [];
    const priorExact = exactSeen.get(exactKey);
    let nearMatch = null;

    if (priorExact !== undefined) {
      addFlag(flags, "exact-duplicate", "Duplicate", "critical", 45);
    } else {
      const candidates = new Set();
      for (const gram of terms) {
        const matches = indexed.get(gram);
        if (!matches || matches.length > 120) continue;
        for (const candidateIndex of matches) {
          candidates.add(candidateIndex);
          if (candidates.size >= 200) break;
        }
        if (candidates.size >= 200) break;
      }
      let bestSimilarity = 0;
      for (const candidateIndex of candidates) {
        const candidate = analyzed[candidateIndex];
        const similarity = jaccard(terms, candidate._shingles);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          nearMatch = candidate;
        }
      }
      if (bestSimilarity >= threshold) {
        addFlag(flags, "near-duplicate", "Very similar to an earlier draft", "warning", 30);
      }
    }

    if (text.length < 45) addFlag(flags, "too-short", "Very short post", "info", 10);
    if (text.length > 500) addFlag(flags, "too-long", "Long for a short post", "warning", 10);
    findClaimFlags(original, text, flags);

    const qualityScore = Math.max(0, 100 - flags.reduce((sum, flag) => sum + flag.penalty, 0));
    const issues = flags.map((flag) => flag.label);
    const result = {
      ...original,
      quality: flags.length ? "review" : "ready",
      qualityScore,
      qualityFlags: flags.map(({ code, label, severity }) => ({ code, label, severity })),
      issues,
      similarityToPrevious: nearMatch ? Number(jaccard(terms, nearMatch._shingles).toFixed(3)) : 0,
      duplicateOf: priorExact !== undefined ? analyzed[priorExact]?.id || null : (flags.some((flag) => flag.code === "near-duplicate") ? nearMatch?.id || null : null),
      _shingles: terms,
    };

    if (priorExact === undefined) exactSeen.set(exactKey, analyzed.length);
    analyzed.push(result);
    for (const gram of terms) {
      if (!indexed.has(gram)) indexed.set(gram, []);
      const bucket = indexed.get(gram);
      if (bucket.length <= 120) bucket.push(analyzed.length - 1);
    }
  }

  return analyzed.map(({ _shingles, ...post }) => post);
}

export function summarizeQuality(posts) {
  if (!posts.length) return { averageScore: 0, ready: 0, review: 0, nearDuplicates: 0, evidenceFlags: 0 };
  const scores = posts.map((post) => Number(post.qualityScore ?? 0));
  return {
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    ready: posts.filter((post) => post.quality === "ready").length,
    review: posts.filter((post) => post.quality !== "ready").length,
    nearDuplicates: posts.filter((post) => post.qualityFlags?.some((flag) => flag.code === "near-duplicate" || flag.code === "exact-duplicate")).length,
    evidenceFlags: posts.filter((post) => post.qualityFlags?.some((flag) => flag.code.includes("evidence") || flag.code.includes("source"))).length,
  };
}
