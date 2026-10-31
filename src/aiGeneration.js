export async function generateAiPosts(input, accessCode, fetchImpl = fetch) {
  if (!accessCode || !String(accessCode).trim()) throw new Error("Enter the AI access code configured by the server owner.");
  const response = await fetchImpl("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessCode}` },
    body: JSON.stringify({
      topic: input.topic,
      idea: input.idea,
      audience: input.audience,
      category: input.category,
      count: Math.min(10, Math.max(1, Number(input.count) || 1)),
      patternId: input.patternId,
    }),
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("The AI service returned an unreadable response."); }
  if (!response.ok) throw new Error(payload.error || `AI generation failed (HTTP ${response.status}).`);
  if (!Array.isArray(payload.posts) || !payload.posts.length) throw new Error("The AI service returned no drafts.");
  return payload.posts;
}

export async function getAiServiceStatus(fetchImpl = fetch) {
  const response = await fetchImpl("/api/generate", { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error("Could not check AI service status.");
  return response.json();
}
