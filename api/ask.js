export const config = { runtime: 'edge' };

export default async function handler(req) {
  // 1. Setup CORS (Allows your site to talk to this backend)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 2. Handle the "Pre-flight" check (Browser checking if it's safe to connect)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  // 3. Block anything that isn't a POST request
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    // 4. Get the message from the website
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server Error: No API Key found in Vercel Settings." }), { status: 500, headers: corsHeaders });
    }

    // 5. Send to Google Gemini (Using 2.5 Flash model)
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
    });

    const data = await googleResponse.json();
    
    // 6. Check for AI errors
    if (data.error) {
       return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: corsHeaders });
    }

    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI Error: No response generated.";

    // 7. Send the answer back to the website
    return new Response(JSON.stringify({ reply: replyText }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error: " + error.message }), { status: 500, headers: corsHeaders });
  }
}
