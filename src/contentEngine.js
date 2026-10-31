import { researchPatterns } from './researchLibrary.js';
import { composeContentDNA } from './contentDNA.js';
import { assessPosts } from './qualityEngine.js';
export { assessPosts } from './qualityEngine.js';

export const creatorFrameworks = researchPatterns.map((pattern) => ({
  id: pattern.id,
  name: pattern.name,
  mechanics: pattern.mechanics,
  sourceIds: pattern.sourceIds,
  note: "A generalized communication pattern, not an imitation of a creator.",
}));

function buildPatternText(patternId, { topic, audience, dna, contextLine }) {
  const framing = {
    "plain-language-explainer": `A practical way to understand ${topic} is to make the next decision clear.`,
    "evidence-first-teacher": `Before accepting a claim about ${topic}, ask what evidence would support it.`,
    "audience-intent-guide": `If you are ${audience}, start with the problem you need to solve in ${topic}.`,
    "problem-to-process": `If progress with ${topic} has stalled, identify the bottleneck before adding more tasks.`,
    "story-to-lesson": `Imagine facing a decision about ${topic}; the useful lesson is in what you choose to examine.`,
  }[patternId] || `Take a practical look at ${topic}.`;
  return `${framing} ${dna.lines[0]} ${contextLine} ${dna.lines[2]} ${dna.lines[4]} ${dna.lines[6]}`;
}

export function generatePosts({ topic, idea, audience = "creators and business owners", category = "Marketing", count = 10, seed = 0, patternId = "auto" }) {
  const cleanTopic = String(topic || "").trim();
  const cleanIdea = String(idea || "").trim();
  const cleanAudience = String(audience || "your audience").trim();
  if (!cleanTopic || !cleanIdea) throw new Error("Add a topic and a core idea before generating.");
  const total = Math.max(1, Math.min(5000, Number(count) || 1));
  const selectedPatterns = patternId === "auto" ? creatorFrameworks : creatorFrameworks.filter((pattern) => pattern.id === patternId);
  if (!selectedPatterns.length) throw new Error("Choose a valid research pattern.");
  const posts = [];
  const seen = new Set();
  let cursor = Math.max(0, Number(seed) || 0);
  let attempts = 0;
  while (posts.length < total && attempts < total * 20) {
    const pattern = selectedPatterns[cursor % selectedPatterns.length];
    const dna = composeContentDNA({ topic: cleanTopic, idea: cleanIdea, audience: cleanAudience, index: cursor, seed });
    const contextLine = dna.lines[[1, 3, 5][cursor % 3]];
    const text = buildPatternText(pattern.id, { topic: cleanTopic, audience: cleanAudience, dna, contextLine });
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!seen.has(key)) {
      seen.add(key);
      posts.push({
        id: `post-${cursor}`,
        text,
        category,
        audience: cleanAudience,
        framework: pattern.name,
        patternId: pattern.id,
        mechanics: pattern.mechanics,
        sourceIds: pattern.sourceIds,
        dnaSignature: dna.signature,
        dnaComponents: dna.components,
        dnaLabels: Object.values(dna.components).map((component) => component.label),
        status: "draft",
      });
    }
    cursor += 1;
    attempts += 1;
  }
  return posts;
}

export function toCsv(posts) {
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    "text,category,audience,framework,pattern_id,source_ids,dna_signature,dna_components,status,quality,quality_score,quality_flags,duplicate_of,similarity_to_previous,issues",
    ...posts.map((post) => [post.text, post.category, post.audience, post.framework, post.patternId, (post.sourceIds || []).join("; "), post.dnaSignature, JSON.stringify(post.dnaComponents || {}), post.status, post.quality, post.qualityScore, JSON.stringify(post.qualityFlags || []), post.duplicateOf, post.similarityToPrevious, (post.issues || []).join("; ")].map(quote).join(",")),
  ].join("\n");
}
