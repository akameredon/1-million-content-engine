const ALLOWED_REVIEW_STATES = new Set(["human-verified", "rejected"]);

export function createEvidenceRecord({ claim, url, title, publisher = "", publishedAt = "", excerpt = "" }) {
  const cleanClaim = String(claim || "").trim();
  const cleanUrl = String(url || "").trim();
  const cleanTitle = String(title || "").trim();
  if (!cleanClaim) throw new Error("Add the specific claim this source is intended to support.");
  if (!cleanTitle) throw new Error("Add the source title so the reference can be identified.");
  let parsed;
  try { parsed = new URL(cleanUrl); } catch { throw new Error("Enter a valid http or https source URL."); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Only public http or https source URLs without embedded credentials are allowed.");
  return {
    claim: cleanClaim,
    url: parsed.href,
    title: cleanTitle,
    publisher: String(publisher || "").trim(),
    publishedAt: String(publishedAt || "").trim(),
    excerpt: String(excerpt || "").trim(),
    status: "provided",
    reviewedAt: null,
    reviewerNote: "",
  };
}

export function reviewEvidence(record, decision, reviewerNote = "") {
  if (!record || record.status === "missing") throw new Error("Attach a source before reviewing it.");
  if (!ALLOWED_REVIEW_STATES.has(decision)) throw new Error("Choose human-verified or rejected.");
  return {
    ...record,
    status: decision,
    reviewerNote: String(reviewerNote || "").trim(),
    reviewedAt: new Date().toISOString(),
  };
}

export function getEvidenceReadiness(post) {
  const evidence = post?.evidence;
  if (!evidence) return { status: "missing", canPublish: false, reason: "No claim-level source has been attached." };
  if (evidence.status === "rejected") return { status: "rejected", canPublish: false, reason: "The reviewer rejected this source for the claim." };
  if (evidence.status !== "human-verified") return { status: "provided", canPublish: false, reason: "A source is attached, but a human has not confirmed that it supports the claim." };
  return { status: "human-verified", canPublish: true, reason: "A human reviewer marked this source as supporting the stated claim." };
}

export function isSensitiveFinancePost(post) {
  return /finance|investment|money|business/i.test(String(post?.category || "")) ||
    /\b(invest(?:ment|ing)?|stock market|shares|crypto|bitcoin|forex|trading|portfolio|dividend|loan|credit score|tax|retirement|mutual fund|etf|bond|yield|capital gains)\b/i.test(String(post?.text || ""));
}

export function getPublicationReadiness(post) {
  const evidence = getEvidenceReadiness(post);
  const finance = isSensitiveFinancePost(post);
  const needsEvidence = (post?.qualityFlags || []).some((flag) => flag.code.includes("source") || flag.code.includes("evidence") || flag.code.includes("numeric-claim"));
  const requiresHumanReview = finance || needsEvidence;
  const approved = !requiresHumanReview || evidence.canPublish;
  return {
    status: approved ? (requiresHumanReview ? "human-approved" : "not-required") : evidence.status,
    canPublish: approved,
    requiresHumanReview,
    reason: approved
      ? (requiresHumanReview ? "Claim-level evidence has been reviewed by a human." : "No evidence gate was triggered by the current local checks.")
      : evidence.reason,
  };
}
