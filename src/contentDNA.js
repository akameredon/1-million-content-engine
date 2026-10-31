const dimensions = {
  hook: [
    { id: "misconception", label: "Misconception check", line: (t) => `A common misunderstanding about ${t} deserves a second look.` },
    { id: "question", label: "Diagnostic question", line: (t) => `What is the one question that makes ${t} easier to understand?` },
    { id: "contrast", label: "Contrast", line: (t) => `There is a difference between looking busy with ${t} and making real progress.` },
    { id: "beginner", label: "Beginner entry", line: (t) => `Starting with ${t}? Ignore the noise and begin with the fundamentals.` },
    { id: "observation", label: "Practical observation", line: (t) => `One practical detail about ${t} is easy to overlook.` },
    { id: "myth", label: "Myth check", line: (t) => `A popular idea about ${t} is not automatically a useful strategy.` },
  ],
  audienceLens: [
    { id: "beginner-lens", label: "Beginner lens", line: (a) => `For ${a}, make the first step small enough to try without special access.` },
    { id: "operator-lens", label: "Operator lens", line: () => "Look at the process, the time it consumes, and the result it produces." },
    { id: "customer-lens", label: "Customer lens", line: () => "Start from the audience's actual problem, not the solution you are eager to sell." },
    { id: "risk-lens", label: "Trade-off lens", line: () => "Consider the trade-offs, constraints, and what could make this approach unsuitable." },
    { id: "systems-lens", label: "Systems lens", line: () => "Treat the result as a system: inputs, decisions, feedback, and adjustment." },
  ],
  teaching: [
    { id: "three-steps", label: "Three-step lesson", line: (i) => `Turn ${i} into three parts: define the outcome, take one action, and review what happened.` },
    { id: "decision-rule", label: "Decision rule", line: (i) => `Use this decision rule for ${i}: choose the next step you can explain and evaluate.` },
    { id: "cause-effect", label: "Cause and effect", line: (i) => `Ask how ${i} is supposed to create the outcome. If the link is unclear, test the assumption first.` },
    { id: "small-experiment", label: "Small experiment", line: (i) => `Treat ${i} as a small experiment: set a goal, change one thing, and learn from the result.` },
    { id: "checklist", label: "Practical checklist", line: (i) => `Before acting on ${i}, check the goal, the cost, the evidence, and the next review point.` },
    { id: "principle", label: "First principle", line: (i) => `Understand the principle behind ${i}; tools and tactics can change, but sound reasoning travels.` },
  ],
  proof: [
    { id: "evidence-question", label: "Evidence question", line: () => "What observation or reliable source would support this conclusion?" },
    { id: "measure-outcome", label: "Outcome measure", line: () => "Choose a measure that reflects the outcome, not just the amount of activity." },
    { id: "uncertainty", label: "Uncertainty check", line: () => "Be clear about what is known, what is assumed, and what still needs testing." },
    { id: "counterexample", label: "Counterexample check", line: () => "Look for a situation where this advice would not work; the boundary matters." },
    { id: "no-proof", label: "No-proof-needed", line: () => "Keep the point practical and avoid adding statistics or claims you cannot verify." },
  ],
  story: [
    { id: "decision-moment", label: "Decision moment", line: () => "Picture a moment when you must choose between adding another tactic and fixing the current process." },
    { id: "before-after", label: "Before-and-after", line: () => "Compare the starting situation with the result you want; identify the decision that connects them." },
    { id: "day-in-life", label: "Everyday scenario", line: () => "Imagine explaining this to a busy person who has only a short window to act." },
    { id: "wrong-turn", label: "Wrong turn", line: () => "A useful lesson often begins by noticing which assumption sent the process in the wrong direction." },
    { id: "field-note", label: "Field note", line: () => "Use a real example from your own experience when you have one; do not invent a success story." },
  ],
  objection: [
    { id: "constraint", label: "Constraint response", line: () => "If time or money is limited, reduce the size of the experiment rather than pretending the constraint does not exist." },
    { id: "not-universal", label: "Boundary statement", line: () => "This is a framework, not a universal answer; adapt it to the facts of your situation." },
    { id: "simple-not-easy", label: "Simple, not effortless", line: () => "A simple process still takes effort; the advantage is that you can see what to improve." },
    { id: "tools-later", label: "Tools second", line: () => "You may not need another tool yet. First confirm that the underlying process is useful." },
    { id: "risk-aware", label: "Risk-aware response", line: () => "Do not take a larger risk just to move faster; understand the downside before committing." },
  ],
  callToAction: [
    { id: "reflect", label: "Reflection CTA", line: () => "Which part would you test first?" },
    { id: "save", label: "Save CTA", line: () => "Save this framework and revisit it when you plan your next step." },
    { id: "comment", label: "Conversation CTA", line: () => "What would you change to make this work in your situation?" },
    { id: "action", label: "Action CTA", line: () => "Choose one small action and review the result before adding more." },
    { id: "share", label: "Share CTA", line: () => "Share this with someone who is working through the same decision." },
    { id: "follow", label: "Follow CTA", line: () => "Follow for more practical ideas, with the trade-offs included." },
  ],
};

const dimensionNames = Object.keys(dimensions);

function pick(items, index, seed, offset) {
  const n = Math.trunc(Number(seed) || 0);
  let value = Math.imul(index + 1, 2654435761) ^ Math.imul(n + 1, 2246822519) ^ Math.imul(offset + 1, 3266489917);
  value = Math.imul(value ^ (value >>> 16), 2246822519);
  value = Math.imul(value ^ (value >>> 13), 3266489917);
  return items[(value >>> 0) % items.length];
}

export function composeContentDNA({ topic, idea, audience, index = 0, seed = 0 }) {
  const selected = {};
  dimensionNames.forEach((name, dimensionIndex) => {
    selected[name] = pick(dimensions[name], index, seed, dimensionIndex * 7);
  });
  const lines = [
    selected.hook.line(topic),
    selected.audienceLens.line(audience),
    selected.teaching.line(idea),
    selected.story.line(),
    selected.proof.line(),
    selected.objection.line(),
    selected.callToAction.line(),
  ];
  const signature = dimensionNames.map((name) => selected[name].id).join("|");
  return {
    signature,
    components: Object.fromEntries(dimensionNames.map((name) => [name, { id: selected[name].id, label: selected[name].label }])),
    lines,
    text: lines.join(" "),
  };
}

export function scoreDiversity(posts) {
  if (!posts.length) return { score: 0, uniqueSignatures: 0, total: 0, repeated: 0 };
  const signatures = posts.map((post) => post.dnaSignature).filter(Boolean);
  const uniqueSignatures = new Set(signatures).size;
  const repeated = signatures.length - uniqueSignatures;
  return {
    score: Math.round((uniqueSignatures / posts.length) * 100),
    uniqueSignatures,
    total: posts.length,
    repeated,
  };
}

export const contentDnaDimensions = Object.fromEntries(
  Object.entries(dimensions).map(([name, options]) => [name, options.map(({ id, label }) => ({ id, label }))]),
);
