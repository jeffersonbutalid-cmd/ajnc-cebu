/* =====================================================
   AJNC — AI church assistant (client)
   Talks to a Netlify Function (Claude) grounded in the
   UPCI knowledge base. Keeps a short conversation history.
   ===================================================== */
(function () {
  const root = document.getElementById('ajnc-chat');
  if (!root) return;

  const launcher   = document.getElementById('ajnc-chat-launcher');
  const minBtn      = document.getElementById('ajnc-chat-min');
  const panel       = document.getElementById('ajnc-chat-panel');
  const log         = document.getElementById('ajnc-chat-log');
  const form        = document.getElementById('ajnc-chat-form');
  const input       = document.getElementById('ajnc-chat-input');
  const suggestions = document.getElementById('ajnc-chat-suggestions');

  const CFG = window.AJNC_CONFIG || {};
  const ENDPOINT = CFG.chatEndpoint || '/.netlify/functions/chat';

  // Conversation history sent to the model (excludes the greeting).
  const history = [];
  let busy = false;
  let opened = false;

  function setOpen(open){
    root.dataset.open = String(open);
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open){
      opened = true;
      setTimeout(() => input.focus(), 60);
    }
  }
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  minBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  function el(cls, html){
    const d = document.createElement('div');
    d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  // Minimal, safe formatting: escape, then allow *italics* and line breaks.
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function format(text){
    const safe = escapeHtml(text);
    return safe
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
      .split(/\n{2,}/).map(p => '<p>' + p.replace(/\n/g, '<br/>') + '</p>').join('');
  }

  function addUser(text){
    const m = el('ajnc-msg ajnc-msg--user');
    m.textContent = text;
    log.appendChild(m);
    scroll();
  }
  function addBot(html){
    const m = el('ajnc-msg ajnc-msg--bot', html);
    log.appendChild(m);
    scroll();
    return m;
  }
  function typing(){
    const m = el('ajnc-msg ajnc-msg--bot',
      '<span class="ajnc-typing"><span></span><span></span><span></span></span>');
    log.appendChild(m);
    scroll();
    return m;
  }
  function scroll(){ log.scrollTop = log.scrollHeight; }

  async function send(text){
    if (busy || !text.trim()) return;
    busy = true;
    input.value = '';
    if (suggestions) suggestions.style.display = 'none';
    addUser(text);
    history.push({ role: 'user', content: text });

    const bubble = typing();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-12),
          church: CFG.churchSlug || 'cebu'
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const reply = (data && data.reply) ? data.reply
        : "I'm sorry, I couldn't find an answer. Please reach us at hello@ajnc.ph.";
      bubble.innerHTML = format(reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      bubble.innerHTML = format(
        "I'm having trouble reaching our assistant right now. You can still " +
        "[plan your visit](#plan) or send us a [prayer request](#prayer), and " +
        "we'd love to talk with you in person at hello@ajnc.ph."
      ).replace(/\[(.+?)\]\((#.+?)\)/g, '<a href="$2">$1</a>');
    } finally {
      busy = false;
      scroll();
    }
  }

  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  if (suggestions){
    suggestions.querySelectorAll('.ajnc-chip').forEach(chip => {
      chip.addEventListener('click', () => send(chip.textContent));
    });
  }
})();
