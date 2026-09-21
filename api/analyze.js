export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });

  const { item = "", mode = "text", imageData = null } = req.body || {};
  if (!item && !imageData) return res.status(400).json({ error: "Provide a waste description or image." });

  const content = [{
    type: "input_text",
    text:
      "You are EcoSort AI, an academic sustainability assistant for waste segregation. " +
      "Analyze the user's waste item. Return ONLY valid JSON with exactly these keys: category, reason, recommendation, safety. " +
      "Use a concise category such as Recyclable, Organic Waste, Plastic, E-Waste, Hazardous, General Waste, or Special Handling. " +
      "Do not invent local recycling rules. Say local rules should be checked when uncertain. " +
      "For hazardous items, prioritize safety and authorized disposal channels. " +
      "User description: " + String(item).slice(0, 2000)
  }];

  if (mode === "image" && imageData) {
    if (typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image data." });
    }
    if (imageData.length > 7000000) {
      return res.status(413).json({ error: "Image is too large. Please upload a smaller image." });
    }
    content.push({ type: "input_image", image_url: imageData, detail: "auto" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [{ role: "user", content }],
        max_output_tokens: 500
      })
    });

    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "OpenAI API request failed." });
    }

    const text = data.output_text || "";
    let result;
    try { result = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { try { result = JSON.parse(match[0]); } catch {} }
    }
    if (!result || typeof result !== "object") {
      return res.status(502).json({ error: "The AI returned an unreadable result." });
    }

    return res.status(200).json({
      category: result.category || "Not determined",
      reason: result.reason || "No explanation returned.",
      recommendation: result.recommendation || "Check local waste-management guidance.",
      safety: result.safety || "Check local safety guidance.",
      prototype: false
    });
  } catch (err) {
    return res.status(500).json({ error: "AI service error: " + (err?.message || "Unknown error") });
  }
}
