/* =====================================================================
   Scriptures for the Hard Days — SMS auto-text + drip enrollment.

   POST { phone } -> texts the pack immediately, then (for Brevo) adds the
   number to an SMS list so an automation can drip the encouragement series.

   ---------------------------------------------------------------------
   SET UP (Netlify, Site configuration -> Environment variables):

   Provider A — Brevo (reuses your existing Brevo account):
     SMS_PROVIDER      = brevo
     BREVO_API_KEY     = xkeysib-...           (Brevo, SMTP & API -> API keys)
     SMS_SENDER        = AJNC                  (<=11 chars, alnum; register in Brevo)
     BREVO_SMS_LIST_ID = 7                     (optional: list to enroll for the drip)

   Provider B — Semaphore (Philippine SMS, simple + cheap):
     SMS_PROVIDER       = semaphore
     SEMAPHORE_API_KEY  = ...                  (semaphore.co dashboard)
     SMS_SENDER         = AJNC                  (registered sender name)

   Optional for either:
     SCRIPTURES_SMS_TEXT = custom message (use {link} for the pack URL)
     SCRIPTURES_URL      = https://ajnc.ph/scriptures.html

   DRIP (Brevo): create an SMS automation triggered on "contact added to
   list BREVO_SMS_LIST_ID" and schedule the short encouragements. Source
   wording is in content/knowing-jesus-letters.md (shorten each to one SMS).
   ===================================================================== */

const PROVIDER = (process.env.SMS_PROVIDER || 'brevo').toLowerCase();
const SENDER = (process.env.SMS_SENDER || 'AJNC').slice(0, 11);
const LINK = process.env.SCRIPTURES_URL || 'https://ajnc.ph/scriptures.html';
const TEXT = (process.env.SCRIPTURES_SMS_TEXT ||
  'Here are your Scriptures for the Hard Days from the AJNC family: {link} You are not alone, and we are praying for you. Reply STOP to opt out.'
).replace('{link}', LINK);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Normalize a Philippine mobile number to international digits, e.g. 639171234567.
function normalizePH(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '');
  if (d.startsWith('63')) return d;
  if (d.startsWith('0')) return '63' + d.slice(1);
  if (d.startsWith('9') && d.length === 10) return '63' + d;
  return d; // leave as-is; provider will reject if invalid
}

async function sendBrevo(recipient) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, skipped: 'no BREVO_API_KEY' };

  const sms = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: SENDER, recipient, content: TEXT, type: 'transactional' })
  });

  // Enroll for the drip (optional, non-fatal).
  const listId = process.env.BREVO_SMS_LIST_ID;
  if (listId) {
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ SMS: '+' + recipient, listIds: [Number(listId)], updateEnabled: true })
    }).catch(() => {});
  }
  return { ok: sms.ok, status: sms.status };
}

async function sendSemaphore(recipient) {
  const key = process.env.SEMAPHORE_API_KEY;
  if (!key) return { ok: false, skipped: 'no SEMAPHORE_API_KEY' };
  const body = new URLSearchParams({ apikey: key, number: recipient, message: TEXT, sendername: SENDER });
  const res = await fetch('https://api.semaphore.co/api/v4/messages', { method: 'POST', body });
  return { ok: res.ok, status: res.status };
}

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  let phone = '';
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) phone = (await req.json()).phone;
    else phone = (await req.formData()).get('phone');
  } catch { /* ignore parse errors */ }

  const recipient = normalizePH(phone);
  if (recipient.length < 11) return json({ ok: false, error: 'invalid phone' }, 400);

  try {
    const result = PROVIDER === 'semaphore'
      ? await sendSemaphore(recipient)
      : await sendBrevo(recipient);
    // Always 200: the page reveals the verses regardless of SMS delivery.
    return json({ ok: true, sms: result });
  } catch (e) {
    return json({ ok: true, sms: { ok: false, error: String(e.message || e) } });
  }
};
