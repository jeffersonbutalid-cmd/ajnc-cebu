(function(){
  const wrap = document.getElementById('tl-rail-wrap');
  if(!wrap) return;

  const HALO_SVG = '<svg viewBox="-100 -100 200 200" aria-hidden="true"><circle cx="0" cy="0" r="84" fill="none" stroke="#E8B53C" stroke-width="1"/><circle cx="0" cy="0" r="66" fill="none" stroke="#E8B53C" stroke-width="1"/><circle cx="0" cy="0" r="50" fill="none" stroke="#E8B53C" stroke-width="1"/><circle cx="0" cy="0" r="34" fill="none" stroke="#E8B53C" stroke-width="1"/><circle cx="0" cy="0" r="18" fill="#E8B53C"/></svg>';
  const HALO_DASHED = '<svg viewBox="-100 -100 200 200" aria-hidden="true"><circle cx="0" cy="0" r="84" fill="none" stroke="#E8B53C" stroke-width="1" stroke-dasharray="4 4"/><circle cx="0" cy="0" r="66" fill="none" stroke="#E8B53C" stroke-width="1" stroke-dasharray="4 4"/><circle cx="0" cy="0" r="50" fill="none" stroke="#E8B53C" stroke-width="1" stroke-dasharray="4 4"/><circle cx="0" cy="0" r="34" fill="none" stroke="#E8B53C" stroke-width="1"/><circle cx="0" cy="0" r="18" fill="#E8B53C"/></svg>';

  const TL = [
    {kind:'era', era:'beginnings', name:'Beginnings.', sub:'1986 onward'},
    {kind:'event', era:'beginnings', type:'plant', year:'1986', loc:'Mandaue City', tag:'Church planted', title:'AJNC Cebu <em>begins.</em>', subtitle:'Where Rev. Espera planted the family.', excerpt:'Rev. Emilio Espera Jr. leads the first service. A handful of Cebuanos on borrowed plastic chairs. The work begins.', highlights:'First service|Pastor Espera called|Mandaue City', body:'In 1986, Rev. Emilio Espera Jr. plants AJNC Cebu in Mandaue. The first service gathers a handful of Cebuanos on borrowed plastic chairs. There is no building. There is the Word, a song, and a prayer.\nThe work begins where every faithful work begins: small, quiet, and committed to the apostolic doctrine of Jesus Christ.'},
    {kind:'event', era:'beginnings', type:'milestone', year:'1989', loc:'Lapu-Lapu City, Cebu', tag:'First baptisms', title:'Wade into <em>the water.</em>', subtitle:"Three Cebuanos baptised in Jesus' name.", excerpt:'The first baptisms of AJNC Cebu, at a beach near Liloan. A testimony the family still tells.', highlights:'3 first baptisms|Liloan beach', body:'Not long after the first service, the family wades into the water at a beach near Liloan. Three Cebuanos are baptised in the name of Jesus Christ for the remission of sins (Acts 2:38).\nIt is a testimony the family still tells.'},
    {kind:'era', era:'growth', name:'Growth.', sub:'The family takes root'},
    {kind:'event', era:'growth', type:'milestone', year:'1992', loc:'Mandaue City', tag:'First building', title:'A home <em>of our own.</em>', subtitle:'The first rented space.', excerpt:'AJNC Cebu moves into its first rented space. The family begins to outgrow the borrowed rooms.', body:'AJNC Cebu moves into its first rented space in Mandaue. The borrowed rooms had carried the family this far. A door of their own carries them farther.\nThe family begins to outgrow the room almost as soon as it is theirs.'},
    {kind:'event', era:'growth', type:'ministry', year:'2005', loc:'Mandaue City', tag:'Youth ministry', title:'Together <em>is born.</em>', subtitle:'Friday nights for the young people.', excerpt:'The Together youth gathering begins. Worship, food, the Word. The next generation steps in.', body:'The Together youth gathering begins. Friday nights. Worship, food, the Word. The next generation of AJNC Cebu steps into the work.\nMany who lead the family now first met the Holy Ghost on a Friday night.'},
    {kind:'event', era:'growth', type:'plant', year:'2006', loc:'Casuntingan, Mandaue', tag:'Un Heng Building', title:'A larger <em>family hall.</em>', subtitle:'Our current home.', excerpt:'AJNC Cebu moves to the 2nd floor of Un Heng Building in Casuntingan. The home we still gather in today.', body:'AJNC Cebu moves to the 2nd floor of Un Heng Building in Casuntingan. A wider hall. Room for the families that keep arriving.\nIt is the home we still gather in today.'},
    {kind:'event', era:'growth', type:'milestone', year:'2020', loc:'Mandaue, online', tag:'Services move online', title:'Lockdowns. Livestreams. <em>OFWs joining.</em>', subtitle:'A pandemic, and a wider reach.', excerpt:'The pandemic forces services online. Cebuano OFWs across the world tune in. A hard year and an unexpected expansion.', highlights:'First livestreams|OFW community joins', body:'The pandemic forces services online. The family learns livestreams, cameras, comment sections, all of it.\nCebuano OFWs across the world tune in from Dubai, Hong Kong, Toronto. A hard year, and an unexpected expansion of the family.'},
    {kind:'era', era:'today', name:'Today.', sub:'Forty years on'},
    {kind:'event', era:'today', type:'leadership', year:'March 2026', loc:'Cebu', tag:'A pastor goes home', title:'Rev. Espera <em>enters his rest.</em>', subtitle:'A life faithfully lived.', excerpt:'Our founding pastor finishes his race on March 7, 2026, after forty years of faithful service. The family grieves. The family gives thanks. The work continues.', highlights:'Founding pastor|40 years of service|A life faithfully lived', scripture:'Well done, good and faithful servant. Enter into the joy of your lord.', scriptureCite:'Matthew 25:23', body:'After forty years of shepherding the AJNC Cebu family, Rev. Emilio Espera Jr. enters the rest of the Lord on March 7, 2026.\nHe leaves behind a church that knows the apostolic doctrine, a family of believers who walk together, and a District in his care. The work he began in 1986 continues. The Word he preached still goes out from Un Heng Building every Sunday.'},
    {kind:'event', era:'today', type:'growth', current:true, year:'2026', loc:'Un Heng \u00b7 Casuntingan', tag:'Forty years, one family', title:'Forty years. <em>The work continues.</em>', subtitle:'Bro. Mario shepherds the family forward.', excerpt:'Bro. Mario Doromal shepherds the AJNC Cebu family. Forty years from the first service, we still gather every Sunday and Wednesday on the 2nd floor of Un Heng Building. One family, still growing.', highlights:'40th year|Bro. Mario shepherding|Un Heng Building', body:'Forty years on from that first borrowed room, AJNC Cebu still gathers. Bro. Mario Doromal carries the pastoral work forward.\nSundays at 8 AM and 5 PM. Wednesdays at 7 PM. The same gospel of Pentecost. The same family hall. The same prayer that built this church: that the name of Jesus would be known across Mandaue and beyond.'},
    {kind:'era', era:'future', name:'To come.', sub:'The next chapter', dashed:true},
    {kind:'event', era:'future', type:'vision', year:'2030', loc:'Metro Cebu', tag:'Daughter churches', title:'The <em>next chapter.</em>', subtitle:'Our prayer for the next decade.', excerpt:'Our prayer: plant a daughter church in Lapu-Lapu, Cebu City, Talisay City, and neighboring cities in Cebu by 2030. Pray with us.', readLabel:'Pray with us', scripture:'Pray the Lord of the harvest to send out labourers into His harvest.', scriptureCite:'Matthew 9:38', body:'Our prayer for the next decade: plant a daughter church in Lapu-Lapu or Talisay by 2030. A second hall. A second family. The same gospel.\nPray with us.'}
  ];

  let side = 'left';
  const html = TL.map(item => {
    if(item.kind === 'era'){
      return `<div class="tl-era" data-era="${item.era}">
        <div class="tl-era-halo">${item.dashed ? HALO_DASHED : HALO_SVG}</div>
        <span class="tl-era-name">${item.name}</span>
        <span class="tl-era-sub">${item.sub}</span>
      </div>`;
    }
    const mySide = side; side = (side === 'left') ? 'right' : 'left';
    const here = item.current ? '<span class="tl-here-pill">We are here</span>' : '';
    const read = item.readLabel || 'Read the story';
    return `<article class="tl-event" data-side="${mySide}" data-era="${item.era}" data-type="${item.type}"${item.current ? ' data-current="true"' : ''}
      data-year="${item.year}" data-location="${item.loc}" data-title="${item.title.replace(/<[^>]+>/g,'')}"
      data-subtitle="${item.subtitle}"${item.highlights ? ` data-highlights="${item.highlights}"` : ''}${item.scripture ? ` data-scripture="${item.scripture}" data-scripture-cite="${item.scriptureCite}"` : ''}
      data-body="${(item.body||item.excerpt).replace(/"/g,'&quot;')}">
      <div class="tl-year-col">${here}<span class="tl-year">${item.year}</span><span class="tl-loc">${item.loc}</span></div>
      <div class="tl-card-col"><div class="tl-card">
        <span class="tl-tag">${item.tag}</span>
        <h3>${item.title}</h3>
        <p class="tl-sub">${item.subtitle}</p>
        <p class="tl-excerpt">${item.excerpt}</p>
        <span class="tl-read">${read}</span>
      </div></div>
      <span class="tl-node" aria-hidden="true"></span>
    </article>`;
  }).join('\n');

  wrap.insertAdjacentHTML('beforeend', html);

  /* ===== Filter chips ===== */
  const root = document.getElementById('timeline');
  const chips = root.querySelectorAll('.tl-chip');
  const events = root.querySelectorAll('.tl-event');
  const eras = root.querySelectorAll('.tl-era');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const era = chip.dataset.era;
      events.forEach(ev => ev.classList.toggle('is-hidden', era !== 'all' && ev.dataset.era !== era));
      eras.forEach(er => er.classList.toggle('is-hidden', era !== 'all' && er.dataset.era !== era));
    });
  });

  /* ===== Reveal ===== */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }});
  }, { threshold: 0.15 });
  events.forEach(ev => io.observe(ev));

  /* ===== Progress ===== */
  const fill = root.querySelector('.tl-progress-fill');
  if(fill){
    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.4;
      const passed = Math.max(0, -rect.top + window.innerHeight * 0.4);
      const pct = total > 0 ? Math.max(0, Math.min(100, (passed / total) * 100)) : 0;
      fill.style.width = pct + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ===== Modal ===== */
  const modal = document.getElementById('tl-modal');
  const mEyebrow = modal.querySelector('.tl-modal-eyebrow');
  const mYear = modal.querySelector('.tl-modal-year');
  const mTitle = modal.querySelector('.tl-modal-card h3');
  const mSub = modal.querySelector('.tl-modal-sub');
  const mBody = modal.querySelector('.tl-modal-body');
  const mScripture = modal.querySelector('.tl-modal-scripture');
  const mChips = modal.querySelector('.tl-modal-chips');
  const mPrev = modal.querySelector('.tl-modal-nav .prev');
  const mNext = modal.querySelector('.tl-modal-nav .next');
  const mClose = modal.querySelector('.tl-modal-close');

  let visibleList = [];
  let currentIdx = -1;

  function openModal(ev){
    visibleList = Array.from(events).filter(e => !e.classList.contains('is-hidden'));
    currentIdx = visibleList.indexOf(ev);
    render();
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function render(){
    const ev = visibleList[currentIdx]; if(!ev) return;
    const d = ev.dataset;
    mEyebrow.textContent = `${d.type.toUpperCase()} \u00b7 ${d.location}`;
    mYear.textContent = d.year;
    const ttl = ev.querySelector('.tl-card h3').innerHTML;
    mTitle.innerHTML = ttl;
    mSub.textContent = d.subtitle;
    const body = (d.body || ev.querySelector('.tl-excerpt').textContent).split('\n').filter(Boolean);
    mBody.innerHTML = body.map(p => `<p>${p}</p>`).join('');
    if(d.scripture){
      mScripture.style.display = 'block';
      mScripture.innerHTML = `\u201c${d.scripture}\u201d<cite>${d.scriptureCite || ''}</cite>`;
    } else { mScripture.style.display = 'none'; }
    if(d.highlights){
      const items = d.highlights.split('|').map(s => s.trim()).filter(Boolean);
      mChips.innerHTML = items.map(h => `<span class="tl-modal-chip">${h}</span>`).join('');
      mChips.style.display = items.length ? 'flex' : 'none';
    } else { mChips.style.display = 'none'; }
    const prev = visibleList[currentIdx - 1];
    const next = visibleList[currentIdx + 1];
    mPrev.disabled = !prev;
    mNext.disabled = !next;
    mPrev.querySelector('.nav-year').textContent = prev ? prev.dataset.year : '\u2014';
    mPrev.querySelector('.nav-title').textContent = prev ? prev.dataset.title : '';
    mNext.querySelector('.nav-year').textContent = next ? next.dataset.year : '\u2014';
    mNext.querySelector('.nav-title').textContent = next ? next.dataset.title : '';
    modal.querySelector('.tl-modal-card').scrollTop = 0;
  }

  events.forEach(ev => {
    ev.addEventListener('click', () => openModal(ev));
    ev.setAttribute('tabindex','0');
    ev.setAttribute('role','button');
    ev.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(ev); }});
  });
  mClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  mPrev.addEventListener('click', () => { if(currentIdx > 0){ currentIdx--; render(); }});
  mNext.addEventListener('click', () => { if(currentIdx < visibleList.length - 1){ currentIdx++; render(); }});
  document.addEventListener('keydown', e => {
    if(!modal.classList.contains('is-open')) return;
    if(e.key === 'Escape') closeModal();
    else if(e.key === 'ArrowLeft' && currentIdx > 0){ currentIdx--; render(); }
    else if(e.key === 'ArrowRight' && currentIdx < visibleList.length - 1){ currentIdx++; render(); }
  });
})();
