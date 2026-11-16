/* =====================================================================
   Agenda Grupo UPS · funciones comunes (notas, avisos, frase semanal)
   Requiere supabase-js cargado antes.
   ===================================================================== */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://zvbgefzvbhjhcvlkeiyn.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_qXDM-qp_nrHJjynldGyUTw_T8OCbM_7';

  function getClient() {
    if (window.grupoUpsCommercialClient) return window.grupoUpsCommercialClient;
    if (!window.__gupsClient) {
      window.__gupsClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.__gupsClient;
  }

  /* ------------------------------------------------------------ utilidades */
  function esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function parseISO(iso) { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, m - 1, d, 12); }
  function isoDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function longDate(iso) {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-PA', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(iso));
  }
  function hm(value) {
    if (!value) return { h: null, m: '00' };
    const [h, m = '00'] = String(value).split(':');
    return { h: Number(h), m: m.slice(0, 2) };
  }
  function ampm(value) {
    const t = hm(value);
    if (t.h === null || Number.isNaN(t.h)) return '';
    const suf = t.h >= 12 ? 'p. m.' : 'a. m.';
    return `${t.h % 12 || 12}:${t.m} ${suf}`;
  }
  /* "de 2:00 a 2:30 p. m." */
  function rangeText(start, end) {
    const a = hm(start), b = hm(end);
    if (a.h === null) return '';
    if (b.h === null) return `a las ${ampm(start)}`;
    const sa = a.h >= 12 ? 'p. m.' : 'a. m.', sb = b.h >= 12 ? 'p. m.' : 'a. m.';
    const ta = `${a.h % 12 || 12}:${a.m}`, tb = `${b.h % 12 || 12}:${b.m}`;
    return sa === sb ? `de ${ta} a ${tb} ${sb}` : `de ${ta} ${sa} a ${tb} ${sb}`;
  }
  function whenText(ts) {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    const time = d.toLocaleTimeString('es-PA', { hour: 'numeric', minute: '2-digit' }).replace('a. m.', 'a. m.').replace('p. m.', 'p. m.');
    const day = isoDate(d), today = isoDate(now);
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (day === today) return `hoy ${time}`;
    if (day === isoDate(y)) return `ayer ${time}`;
    return `${new Intl.DateTimeFormat('es-PA', { day: 'numeric', month: 'short' }).format(d)} ${time}`;
  }

  /* ------------------------------------------------------- frase semanal */
  const WEEKLY_PHRASES = [
    { monWed: 'El liderazgo comienza cuando te haces responsable de tus compromisos sin esperar un recordatorio.', thuFri: 'Tu agenda expresa tus prioridades; cumplirla demuestra tu compromiso.' },
    { monWed: 'Cada compromiso necesita un responsable, una fecha y un resultado claro.', thuFri: 'La confianza del cliente crece cada vez que cumples lo prometido.' },
    { monWed: 'Dar seguimiento es tomar responsabilidad por el siguiente paso.', thuFri: 'Una cotización enviada abre una oportunidad; el seguimiento permite hacerla avanzar.' },
    { monWed: 'Anticipar un obstáculo y comunicarlo a tiempo también es cumplir con tus responsabilidad.', thuFri: 'La autonomía se fortalece cuando entregas resultados y mantienes informados a los demás.' },
    { monWed: 'Cada detalle que verificas protege el trabajo del equipo y la confianza del cliente.', thuFri: 'Antes de cerrar el día, deja claro qué terminaste y cuál será tu siguiente paso.' },
    { monWed: 'Si una prioridad cambia, actualiza la agenda y acuerda el nuevo compromiso.', thuFri: 'Liderar desde tu puesto es actuar, dar seguimiento y responder por lo que te corresponde.' }
  ];
  function weeklyPhrase(firstName) {
    const today = new Date();
    const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    const start = new Date(2026, 9, 22, 12);
    let idx = 0;
    if (cur >= start) idx = Math.floor((cur - start) / (7 * 24 * 3600 * 1000)) % WEEKLY_PHRASES.length;
    const day = cur.getDay();
    const w = WEEKLY_PHRASES[idx];
    return { title: `Buen día, ${firstName} · Semana ${idx + 1}`, text: (day >= 1 && day <= 3) ? w.monWed : w.thuFri };
  }

  /* ----------------------------------------------- reglas (solo pantalla)
     La seguridad real la aplica Supabase; esto solo decide qué botones mostrar. */
  function code(p) { return String(p?.person_code || '').toLowerCase(); }
  function role(p) { return String(p?.access_role || '').toLowerCase(); }
  function canSendNoteTo(me, target) {
    if (!me || !target || me.id === target.id) return false;
    if (['management_viewer', 'sales_admin'].includes(role(me))) return true;
    if (code(me) === 'jennifer' && code(target) === 'eric') return true;
    if (code(me) === 'eric' && code(target) === 'jennifer') return true;
    return false;
  }
  function canReplyNote(me, note) {
    if (!me || !note || note.parent_id) return false;
    if (note.target_owner !== me.id) return false;
    const fromIng = note.author_role ? note.author_role === 'management_viewer' : /zapata|ingeniero/i.test(note.author_name || '');
    if (code(me) === 'hector' || role(me) === 'reception_staff') return fromIng;
    return true;
  }
  function homePageFor(me) { return role(me) === 'management_viewer' ? 'panel-gerencia.html' : 'agenda-comercial.html'; }

  /* ---------------------------------------------------------------- estilos */
  const STYLE = `
  .gn-wrap{display:flex;flex-direction:column;gap:8px;padding:4px 0}
  .gn-note{background:#fffaeb;border:1px solid #f3dc9b;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:3px;max-width:820px}
  .gn-note.gn-focus{border:2px solid #f2b705;box-shadow:0 8px 24px rgba(242,183,5,.25)}
  .gn-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;font-weight:800;color:#7a5000}
  .gn-new{padding:2px 8px;border-radius:999px;background:#b42318;color:#fff;font-size:10px;font-weight:800;letter-spacing:.03em}
  .gn-text{font-size:14px;line-height:1.45;color:#172033;white-space:pre-wrap}
  .gn-reply{margin-left:26px;background:#eef4fd;border:1px solid #c9d8ea;border-radius:12px;padding:9px 12px;display:flex;flex-direction:column;gap:3px;max-width:794px}
  .gn-reply .gn-meta{color:#073b80}
  .gn-reply.gn-focus{border:2px solid #f2b705}
  .gn-replybox{margin-left:26px;display:flex;flex-direction:column;gap:6px;max-width:794px}
  .gn-replybox textarea,.gn-modal textarea{width:100%;box-sizing:border-box;min-height:64px;padding:10px 12px;border:1px solid #c9d8ea;border-radius:10px;font:400 14px Inter,Segoe UI,Arial,sans-serif;color:#172033;resize:vertical}
  .gn-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
  .gn-btn{min-height:38px;padding:0 14px;border:0;border-radius:10px;background:#0b4da2;color:#fff;font:700 13px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
  .gn-btn.ghost{background:#fff;color:#073b80;border:1px solid #c9d8ea}
  .gn-add{align-self:flex-start;min-height:34px;padding:0 12px;border:1px dashed #0b4da2;border-radius:10px;background:#f3f8ff;color:#0b4da2;font:700 12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
  .gn-hint{font-size:12px;color:#667085}
  .gn-focus-label{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:#f2b705;color:#3d2a00;font-size:13px;font-weight:800}
  tr.gn-focus-row>td{background:#fffbea!important}
  tr.gn-focus-row>td:first-child{box-shadow:inset 4px 0 0 #f2b705}
  .gn-notices{display:flex;flex-direction:column;gap:10px;margin:0 0 18px}
  .gn-notice{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-radius:14px;background:#fff5d8;border:1px solid #f3dc9b;color:#172033}
  .gn-notice.reply{background:#eef4fd;border-color:#c9d8ea}
  .gn-notice-main{display:flex;align-items:flex-start;gap:12px;flex:1 1 480px;min-width:0}
  .gn-notice-ico{width:34px;height:34px;flex:none;border-radius:50%;background:#7a5000;color:#fff;display:flex;align-items:center;justify-content:center}
  .gn-notice.reply .gn-notice-ico{background:#0b4da2}
  .gn-notice-text{font-size:14px;line-height:1.45}
  .gn-notice-sub{font-size:12px;color:#475467}
  .gn-notice a{min-height:40px;display:inline-flex;align-items:center;padding:0 16px;border-radius:10px;background:#7a5000;color:#fff;text-decoration:none;font-weight:800;font-size:13px;white-space:nowrap}
  .gn-notice.reply a{background:#0b4da2}
  .gn-modal-back{position:fixed;inset:0;z-index:3000;background:rgba(10,28,52,.55);display:flex;align-items:center;justify-content:center;padding:18px}
  .gn-modal{width:100%;max-width:620px;background:#fff;border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 60px rgba(8,31,63,.3);font-family:Inter,Segoe UI,Arial,sans-serif;color:#172033}
  .gn-modal h3{margin:0;font-size:20px;color:#073b80}
  .gn-chip{min-height:32px;padding:0 12px;border:1px solid #c9d8ea;border-radius:999px;background:#fff;color:#073b80;font:600 12px Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
  .gn-err{color:#b42318;font-size:13px;font-weight:700}
  `;
  function injectCss() {
    if (document.getElementById('gn-css')) return;
    const s = document.createElement('style'); s.id = 'gn-css'; s.textContent = STYLE; document.head.appendChild(s);
  }

  /* ------------------------------------------------------------- datos */
  const state = { me: null, byActivity: new Map(), reads: new Set(), focusNoteId: null };

  async function loadReads() {
    const c = getClient();
    const { data, error } = await c.from('activity_note_reads').select('note_id').eq('user_id', state.me.id);
    if (!error) state.reads = new Set((data || []).map(r => r.note_id));
  }

  async function loadForActivities(ids) {
    state.byActivity = new Map();
    ids = [...new Set((ids || []).filter(Boolean))];
    if (!ids.length || !state.me) return state.byActivity;
    const c = getClient();
    const all = [];
    for (let i = 0; i < ids.length; i += 150) {
      const { data, error } = await c.from('activity_notes').select('*').in('activity_id', ids.slice(i, i + 150)).order('created_at', { ascending: true });
      if (error) { console.warn('Notas:', error.message); return state.byActivity; }
      all.push(...(data || []));
    }
    const tops = all.filter(n => !n.parent_id);
    tops.forEach(n => { n.replies = all.filter(r => r.parent_id === n.id); });
    tops.forEach(n => {
      if (!state.byActivity.has(n.activity_id)) state.byActivity.set(n.activity_id, []);
      state.byActivity.get(n.activity_id).push(n);
    });
    await loadReads();
    return state.byActivity;
  }

  function isUnreadForMe(n) {
    if (!state.me || n.author_id === state.me.id || state.reads.has(n.id)) return false;
    if (!n.parent_id) return n.target_owner === state.me.id;
    return true; // respuesta: se evalúa en el hilo (solo si la nota padre es mía)
  }

  async function markRead(ids) {
    ids = [...new Set(ids)].filter(id => id && !state.reads.has(id));
    if (!ids.length) return;
    ids.forEach(id => state.reads.add(id));
    const c = getClient();
    const { error } = await c.from('activity_note_reads').upsert(ids.map(id => ({ note_id: id, user_id: state.me.id })), { onConflict: 'note_id,user_id', ignoreDuplicates: true });
    if (error) console.warn('Marcar leídas:', error.message);
  }

  /* --------------------------------------------- hilo de notas en pantalla */
  function threadHtml(activityId, ownerProfile) {
    const me = state.me;
    const notes = state.byActivity.get(activityId) || [];
    const canAdd = canSendNoteTo(me, ownerProfile);
    if (!notes.length && !canAdd) return '';
    const parts = [];
    const focusHere = notes.some(n => n.id === state.focusNoteId || n.replies.some(r => r.id === state.focusNoteId));
    if (focusHere) parts.push('<span class="gn-focus-label">↓ Esta es la actividad con la nota que le dejaron</span>');
    notes.forEach(n => {
      const newTop = isUnreadForMe(n);
      const isFocus = n.id === state.focusNoteId;
      parts.push(`<div class="gn-note${isFocus ? ' gn-focus' : ''}" data-gn-note="${esc(n.id)}">
        <span class="gn-meta">Nota de ${esc(n.author_name || 'Usuario')} · ${esc(whenText(n.created_at))}${newTop ? '<span class="gn-new">NUEVA</span>' : ''}</span>
        <span class="gn-text">${esc(n.body)}</span></div>`);
      n.replies.forEach(r => {
        const mine = n.author_id === me.id;
        const newR = mine && r.author_id !== me.id && !state.reads.has(r.id);
        const rf = r.id === state.focusNoteId;
        parts.push(`<div class="gn-reply${rf ? ' gn-focus' : ''}" data-gn-note="${esc(r.id)}">
          <span class="gn-meta">Respuesta de ${esc(r.author_name || 'Usuario')} · ${esc(whenText(r.created_at))}${newR ? '<span class="gn-new">NUEVA</span>' : ''}</span>
          <span class="gn-text">${esc(r.body)}</span></div>`);
      });
      if (canReplyNote(me, n) && !n.replies.some(r => r.author_id === me.id)) {
        parts.push(`<div class="gn-replybox">
          <label class="gn-hint" for="gn-r-${esc(n.id)}"><strong style="color:#172033">Responder a ${esc(n.author_name || '')}</strong> · explique qué pasó y por qué</label>
          <textarea id="gn-r-${esc(n.id)}" data-gn-reply-text="${esc(n.id)}" placeholder="Escriba su respuesta…"></textarea>
          <div class="gn-row"><button type="button" class="gn-btn" data-gn-reply="${esc(n.id)}">Enviar respuesta</button><span class="gn-err" data-gn-err="${esc(n.id)}"></span></div>
        </div>`);
      }
    });
    if (canAdd) parts.push(`<button type="button" class="gn-add" data-gn-add="${esc(activityId)}">+ Agregar nota para ${esc(firstName(ownerProfile?.full_name))}</button>`);
    return `<div class="gn-wrap" data-gn-activity="${esc(activityId)}">${parts.join('')}</div>`;
  }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

  /* Enlaza botones dentro de un contenedor. opts.onChange() se llama después de guardar. */
  function bind(container, opts) {
    if (!container) return;
    container.querySelectorAll('[data-gn-add]').forEach(btn => btn.addEventListener('click', () => {
      const act = opts.activityById(btn.dataset.gnAdd);
      openComposer(act, opts.onChange);
    }));
    container.querySelectorAll('[data-gn-reply]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.gnReply;
      const ta = container.querySelector(`[data-gn-reply-text="${CSS.escape(id)}"]`);
      const err = container.querySelector(`[data-gn-err="${CSS.escape(id)}"]`);
      const body = (ta?.value || '').trim();
      if (!body) { if (err) err.textContent = 'Escriba su respuesta antes de enviarla.'; return; }
      btn.disabled = true; btn.textContent = 'Enviando…';
      const { error } = await getClient().from('activity_notes').insert({ parent_id: id, activity_id: opts.activityIdOfNote(id), body });
      if (error) { console.error(error); btn.disabled = false; btn.textContent = 'Enviar respuesta'; if (err) err.textContent = 'No se pudo enviar. Intente de nuevo.'; return; }
      await markRead([id]);
      await opts.onChange();
    }));
    // marcar como vistas las notas que se muestran (después de un momento)
    const visible = [];
    container.querySelectorAll('[data-gn-activity]').forEach(w => {
      (state.byActivity.get(w.dataset.gnActivity) || []).forEach(n => {
        if (isUnreadForMe(n)) visible.push(n.id);
        if (n.author_id === state.me.id) n.replies.forEach(r => { if (r.author_id !== state.me.id) visible.push(r.id); });
      });
    });
    if (visible.length) setTimeout(() => markRead(visible), 4000);
  }

  function activityIdOfNote(id) {
    for (const [aid, list] of state.byActivity) if (list.some(n => n.id === id)) return aid;
    return null;
  }

  /* ---------------------------------------------------- ventana de nota */
  const QUICK = ['No he tenido feedback de esto.', '¿Por qué esto sigue pendiente?', 'Me comentaste que ya terminaste: por favor actualiza el estado.'];
  function openComposer(act, onSaved) {
    if (!act) return;
    injectCss();
    const back = document.createElement('div');
    back.className = 'gn-modal-back';
    back.innerHTML = `<div class="gn-modal" role="dialog" aria-modal="true" aria-labelledby="gn-mt">
      <h3 id="gn-mt">Agregar nota</h3>
      <div style="font-size:14px;color:#475467;line-height:1.45">Para <strong>${esc(act.ownerName)}</strong> · ${esc(longDate(act.date))}, ${esc(rangeText(act.start, act.end))}<br>${esc(act.company || 'Sin empresa / contacto')} – ${esc(act.activity || 'Sin actividad')}</div>
      <div class="gn-row"><span class="gn-hint">Frases rápidas:</span>${QUICK.map((q, i) => `<button type="button" class="gn-chip" data-q="${i}">${esc(q)}</button>`).join('')}</div>
      <label for="gn-body" style="font-size:13px;font-weight:700">Nota</label>
      <textarea id="gn-body" rows="4" placeholder="Escriba su nota…"></textarea>
      <span class="gn-hint">${esc(firstName(act.ownerName))} verá un aviso al entrar a la agenda y podrá ver la nota junto a esta actividad.</span>
      <span class="gn-err" id="gn-merr"></span>
      <div class="gn-row" style="justify-content:flex-end"><button type="button" class="gn-btn ghost" id="gn-cancel">Cancelar</button><button type="button" class="gn-btn" id="gn-save">Guardar nota</button></div>
    </div>`;
    document.body.appendChild(back);
    const ta = back.querySelector('#gn-body');
    ta.focus();
    back.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { ta.value = QUICK[Number(b.dataset.q)]; ta.focus(); }));
    const close = () => back.remove();
    back.querySelector('#gn-cancel').addEventListener('click', close);
    back.addEventListener('click', e => { if (e.target === back) close(); });
    back.querySelector('#gn-save').addEventListener('click', async () => {
      const body = ta.value.trim();
      const err = back.querySelector('#gn-merr');
      if (!body) { err.textContent = 'Escriba la nota antes de guardarla.'; return; }
      const btn = back.querySelector('#gn-save'); btn.disabled = true; btn.textContent = 'Guardando…';
      const { error } = await getClient().from('activity_notes').insert({ activity_id: act.id, body });
      if (error) { console.error(error); btn.disabled = false; btn.textContent = 'Guardar nota'; err.textContent = 'No se pudo guardar la nota. ' + (error.message || ''); return; }
      close();
      if (onSaved) await onSaved();
    });
  }

  /* ------------------------------------------------------------- avisos */
  async function unreadNotices(profilesById) {
    const me = state.me; if (!me) return [];
    const c = getClient();
    const since = new Date(); since.setDate(since.getDate() - 60);
    const sinceIso = since.toISOString();
    const [toMe, mine] = await Promise.all([
      c.from('activity_notes').select('*').eq('target_owner', me.id).is('parent_id', null).neq('author_id', me.id).gte('created_at', sinceIso),
      c.from('activity_notes').select('id,activity_id,target_owner').eq('author_id', me.id).is('parent_id', null).gte('created_at', sinceIso)
    ]);
    if (toMe.error || mine.error) { console.warn('Avisos:', (toMe.error || mine.error).message); return []; }
    let replies = [];
    const mineIds = (mine.data || []).map(n => n.id);
    for (let i = 0; i < mineIds.length; i += 150) {
      const r = await c.from('activity_notes').select('*').in('parent_id', mineIds.slice(i, i + 150)).neq('author_id', me.id);
      if (!r.error) replies.push(...(r.data || []));
    }
    await loadReads();
    const items = [
      ...(toMe.data || []).filter(n => !state.reads.has(n.id)).map(n => ({ kind: 'note', note: n })),
      ...replies.filter(n => !state.reads.has(n.id)).map(n => ({ kind: 'reply', note: n }))
    ];
    if (!items.length) return [];
    const actIds = [...new Set(items.map(i => i.note.activity_id))];
    const { data: acts } = await c.from('commercial_calendar').select('id,owner_id,agenda_date,start_time,end_time,company_contact,activity').in('id', actIds);
    const byId = new Map((acts || []).map(a => [a.id, a]));
    return items.map(i => ({ ...i, activity: byId.get(i.note.activity_id), owner: profilesById?.get(i.note.target_owner) }))
      .filter(i => i.activity)
      .sort((a, b) => String(b.note.created_at).localeCompare(String(a.note.created_at)));
  }

  function noticesHtml(items, linkFor) {
    if (!items.length) return '';
    const bell = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>';
    const chat = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    return `<div class="gn-notices" role="status">${items.map(i => {
      const a = i.activity;
      const when = `${longDate(a.agenda_date)}, ${rangeText(a.start_time, a.end_time)}`;
      const isReply = i.kind === 'reply';
      const ownerTxt = isReply && i.owner && i.owner.id !== state.me.id ? ` de ${esc(firstName(i.owner.full_name))}` : '';
      const end = /\.$/.test(when) ? '' : '.';
      const main = isReply
        ? `<strong>${esc(i.note.author_name)} le respondió su nota</strong> en la actividad${ownerTxt} del <strong>${esc(when)}</strong>${end}`
        : `<strong>${esc(i.note.author_name)} le dejó una nota</strong> en su actividad del <strong>${esc(when)}</strong>${end}`;
      return `<div class="gn-notice${isReply ? ' reply' : ''}">
        <div class="gn-notice-main"><span class="gn-notice-ico">${isReply ? chat : bell}</span>
          <div><div class="gn-notice-text">${main}</div><div class="gn-notice-sub">${esc(a.company_contact || 'Sin empresa / contacto')} – ${esc(a.activity || 'Sin actividad')}</div></div></div>
        <a href="${esc(linkFor(i))}">${isReply ? 'Haga clic aquí para ver la respuesta' : 'Haga clic aquí para verla'}</a>
      </div>`;
    }).join('')}</div>`;
  }

  /* Busca una nota por id (desde un enlace ?nota=) y devuelve su actividad. */
  async function resolveNoteLink(noteId) {
    if (!noteId) return null;
    const c = getClient();
    const { data: n, error } = await c.from('activity_notes').select('*').eq('id', noteId).maybeSingle();
    if (error || !n) return null;
    const { data: a } = await c.from('commercial_calendar').select('id,owner_id,agenda_date,start_time,end_time').eq('id', n.activity_id).maybeSingle();
    if (!a) return null;
    state.focusNoteId = n.id;
    return { note: n, activity: a };
  }

  window.GUPS = {
    getClient, esc, parseISO, isoDate, longDate, ampm, rangeText, whenText, weeklyPhrase, firstName,
    canSendNoteTo, canReplyNote, homePageFor, injectCss,
    notes: {
      state, setMe(p) { state.me = p; }, loadForActivities, threadHtml, bind, markRead, activityIdOfNote,
      openComposer, unreadNotices, noticesHtml, resolveNoteLink,
      setFocus(id) { state.focusNoteId = id; }
    }
  };
})();
