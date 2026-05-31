/* =====================================================
   AJNC — AI church assistant (Netlify Function, v2)

   POST { messages: [{role, content}], church }  ->  { reply }

   Grounds Claude in the UPCI knowledge base (data/upci-knowledge.md).
   The knowledge base is sent as a cached system prompt, so repeat
   requests are cheaper and faster (prompt caching).

   Env:
     ANTHROPIC_API_KEY   (required)
     CLAUDE_MODEL        (optional; default claude-haiku-4-5-20251001)
   ===================================================== */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Read the knowledge base once per cold start. Requires netlify.toml:
//   [functions]  included_files = ["data/upci-knowledge.md"]
let KNOWLEDGE = '';
try {
  KNOWLEDGE = readFileSync(path.resolve(process.cwd(), 'data/upci-knowledge.md'), 'utf8');
} catch (e) {
  KNOWLEDGE =
    'AJNC is a family of Oneness Pentecostal (apostolic) churches in the ' +
    'Philippines. Core doctrine (Acts 2:38): repentance, water baptism in the ' +
    'name of Jesus Christ for the remission of sins, and the baptism of the ' +
    'Holy Ghost with the initial evidence of speaking in tongues. One God, ' +
    'manifest as Father, Son, and Holy Spirit — not three persons.';
}

const SYSTEM_INTRO =
  "You are the AJNC church assistant for Apostolic Jesus Name Church, a family " +
  "of Oneness Pentecostal (apostolic) churches in the Philippines. Answer " +
  "visitors' questions about the faith, baptism in Jesus' name, the Holy Ghost, " +
  "service times, and planning a visit, using ONLY the knowledge base below and " +
  "apostolic teaching. Be warm, plain, and bold; speak like family, use 'you' " +
  "and contractions. Name Jesus by name. AJNC is NOT Trinitarian: say 'one God, " +
  "manifest as Father, Son, and Holy Spirit', never 'three persons'. Always say " +
  "'baptized in the name of Jesus Christ' and 'filled with the Holy Ghost with " +
  "the initial evidence of speaking in tongues'. Quote and cite scripture (KJV) " +
  "when helpful. Keep answers short (a few sentences) and invite a next step: " +
  "plan a visit, send a prayer request, or contact the church. For pastoral, " +
  "personal, or crisis matters, gently point them to the pastors (hello@ajnc.ph) " +
  "rather than counselling them yourself. If you don't know a local detail, say " +
  "so and point them to Find a Church / contact.\n\n" +
  "=== KNOWLEDGE BASE ===\n";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!process.env.ANTHROPIC_API_KEY) {
    return json({
      reply: "The assistant isn't configured yet. Please email hello@ajnc.ph or " +
             "use Plan your visit — we'd love to talk with you."
    });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const incoming = Array.isArray(payload?.messages) ? payload.messages : [];
  const messages = incoming
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-12);

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return json({ error: 'No user message' }, 400);
  }

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        temperature: 0.3,
        system: [
          {
            type: 'text',
            text: SYSTEM_INTRO + KNOWLEDGE,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Anthropic error', res.status, detail);
      return json({
        reply: "I'm having trouble reaching our assistant right now. Please try " +
               "again, or reach us at hello@ajnc.ph."
      });
    }

    const data = await res.json();
    const reply = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    return json({ reply: reply || "I'm sorry, I didn't catch that — could you rephrase?" });
  } catch (err) {
    console.error('chat function error', err);
    return json({
      reply: "Something went wrong on our end. Please email hello@ajnc.ph and " +
             "we'll get right back to you."
    });
  }
};
