// api/ask.js - Vercel serverless function
export default async function handler(req, res) {
  // --- THE GUEST LIST (Allowed URLs) ---
  const allowedOrigins = [
    "https://ls-2-science-revision.vercel.app",   // The Vercel App itself
    "https://educadug.github.io",                 // GitHub Page 1
    "https://mrguevaracga.github.io",             // GitHub Page 2
    "http://localhost:3000"
  ];

  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No GEMINI_API_KEY configured" });

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    });

    const data = await geminiResponse.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn’t generate a response.";

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
