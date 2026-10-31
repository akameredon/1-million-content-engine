export const creatorFrameworks = [
  { name: "Contrarian educator", mechanics: ["challenge a common assumption", "explain the hidden cost", "offer a practical alternative"], note: "A general communication framework, not an imitation of any creator." },
  { name: "Story-led teacher", mechanics: ["open with a relatable moment", "reveal the lesson", "give one action to try"], note: "A general communication framework, not an imitation of any creator." },
  { name: "Numbers-first analyst", mechanics: ["lead with a measurable question", "show the reasoning", "state the limitation"], note: "A general communication framework, not an imitation of any creator." },
  { name: "Direct-response strategist", mechanics: ["name a costly problem", "connect a solution to an outcome", "invite a low-friction next step"], note: "A general communication framework, not an imitation of any creator." },
  { name: "Myth-to-method explainer", mechanics: ["name a popular myth", "replace it with a clearer model", "show the first step"], note: "A general communication framework, not an imitation of any creator." },
];

const hooks = [
  (topic) => `Most people misunderstand ${topic.toLowerCase()}. Here's the part worth paying attention to:`,
  (topic) => `A simple question can change how you think about ${topic.toLowerCase()}:`,
  (topic) => `Before you spend another minute on ${topic.toLowerCase()}, consider this:`,
  (topic) => `The useful lesson about ${topic.toLowerCase()} is not the obvious one.`,
  (topic) => `If ${topic.toLowerCase()} feels complicated, start with this:`,
  (topic) => `One mistake can quietly undermine your progress with ${topic.toLowerCase()}:`,
];
const lessons = [
  (idea) => `The real leverage is understanding ${idea}. Focus on the decision you can repeat, not a shortcut you cannot explain.`,
  (idea) => `Break ${idea} into one small action, one measurable result, and one review. That makes improvement easier to see.`,
  (idea) => `Do not confuse activity with progress. Test whether ${idea} is producing the outcome you actually want.`,
  (idea) => `A better approach is to learn the principle behind ${idea}, then adapt it to your own audience and constraints.`,
  (idea) => `Start small: define what success means for ${idea}, take one step, and compare the result with your starting point.`,
  (idea) => `The strongest system for ${idea} is one you can explain, measure, and improve without depending on hype.`,
];
const angles = [
  "Think about the first decision a beginner needs to make.",
  "Look at the problem from the customer's point of view.",
  "Separate what you can control from what you cannot.",
  "Measure the result instead of relying on a feeling.",
  "Start with the smallest useful experiment.",
  "Ask what would make this easier to repeat next week.",
  "Notice the difference between a tactic and a strategy.",
  "Build around the real constraint, not the loudest trend.",
  "Make the next step clear enough to act on today.",
  "Check whether the process works for someone with limited time.",
  "Compare the cost of waiting with the cost of taking a small step.",
  "Find the assumption that deserves to be tested first.",
  "Prefer a simple process you can improve over a complex one you cannot maintain.",
  "Use feedback from real people to improve the next version.",
  "Define the outcome before choosing the tool.",
  "Look for the bottleneck that slows everything else down.",
  "Make the lesson useful even to someone starting from zero.",
  "Turn the big goal into a decision you can make this afternoon.",
  "Ask what evidence would change your mind.",
  "Keep the message clear enough to explain in one breath.",
  "Choose consistency that you can sustain over intensity that burns out.",
  "Review what worked, what failed, and what you will change.",
  "Make the value obvious before asking for attention.",
  "Do not scale a process until the small version works.",
  "Give the audience one useful idea rather than five vague promises.",
  "Focus on the habit or system behind the visible result.",
  "Check whether the advice fits the audience's actual situation.",
  "Make room for uncertainty when the evidence is incomplete.",
  "Turn the insight into a question your audience can answer.",
  "Build trust by explaining the trade-offs, not hiding them."
];
const endings = [
  "Save this and test the idea before you scale it.",
  "What would you add? Share your experience.",
  "Use the principle; make the execution your own.",
  "Follow for practical lessons without the hype.",
  "Try one step today and review what changes.",
  "Send this to someone building in this space.",
];

export function generatePosts({ topic, idea, audience = "creators and business owners", category = "Marketing", count = 10, seed = 0 }) {
  const cleanTopic = String(topic || "").trim();
  const cleanIdea = String(idea || "").trim();
  if (!cleanTopic || !cleanIdea) throw new Error("Add a topic and a core idea before generating.");
  const total = Math.max(1, Math.min(5000, Number(count) || 1));
  const posts = [];
  const seen = new Set();
  let cursor = Math.max(0, Number(seed) || 0);
  let attempts = 0;
  while (posts.length < total && attempts < total * 12) {
    const hook = hooks[cursor % hooks.length](cleanTopic);
    const lesson = lessons[Math.floor(cursor / hooks.length) % lessons.length](cleanIdea);
    const ending = endings[Math.floor(cursor / (hooks.length * lessons.length)) % endings.length];\n    const angle = angles[Math.floor(cursor / (hooks.length * lessons.length * endings.length)) % angles.length];
    const framework = creatorFrameworks[cursor % creatorFrameworks.length];
    const post = `${hook} ${angle} ${lesson} ${ending}`;
    const key = post.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!seen.has(key)) {
      seen.add(key);
      posts.push({
        id: `post-${cursor}`,
        text: post,
        category,
        audience,
        framework: framework.name,
        mechanics: framework.mechanics,
        status: "draft",
      });
    }
    cursor += 1;
    attempts += 1;
  }
  return posts;
}

export function assessPosts(posts) {
  const seen = new Set();
  return posts.map((post) => {
    const text = String(post.text || "").trim();
    const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const duplicate = seen.has(key);
    seen.add(key);
    const issues = [];
    if (text.length < 45) issues.push("Very short");
    if (text.length > 500) issues.push("Long for a short post");
    if (/\b(guaranteed|risk[- ]free|100% certain|get rich quick)\b/i.test(text)) issues.push("Potentially misleading claim");
    if (/\$\s?\d|₦\s?\d|\b\d+(?:\.\d+)?%/.test(text)) issues.push("Check factual evidence");
    if (duplicate) issues.push("Duplicate");
    return { ...post, quality: issues.length ? "review" : "ready", issues };
  });
}

export function toCsv(posts) {
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return ["text,category,audience,framework,status,quality,issues", ...posts.map((p) => [p.text,p.category,p.audience,p.framework,p.status,p.quality,(p.issues || []).join("; ")].map(quote).join(","))].join("\n");
}
