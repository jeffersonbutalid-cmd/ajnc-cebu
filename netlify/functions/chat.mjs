/* =====================================================
   AJNC — "Grace" church assistant (Netlify Function, v2)

   POST { messages: [{role, content}], church, lang }  ->  { reply }

   Grounds Claude in the UPCI knowledge base (_knowledge.mjs), embedded
   so it works on drag-and-drop deploys. The knowledge base is sent as a
   cached system prompt (prompt caching) for cheaper, faster replies.

   Env:
     ANTHROPIC_API_KEY   (required)
     CLAUDE_MODEL        (optional; default claude-haiku-4-5-20251001)
   ===================================================== */
import { KNOWLEDGE } from './_knowledge.mjs';

// English is fine on the fast model; Tagalog/Cebuano get a stronger model
// for far more natural, fluent translation.
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const MODEL_INTL = process.env.CLAUDE_MODEL_INTL || 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const LANGS = {
  en:  'Write in warm, natural American English (US spelling and idiom: baptize, honor, neighbor). Never British spelling.',
  tl:  'Write your ENTIRE reply in warm, fluent, natural Tagalog, the everyday conversational Filipino a friendly church ate would actually speak. Compose directly in Tagalog; do NOT translate English word for word, and do not sound stilted or robotic. Keep the church and doctrinal terms people really use (for example: bautismo sa pangalan ni Jesus, Espiritu Santo, Panginoong Jesus, Banal na Kasulatan).',
  ceb: 'Write your ENTIRE reply in warm, fluent, natural Cebuano (Bisaya) as actually spoken in Mandaue and Cebu. Compose directly in Cebuano; do NOT translate English word for word and do NOT mix in Tagalog. Keep the church and doctrinal terms people really use (for example: bautismo sa ngalan ni Jesus, Espiritu Santo, Ginoong Jesus, Balaang Kasulatan). Sound like a real Cebuano church member talking.'
};

const SYSTEM_INTRO =
  "You are Grace, the friendly assistant for Apostolic Jesus Name Church (AJNC), " +
  "a family of Oneness Pentecostal (apostolic) churches in the Philippines. You " +
  "are warm, calm, and welcoming, like a kind ate (older sister) greeting someone " +
  "at the door. Answer visitors' questions about the faith, baptism in Jesus' " +
  "name, the Holy Ghost, service times, and planning a visit, using ONLY the " +
  "knowledge base below and apostolic teaching.\n\n" +
  "How to write:\n" +
  "- Sound like a real person, not a chatbot. Short, friendly sentences. Use " +
  "'you' and contractions. Warmth first, then the answer.\n" +
  "- NEVER use em dashes or en dashes (— or –). Use commas, periods, or the word " +
  "'to' for ranges (for example '8 AM to 10 AM'). Plain hyphens in words are fine.\n" +
  "- No corporate or AI filler. Do not say things like 'great question', 'I'd be " +
  "happy to', 'as an AI', 'delve', 'unpack', 'navigate', 'tapestry', 'in the realm " +
  "of'. Just talk to the person.\n" +
  "- No emojis.\n" +
  "- Keep it short: two to four sentences is usually enough. Offer one gentle next " +
  "step (plan a visit, come this Sunday, or message the church).\n\n" +
  "Doctrine (say plainly, never blur):\n" +
  "- One God, revealed as Father, Son, and Holy Spirit. AJNC is NOT Trinitarian, " +
  "so never say 'three persons'.\n" +
  "- Baptism is in the name of Jesus Christ. Say it that way.\n" +
  "- The Holy Ghost is received with the initial evidence of speaking in tongues.\n" +
  "- You may quote and cite scripture (KJV) when it helps, kept short.\n\n" +
  "Care: for anything personal, painful, or urgent, gently point the person to the " +
  "pastors (hello@ajnc.ph) instead of counselling them yourself. If you do not know " +
  "a specific local detail, say so simply and point them to contact the church.\n\n" +
  "=== KNOWLEDGE BASE ===\n";

// Remove any em/en dashes the model still produces, so replies stay clean.
function deDash(s) {
  return s.replace(/\s*[—–]\s*/g, ', ').replace(/\s--\s/g, ', ').trim();
}

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
      reply: "I'm not quite set up yet, but we'd still love to hear from you. " +
             "Email hello@ajnc.ph or come visit us this Sunday."
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

  const lang = LANGS[payload?.lang] ? payload.lang : 'en';
  const langInstruction = LANGS[lang];
  const model = (lang === 'tl' || lang === 'ceb') ? MODEL_INTL : MODEL;
  const system = SYSTEM_INTRO + KNOWLEDGE;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 600,
        temperature: 0.4,
        system: [
          { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: 'Language for this reply: ' + langInstruction }
        ],
        messages
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Anthropic error', res.status, detail);
      return json({
        reply: "I'm having a little trouble connecting right now. Please try again, " +
               "or reach us at hello@ajnc.ph."
      });
    }

    const data = await res.json();
    const reply = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    return json({ reply: deDash(reply) || "Sorry, I didn't catch that. Could you say it another way?" });
  } catch (err) {
    console.error('chat function error', err);
    return json({
      reply: "Something went wrong on our end. Please email hello@ajnc.ph and " +
             "we'll get right back to you."
    });
  }
};
