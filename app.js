/* Infina — dibuat untuk dipakai sendiri, pasangan, dan keluarga. */
(function(){
'use strict';
/* =====================================================================
   Infina — core: utilities, state, sync engine, backends, workspaces
   ===================================================================== */

/* ---------- utilities ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); };
const todayISO = () => iso(new Date());
const curYM = () => todayISO().slice(0,7);
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate()+n); return iso(d); };
const addMonths = (s, n) => { const d = parseISO(s); const day = d.getDate(); const t = new Date(d.getFullYear(), d.getMonth()+n, 1); const last = new Date(t.getFullYear(), t.getMonth()+1, 0).getDate(); t.setDate(Math.min(day, last)); return iso(t); };
const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const ymShift = (ym, n) => { const [y,m] = ym.split('-').map(Number); const d = new Date(y, m-1+n, 1); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; };
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MON3 = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DOW = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const ymLabel = ym => { const [y,m] = ym.split('-').map(Number); return `${MONTHS[m-1]} ${y}`; };
const fmtDate = s => { if (!s) return '—'; const d = parseISO(s); return `${d.getDate()} ${MON3[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDateShort = s => { const d = parseISO(s); return `${d.getDate()} ${MON3[d.getMonth()]}`; };
const fmtDateLong = s => { const d = parseISO(s); return `${['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtStamp = ms => new Date(ms).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' });
const rp = n => (n < 0 ? '−' : '') + 'Rp' + Math.round(Math.abs(n || 0)).toLocaleString('id-ID');
const compact = n => { const a = Math.abs(n); if (a >= 1e9) return (n/1e9).toLocaleString('id-ID',{maximumFractionDigits:1})+' M'; if (a >= 1e6) return (n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' jt'; if (a >= 1e3) return (n/1e3).toLocaleString('id-ID',{maximumFractionDigits:0})+' rb'; return String(Math.round(n)); };
const clone = o => JSON.parse(JSON.stringify(o));
const relDue = days => days < 0 ? `terlambat ${-days} hari` : days === 0 ? 'hari ini (H-0)' : days === 1 ? 'besok (H-1)' : `H-${days}`;
const initials = name => String(name || '?').trim().split(/\s+/).slice(0,2).map(w => w[0] || '').join('').toUpperCase() || '?';
const firstName = name => String(name || '').trim().split(/\s+/)[0] || '';
function stable(v){
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e) { return false; } };

const ICON = {
  dash:'<path d="M3 13h8V3H3zM13 21h8v-8h-8zM3 21h8v-6H3zM13 3v8h8V3z"/>',
  tx:'<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  acc:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  bud:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/>',
  rec:'<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
  debt:'<path d="M4 4h16v16H4zM8 9h8M8 13h5"/>',
  goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  split:'<circle cx="7" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-3 2.2-5 5-5s5 2 5 5M12 20c0-3 2.2-5 5-5s5 2 5 5"/>',
  task:'<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  ring:'<circle cx="12" cy="14" r="6"/><path d="M9 4h6l-1.5 4h-3z"/>',
  plane:'<path d="M10.5 13.5 3 11l1.5-1.5 8 1 4-4a2.1 2.1 0 0 1 3 3l-4 4 1 8L15 23l-2.5-7.5L9 19v3l-1.5 1-1-3.5L3 18.5 4 17h3z"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  habit:'<path d="M12 3a9 9 0 1 0 9 9"/><path d="m9 12 2.5 2.5L21 5"/>',
  book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3"/><path d="M20 4v14h-6"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6"/>',
  set:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
};
const ic = (n, s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;
const MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 16c0-3 2.4-5 5-5 4.5 0 6.5 10 11 10 2.6 0 5-2 5-5s-2.4-5-5-5c-4.5 0-6.5 10-11 10-2.6 0-5-2-5-5z" fill="none" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round"/></svg>';

/* ---------- state ---------- */
const KINDS = ['settings','accounts','categories','txns','budgets','recurring','debts','goals','tasks','events','projects',
  'wedding','wbudget','vendors','wpays','guests','inspo','trips','itin','bookings','packing','lifegoals','habits','journal','activity'];
const S = {}; KINDS.forEach(k => S[k] = []);
let synced = {};                 // kind -> Map(id -> stable json) of what the store holds
let backend = null;              // cloud or local backend
let wsReady = false, fatal = '', bootNote = '';
const ui = { txMonth: curYM(), txType:'all', txAcc:'all', txCat:'all', txQ:'', txVoid:false, txPage:1,
  budMonth: curYM(), taskView:'list', taskProject:'all', taskShowDone:false, calMonth: curYM(), notifOpen:false,
  wTab:'ringkasan', gGroup:'all', gRsvp:'all', gQ:'', inspoKind:'all', tripId:null, tripTab:'itinerary',
  goalCat:'all', jQ:'', jType:'all' };

function resetData(){ KINDS.forEach(k => S[k] = []); synced = {}; }

/* Sync engine: persist(kind) writes only items that changed since the store last confirmed them. */
const writeQueue = [];
let writing = false;
function persist(kind){
  if (!backend || !canWrite()) return;
  const prev = synced[kind] || new Map(), cur = new Map(), sets = [], dels = [];
  S[kind].forEach(x => { if (!x || !x.id) return; const j = stable(x); cur.set(x.id, j); if (prev.get(x.id) !== j) sets.push(clone(x)); });
  prev.forEach((_, id) => { if (!cur.has(id)) dels.push(id); });
  synced[kind] = cur;
  if (!sets.length && !dels.length) return;
  writeQueue.push({ kind, sets, dels });
  drain();
}
const persistMany = kinds => Array.from(new Set(kinds)).forEach(persist);
async function drain(){
  if (writing) return; writing = true;
  while (writeQueue.length) {
    const job = writeQueue.shift();
    try { await backend.write(job.kind, job.sets, job.dels); }
    catch(e) {
      const code = e && e.code;
      toast(code === 'permission-denied' ? 'Anda tidak punya izin mengubah data di workspace ini.' : 'Gagal menyimpan. ' + ((e && e.message) || 'Periksa koneksi lalu coba lagi.'), 'neg');
    }
  }
  writing = false;
}
function applyRemote(changes){
  // changes: [{type:'added'|'modified'|'removed', kind, id, data}]
  const touched = new Set();
  changes.forEach(c => { if (!KINDS.includes(c.kind)) return; touched.add(c.kind); });
  const idx = {};
  touched.forEach(k => { idx[k] = new Map(S[k].map((x, i) => [x.id, i])); synced[k] = synced[k] || new Map(); });
  changes.forEach(c => {
    if (!KINDS.includes(c.kind)) return;
    const k = c.kind, i = idx[k].get(c.id);
    if (c.type === 'removed') { if (i !== undefined) S[k][i] = null; synced[k].delete(c.id); return; }
    const item = c.data; item.id = c.id;
    if (i !== undefined) S[k][i] = item; else { idx[k].set(c.id, S[k].length); S[k].push(item); }
    synced[k].set(c.id, stable(item));
  });
  touched.forEach(k => { S[k] = S[k].filter(Boolean); });
}

/* ---------- backends ---------- */
const CFG = window.INFINA_FIREBASE_CONFIG || {};
const cloudConfigured = !!(CFG.apiKey && CFG.projectId && CFG.appId);

function makeLocalBackend(){
  const P = 'infina:local:';
  let ok = lsSet(P + '__probe', 1);
  const ws = { id:'local', name:'Pribadi', type:'personal', ownerId:'me', members:{ me:'owner' }, memberIds:['me'], memberInfo:{ me:{ name:'Saya', email:'' } } };
  return {
    mode: ok ? 'local' : 'memory',
    user: { uid:'me', name:'', email:'', photo:'' },
    workspaces: [ws], activeWs: ws, invitesIn: [], invitesOut: [],
    async write(kind){ if (ok) lsSet(P + kind, S[kind]); },
    open(){ resetData(); KINDS.forEach(k => { const v = lsGet(P + k, []); S[k] = Array.isArray(v) ? v : []; synced[k] = new Map(S[k].map(x => [x.id, stable(x)])); }); wsReady = true; onWsReady(true); render(); },
    async wipe(){ KINDS.forEach(k => { try { localStorage.removeItem(P + k); } catch(e){} }); }
  };
}

function makeCloudBackend(){
  const app = firebase.initializeApp(CFG);
  const auth = firebase.auth(), db = firebase.firestore();
  try { db.enablePersistence({ synchronizeTabs:true }).catch(() => {}); } catch(e) {}
  const FV = firebase.firestore.FieldValue;
  let unsubItems = null, unsubWs = null, unsubInvIn = null, unsubInvOut = null, firstWs = true;
  const B = {
    mode:'cloud', app, auth, db, user:null, workspaces:[], activeWs:null, invitesIn:[], invitesOut:[],
    itemsRef(){ return db.collection('workspaces').doc(B.activeWs.id).collection('items'); },
    async write(kind, sets, dels){
      const ops = sets.map(x => ['set', x]).concat(dels.map(id => ['del', id]));
      for (let i = 0; i < ops.length; i += 400) {
        const batch = db.batch(), ref = B.itemsRef();
        ops.slice(i, i + 400).forEach(([op, v]) => { if (op === 'set') { const d = Object.assign({}, v, { _k: kind }); batch.set(ref.doc(v.id), d); } else batch.delete(ref.doc(v)); });
        await batch.commit();
      }
    },
    signIn(){
      const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' });
      return auth.signInWithPopup(p).catch(e => {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return auth.signInWithRedirect(p);
        if (e && e.code === 'auth/popup-closed-by-user') return;
        if (e && e.code === 'auth/unauthorized-domain') { fatal = 'Domain ini belum diizinkan di Firebase. Buka Firebase Console → Authentication → Settings → Authorized domains, lalu tambahkan ' + location.hostname + '.'; render(); return; }
        toast('Gagal masuk: ' + ((e && e.message) || 'coba lagi'), 'neg');
      });
    },
    signOut(){ return auth.signOut(); },
    start(){
      auth.getRedirectResult().catch(() => {});
      auth.onAuthStateChanged(u => {
        if (unsubItems) unsubItems(); if (unsubWs) unsubWs(); if (unsubInvIn) unsubInvIn(); if (unsubInvOut) unsubInvOut();
        unsubItems = unsubWs = unsubInvIn = unsubInvOut = null;
        resetData(); wsReady = false; firstWs = true; B.workspaces = []; B.activeWs = null; B.invitesIn = []; B.invitesOut = [];
        if (!u) { B.user = null; render(); return; }
        B.user = { uid:u.uid, name:u.displayName || (u.email || '').split('@')[0], email:(u.email || '').toLowerCase(), photo:u.photoURL || '' };
        render();
        unsubWs = db.collection('workspaces').where('memberIds', 'array-contains', u.uid).onSnapshot(snap => {
          B.workspaces = snap.docs.map(d => Object.assign({ id:d.id }, d.data())).sort((a, b) => (a.type === 'personal' ? -1 : 0) - (b.type === 'personal' ? -1 : 0) || String(a.name).localeCompare(String(b.name)));
          const pid = 'personal_' + u.uid;
          if (!snap.metadata.fromCache && !B.workspaces.some(w => w.id === pid)) {
            db.collection('workspaces').doc(pid).set({ name:'Pribadi', type:'personal', ownerId:u.uid, members:{ [u.uid]:'owner' }, memberIds:[u.uid],
              memberInfo:{ [u.uid]:{ name:B.user.name, email:B.user.email } }, createdAt:Date.now(), updatedAt:Date.now() })
              .catch(e => { fatal = 'Tidak bisa membuat workspace pribadi (' + (e.code || e.message) + '). Pastikan aturan keamanan dari firestore.rules sudah dipasang.'; render(); });
            return;
          }
          if (!B.workspaces.length) return;
          const cur = B.activeWs && B.workspaces.find(w => w.id === B.activeWs.id);
          if (cur) { B.activeWs = cur; subscribeOut(); render(); return; }
          if (B.activeWs && !cur) toast('Anda tidak lagi menjadi anggota workspace itu.');
          const want = lsGet('infina:activeWs:' + u.uid, null);
          B.switchTo((B.workspaces.find(w => w.id === want) || B.workspaces[0]).id);
        }, err => { fatal = 'Tidak bisa membaca workspace (' + (err.code || err.message) + '). Pastikan aturan keamanan dari firestore.rules sudah dipasang.'; render(); });
        unsubInvIn = db.collection('invites').where('email', '==', B.user.email).onSnapshot(snap => {
          B.invitesIn = snap.docs.map(d => Object.assign({ id:d.id }, d.data())); render();
        }, () => {});
      });
    },
    switchTo(id){
      const ws = B.workspaces.find(w => w.id === id); if (!ws) return;
      if (unsubItems) unsubItems(); unsubItems = null;
      B.activeWs = ws; lsSet('infina:activeWs:' + B.user.uid, id);
      resetData(); wsReady = false; render();
      let timer = setTimeout(() => { if (!wsReady) { bootNote = 'Data belum bisa dijangkau. Periksa koneksi internet; halaman memuat otomatis setelah tersambung.'; render(); } }, 10000);
      let definitive = false;
      const wsId = id;
      unsubItems = B.itemsRef().onSnapshot(snap => {
        if (!B.activeWs || B.activeWs.id !== wsId) return;
        const ch = snap.docChanges().map(c => { const d = c.doc.data(); const kind = d._k; delete d._k; return { type:c.type, kind, id:c.doc.id, data:d }; });
        if (ch.length) applyRemote(ch);
        if (!definitive && !snap.metadata.fromCache) { definitive = true; clearTimeout(timer); bootNote = ''; wsReady = true; onWsReady(true); }
        else if (!wsReady && snap.size) { wsReady = true; onWsReady(false); }
        scheduleRender();
      }, err => { clearTimeout(timer); fatal = 'Tidak bisa membaca data workspace (' + (err.code || err.message) + ').'; render(); });
      subscribeOut();
    },
    async createWorkspace(name){
      const id = uid('ws'), u = B.user;
      await db.collection('workspaces').doc(id).set({ name, type:'shared', ownerId:u.uid, members:{ [u.uid]:'owner' }, memberIds:[u.uid],
        memberInfo:{ [u.uid]:{ name:u.name, email:u.email } }, createdAt:Date.now(), updatedAt:Date.now() });
      return id;
    },
    wsRef(){ return db.collection('workspaces').doc(B.activeWs.id); },
    renameWs(name){ return B.wsRef().update({ name, updatedAt:Date.now() }); },
    invite(email, role){ const ws = B.activeWs; return db.collection('invites').doc(ws.id + '__' + email).set({ wsId:ws.id, wsName:ws.name, email, role, invitedBy:B.user.uid, invitedByName:B.user.name, createdAt:Date.now() }); },
    cancelInvite(id){ return db.collection('invites').doc(id).delete(); },
    async acceptInvite(inv){
      const u = B.user;
      await db.collection('workspaces').doc(inv.wsId).update({ ['members.' + u.uid]: inv.role, memberIds: FV.arrayUnion(u.uid), ['memberInfo.' + u.uid]: { name:u.name, email:u.email }, updatedAt:Date.now() });
      await db.collection('invites').doc(inv.id).delete().catch(() => {});
      lsSet('infina:activeWs:' + u.uid, inv.wsId);
    },
    declineInvite(inv){ return db.collection('invites').doc(inv.id).delete(); },
    setRole(memberUid, role){ return B.wsRef().update({ ['members.' + memberUid]: role, updatedAt:Date.now() }); },
    removeMember(memberUid){ return B.wsRef().update({ ['members.' + memberUid]: FV.delete(), memberIds: FV.arrayRemove(memberUid), ['memberInfo.' + memberUid]: FV.delete(), updatedAt:Date.now() }); },
    leave(){ return B.removeMember(B.user.uid); },
    transfer(toUid){ return B.wsRef().update({ ownerId:toUid, ['members.' + toUid]:'owner', ['members.' + B.user.uid]:'editor', updatedAt:Date.now() }); },
    async deleteWs(){
      const ref = B.wsRef(), items = await ref.collection('items').get();
      for (let i = 0; i < items.docs.length; i += 400) { const b = db.batch(); items.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
      const inv = await db.collection('invites').where('wsId', '==', B.activeWs.id).where('invitedBy', '==', B.user.uid).get().catch(() => null);
      if (inv) for (const d of inv.docs) await d.ref.delete().catch(() => {});
      await ref.delete();
      lsSet('infina:activeWs:' + B.user.uid, 'personal_' + B.user.uid);
    },
    async wipe(){
      const items = await B.itemsRef().get();
      for (let i = 0; i < items.docs.length; i += 400) { const b = db.batch(); items.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    }
  };
  function subscribeOut(){
    if (unsubInvOut) { unsubInvOut(); unsubInvOut = null; }
    B.invitesOut = [];
    const ws = B.activeWs; if (!ws || ws.type !== 'shared' || ws.ownerId !== B.user.uid) return;
    unsubInvOut = db.collection('invites').where('wsId', '==', ws.id).where('invitedBy', '==', B.user.uid).onSnapshot(snap => {
      B.invitesOut = snap.docs.map(d => Object.assign({ id:d.id }, d.data())); scheduleRender();
    }, () => {});
  }
  return B;
}

/* ---------- workspace & permissions ---------- */
const me = () => backend && backend.user ? backend.user.uid : 'me';
const WS = () => backend && backend.activeWs;
const isShared = () => !!(WS() && WS().type === 'shared');
const myRole = () => (WS() && WS().members && WS().members[me()]) || 'viewer';
const canWrite = () => ['owner','editor'].includes(myRole());
const isOwner = () => myRole() === 'owner';
const ROLE = { owner:'Pemilik', editor:'Editor', viewer:'Hanya lihat' };
const memberIds = () => (WS() && WS().memberIds) || [me()];
const memberName = id => { const info = WS() && WS().memberInfo && WS().memberInfo[id]; if (id === me()) return 'Anda'; return (info && (info.name || info.email)) || 'Mantan anggota'; };
const memberFull = id => { const info = WS() && WS().memberInfo && WS().memberInfo[id]; return (info && (info.name || info.email)) || 'Mantan anggota'; };

function logAct(text){
  if (!isShared()) return;
  S.activity.push({ id: uid('act'), at: Date.now(), by: me(), byName: backend.user ? backend.user.name : '', text });
  if (S.activity.length > 200) S.activity = S.activity.sort((a, b) => a.at - b.at).slice(-200);
  persist('activity');
}

/* modules toggle per workspace */
const MODULES = { finance:'Keuangan', planner:'Tugas & Kalender', wedding:'Wedding planner', travel:'Travel planner', growth:'Tujuan, kebiasaan & jurnal' };
function settings(){ return S.settings.find(x => x.id === 'settings') || { id:'settings', modules:{} }; }
const modOn = m => settings().modules[m] !== false;

/* ---------- scheduling renders ---------- */
let renderPending = false;
function scheduleRender(){ if (renderPending) return; renderPending = true; requestAnimationFrame(() => { renderPending = false; render(); }); }
/* =====================================================================
   Domain rules: ledger, balances, budgets, recurring, debts, split, modules
   ===================================================================== */
const ACC_TYPES = { bank:'Bank', cash:'Tunai', ewallet:'E-wallet', credit_card:'Kartu kredit' };
const TX_TYPES = { expense:'Pengeluaran', income:'Pemasukan', transfer:'Transfer', adjustment:'Penyesuaian', settlement:'Pelunasan' };
const DEBT_KINDS = { pinjaman:'Pinjaman', cicilan:'Cicilan barang', paylater:'PayLater', pribadi:'Utang pribadi', lainnya:'Lainnya' };
const PRIO = { tinggi:'Tinggi', sedang:'Sedang', rendah:'Rendah' };
const STATUS = { todo:'Belum mulai', doing:'Dikerjakan', done:'Selesai' };
const FREQ = { daily:'Harian', weekly:'Mingguan', monthly:'Bulanan' };
const REPEAT = { none:'Sekali', weekly:'Setiap minggu', monthly:'Setiap bulan', yearly:'Setiap tahun' };
const SPLIT_MODES = { equal:'Rata', percent:'Persentase', amount:'Nominal' };

const acc = id => S.accounts.find(a => a.id === id);
const cat = id => S.categories.find(c => c.id === id);
const accName = id => id ? ((acc(id) || {}).name || '—') : 'Uang pribadi';
const catName = id => (cat(id) || {}).name || 'Tanpa kategori';
const activeAccounts = () => S.accounts.filter(a => a.active !== false);
const sortedCats = kind => S.categories.filter(c => !kind || c.kind === kind).sort((a, b) => (a.ord ?? 999) - (b.ord ?? 999) || a.name.localeCompare(b.name));
const posted = t => t.status === 'posted';
const vendor = id => S.vendors.find(v => v.id === id);
const trip = id => S.trips.find(t => t.id === id);

function mkTx(f){
  const now = Date.now();
  return Object.assign({ id: uid('tx'), date: todayISO(), type:'expense', amount:0, accountId:null, toAccountId:null, categoryId:null,
    desc:'', note:'', status:'posted', currency:'IDR', dir:1, debtId:null, recurringId:null, vendorId:null, tripId:null, schedId:null,
    paidBy:null, toMember:null, split:null, sample:false, createdAt:now, updatedAt:now, createdBy: me(), history:[] }, f);
}
const sortTx = arr => arr.slice().sort((a, b) => a.date === b.date ? (b.createdAt || 0) - (a.createdAt || 0) : (a.date < b.date ? 1 : -1));

function balances(){
  const b = {}; S.accounts.forEach(a => b[a.id] = Number(a.opening) || 0);
  S.txns.forEach(t => {
    if (!posted(t)) return;
    const A = Number(t.amount) || 0;
    const add = (id, v) => { if (id) b[id] = (b[id] || 0) + v; };
    if (t.type === 'income') add(t.accountId, A);
    else if (t.type === 'expense') add(t.accountId, -A);
    else if (t.type === 'transfer') { add(t.accountId, -A); add(t.toAccountId, A); }
    else if (t.type === 'adjustment') add(t.accountId, t.dir < 0 ? -A : A);
  });
  return b;
}
function monthTotals(ym){
  let inc = 0, exp = 0;
  S.txns.forEach(t => { if (!posted(t) || t.date.slice(0,7) !== ym) return; if (t.type === 'income') inc += +t.amount; else if (t.type === 'expense') exp += +t.amount; });
  return { inc, exp };
}
function spendByCat(ym){
  const m = {}; S.txns.forEach(t => { if (posted(t) && t.type === 'expense' && t.date.slice(0,7) === ym) m[t.categoryId || ''] = (m[t.categoryId || ''] || 0) + (+t.amount); });
  return m;
}
function budgetRows(ym){
  const sp = spendByCat(ym), prev = spendByCat(ymShift(ym, -1));
  return S.budgets.filter(b => b.month === ym).map(b => {
    const spent = sp[b.categoryId] || 0, pct = b.limit > 0 ? spent / b.limit : 0;
    return { b, spent, pct, left: b.limit - spent, prev: prev[b.categoryId] || 0 };
  }).sort((x, y) => y.pct - x.pct);
}
function* occurrences(r, to){
  for (let k = 0; k < 3000; k++) {
    const d = r.freq === 'monthly' ? addMonths(r.start, k) : addDays(r.start, k * (r.freq === 'weekly' ? 7 : 1));
    if (d > to || (r.end && d > r.end)) return;
    yield d;
  }
}
function nextOccurrence(r){
  if (r.paused) return null; const t = todayISO();
  for (const d of occurrences(r, addDays(t, 400))) if (d > t) return d;
  return null;
}
function runRecurring(){
  if (!canWrite()) return;
  const t = todayISO(), have = new Set(S.txns.map(x => x.id)); let n = 0;
  S.recurring.forEach(r => {
    if (r.paused) return;
    for (const d of occurrences(r, t)) {
      const id = `r_${r.id}_${d}`;
      if (have.has(id)) continue;
      if (n >= 600) break;
      S.txns.push(mkTx({ id, date:d, type:r.type, amount:r.amount, accountId:r.accountId, toAccountId:r.toAccountId || null,
        categoryId:r.categoryId || null, desc:r.desc, recurringId:r.id, sample:!!r.sample, note:'Dibuat otomatis dari transaksi berulang' }));
      have.add(id); n++;
    }
  });
  if (n) { persist('txns'); toast(`${n} transaksi berulang dicatat otomatis`); }
}
function debtInfo(d){
  const total = d.installment * d.count;
  const pays = S.txns.filter(t => posted(t) && t.debtId === d.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const paid = pays.reduce((s, t) => s + (+t.amount), 0);
  const paidCount = Math.min(d.count, Math.floor(paid / d.installment + 1e-9));
  const remaining = Math.max(0, total - paid);
  const done = remaining <= 0;
  const nextDue = done ? null : addMonths(d.firstDue, paidCount);
  return { total, paid, paidCount, remaining, done, nextDue, pays };
}
function goalInfo(g, bal){
  const cur = Math.max(0, bal[g.accountId] || 0), pct = g.target > 0 ? Math.min(1, cur / g.target) : 0;
  let perMonth = null;
  if (g.deadline && cur < g.target) {
    const t = parseISO(todayISO()), dl = parseISO(g.deadline);
    const months = Math.max(1, (dl.getFullYear() - t.getFullYear()) * 12 + dl.getMonth() - t.getMonth());
    perMonth = (g.target - cur) / months;
  }
  return { cur, pct, perMonth };
}
function ccDueDate(a){
  if (!a.dueDay) return null;
  const t = todayISO(), now = parseISO(t), dim = (y, m) => new Date(y, m + 1, 0).getDate();
  let d = new Date(now.getFullYear(), now.getMonth(), Math.min(a.dueDay, dim(now.getFullYear(), now.getMonth())));
  if (iso(d) < t) d = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(a.dueDay, dim(now.getFullYear(), now.getMonth() + 1)));
  return iso(d);
}

/* ----- shared expenses: who paid, who owes ----- */
function sharesOf(t){
  if (!t.split || !t.split.shares) return null;
  const A = Math.round(+t.amount), ids = Object.keys(t.split.shares).filter(k => t.split.shares[k] !== null && t.split.shares[k] !== false);
  if (!ids.length) return null;
  const out = {};
  if (t.split.mode === 'equal') {
    const each = Math.floor(A / ids.length); let rest = A - each * ids.length;
    ids.forEach(id => { out[id] = each; });
    const payerIn = ids.includes(t.paidBy) ? t.paidBy : ids[0];
    out[payerIn] += rest;
  } else if (t.split.mode === 'percent') {
    let sum = 0; ids.forEach(id => { out[id] = Math.round(A * (+t.split.shares[id] || 0) / 100); sum += out[id]; });
    out[ids[0]] += A - sum;
  } else {
    ids.forEach(id => { out[id] = Math.round(+t.split.shares[id] || 0); });
  }
  return out;
}
function splitBalances(){
  const net = {}; memberIds().forEach(id => net[id] = 0);
  S.txns.forEach(t => {
    if (!posted(t)) return;
    if (t.type === 'expense' && t.split && t.paidBy) {
      const sh = sharesOf(t); if (!sh) return;
      net[t.paidBy] = (net[t.paidBy] || 0) + Math.round(+t.amount);
      Object.entries(sh).forEach(([id, v]) => { net[id] = (net[id] || 0) - v; });
    } else if (t.type === 'settlement' && t.paidBy && t.toMember) {
      net[t.paidBy] = (net[t.paidBy] || 0) + Math.round(+t.amount);
      net[t.toMember] = (net[t.toMember] || 0) - Math.round(+t.amount);
    }
  });
  return net;
}
function settleSuggestions(net){
  const cred = [], debt = [];
  Object.entries(net).forEach(([id, v]) => { if (v > 0) cred.push([id, v]); else if (v < 0) debt.push([id, -v]); });
  cred.sort((a, b) => b[1] - a[1]); debt.sort((a, b) => b[1] - a[1]);
  const out = []; let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i][1], cred[j][1]);
    if (amt > 0) out.push({ from: debt[i][0], to: cred[j][0], amount: amt });
    debt[i][1] -= amt; cred[j][1] -= amt;
    if (debt[i][1] <= 0) i++; if (cred[j][1] <= 0) j++;
  }
  return out;
}

/* ----- events ----- */
function expandEvents(ym){
  const [y, m] = ym.split('-').map(Number); const first = `${ym}-01`; const last = iso(new Date(y, m, 0));
  const out = [];
  S.events.forEach(e => {
    if (!e.repeat || e.repeat === 'none') { if (e.date >= first && e.date <= last) out.push({ e, date:e.date }); return; }
    for (let k = 0; k < 1200; k++) {
      const d = e.repeat === 'weekly' ? addDays(e.date, 7*k) : e.repeat === 'monthly' ? addMonths(e.date, k) : addMonths(e.date, 12*k);
      if (d > last) break; if (d >= first) out.push({ e, date:d });
    }
  });
  return out.sort((a, b) => (a.date + (a.e.time || '')).localeCompare(b.date + (b.e.time || '')));
}
function upcomingEvents(days){
  const t = todayISO(), end = addDays(t, days), out = [];
  [curYM(), ymShift(curYM(), 1)].forEach(ym => expandEvents(ym).forEach(x => { if (x.date >= t && x.date <= end) out.push(x); }));
  return out;
}

/* ----- wedding ----- */
const WED_CATS = ['Venue','Katering','Dekorasi','Dokumentasi','Busana','Makeup','Undangan','Souvenir','Hiburan','Transportasi','Lainnya'];
const VENDOR_STATUS = { kandidat:'Kandidat', negosiasi:'Negosiasi', dipilih:'Dipilih', ditolak:'Tidak dipilih' };
const RSVP = { belum:'Belum jawab', hadir:'Hadir', mungkin:'Mungkin', tidak:'Tidak hadir' };
const INSPO_KINDS = ['Konsep','Dekorasi','Busana','Makeup','Undangan','Dokumentasi','Lainnya'];
const weddingInfo = () => S.wedding.find(w => w.id === 'wedding') || null;
function vendorPaid(vId){ return S.txns.filter(t => posted(t) && t.vendorId === vId).reduce((s, t) => s + (+t.amount), 0); }
function wpayStatus(p){ const t = p.txnId && S.txns.find(x => x.id === p.txnId); return t && posted(t) ? 'paid' : 'open'; }
function weddingTotals(){
  const est = S.wbudget.reduce((s, b) => s + (+b.estimate || 0), 0);
  const chosen = S.vendors.filter(v => v.status === 'dipilih');
  const contract = chosen.reduce((s, v) => s + (+v.contract || 0), 0);
  const paid = S.txns.filter(t => posted(t) && t.vendorId).reduce((s, t) => s + (+t.amount), 0);
  const owed = chosen.reduce((s, v) => s + Math.max(0, (+v.contract || 0) - vendorPaid(v.id)), 0);
  return { est, contract, paid, owed, left: est - paid };
}
const isWeddingTask = k => !!k.wedding;

/* ----- travel ----- */
const TRIP_STATUS = { impian:'Impian', rencana:'Direncanakan', selesai:'Selesai' };
const BOOK_KINDS = ['Penerbangan','Hotel','Kereta','Bus/Travel','Sewa kendaraan','Aktivitas','Lainnya'];
const tripSpent = id => S.txns.filter(t => posted(t) && t.tripId === id && t.type === 'expense').reduce((s, t) => s + (+t.amount), 0);
const tripDays = t => { if (!t.start || !t.end) return []; const out = []; for (let d = t.start; d <= t.end && out.length < 60; d = addDays(d, 1)) out.push(d); return out; };

/* ----- growth ----- */
const GOAL_CATS = ['Keuangan','Karier','Hubungan','Pendidikan','Kesehatan & gaya hidup','Keluarga','Pengembangan diri','Perjalanan'];
const GOAL_STATUS = { aktif:'Aktif', tercapai:'Tercapai', ditunda:'Ditunda' };
const J_TYPES = { harian:'Catatan harian', refleksi:'Refleksi bulanan', tahunan:'Tinjauan tahunan', ide:'Ide' };
const MOODS = ['Berat','Kurang','Biasa','Baik','Sangat baik'];
function goalProgress(g){
  if (g.savingsGoalId) { const sg = S.goals.find(x => x.id === g.savingsGoalId); if (sg) return goalInfo(sg, balances()).pct; }
  const ms = g.milestones || []; if (!ms.length) return g.status === 'tercapai' ? 1 : 0;
  return ms.filter(m => m.done).length / ms.length;
}
function habitDone(h, d){ return !!(h.logs && h.logs[d]); }
function habitStreak(h){
  const t = todayISO();
  if (h.freq === 'weekly') {
    const target = Math.max(1, +h.target || 1); let n = 0;
    let wkStart = addDays(t, -((parseISO(t).getDay() + 6) % 7));
    const countWeek = s => { let c = 0; for (let i = 0; i < 7; i++) if (habitDone(h, addDays(s, i))) c++; return c; };
    if (countWeek(wkStart) >= target) n++;
    wkStart = addDays(wkStart, -7);
    while (countWeek(wkStart) >= target && n < 520) { n++; wkStart = addDays(wkStart, -7); }
    return { n, unit:'minggu' };
  }
  let d = habitDone(h, t) ? t : addDays(t, -1), n = 0;
  while (habitDone(h, d) && n < 3650) { n++; d = addDays(d, -1); }
  return { n, unit:'hari' };
}
function habitRate(h, days){
  const t = todayISO(); let done = 0;
  for (let i = 0; i < days; i++) if (habitDone(h, addDays(t, -i))) done++;
  if (h.freq === 'weekly') return Math.min(1, done / ((Math.max(1, +h.target || 1)) * days / 7));
  return done / days;
}

/* ---------- notifications (derived) ---------- */
let readSet = new Set(lsGet('infina:notifRead', []));
const saveRead = () => lsSet('infina:notifRead', Array.from(readSet).slice(-400));
function notifications(){
  const out = [], t = todayISO(), ym = curYM();
  if (backend && backend.invitesIn) backend.invitesIn.forEach(inv => out.push({ id:'inv_' + inv.id, level:'info', text:`${inv.invitedByName || 'Seseorang'} mengundang Anda ke workspace "${inv.wsName}"`, href:'#workspace' }));
  if (!wsReady) return out;
  if (modOn('finance')) {
    budgetRows(ym).forEach(r => {
      if (r.pct >= 1) out.push({ id:`b100_${r.b.id}`, level:'critical', text:`Anggaran ${catName(r.b.categoryId)} terlampaui: ${rp(r.spent)} dari ${rp(r.b.limit)}`, href:'#anggaran' });
      else if (r.pct >= .8) out.push({ id:`b80_${r.b.id}`, level:'warn', text:`Anggaran ${catName(r.b.categoryId)} sudah terpakai ${Math.round(r.pct*100)}%`, href:'#anggaran' });
    });
    S.debts.forEach(d => { if (d.archived) return; const i = debtInfo(d); if (!i.nextDue) return; const dd = diffDays(t, i.nextDue);
      if (dd <= 3) out.push({ id:`d_${d.id}_${i.nextDue}`, level: dd <= 0 ? 'critical':'warn', text:`${/^cicilan/i.test(d.name) ? d.name : 'Cicilan ' + d.name} ${rp(Math.min(d.installment, i.remaining))} jatuh tempo ${relDue(dd)}`, href:'#utang' }); });
    S.recurring.forEach(r => { if (r.type !== 'expense') return; const n = nextOccurrence(r); if (!n) return; const dd = diffDays(t, n);
      if (dd <= 3) out.push({ id:`r_${r.id}_${n}`, level:'info', text:`${r.desc || 'Transaksi berulang'} ${rp(r.amount)} akan tercatat ${relDue(dd)}`, href:'#berulang' }); });
    const bal = balances();
    S.accounts.forEach(a => { if (a.type !== 'credit_card' || a.active === false) return; const owe = -(bal[a.id] || 0); const due = ccDueDate(a); if (owe <= 0 || !due) return; const dd = diffDays(t, due);
      if (dd <= 3) out.push({ id:`cc_${a.id}_${due}`, level: dd <= 0 ? 'critical' : 'warn', text:`Tagihan ${a.name} ${rp(owe)} jatuh tempo ${relDue(dd)}`, href:'#utang' }); });
  }
  if (modOn('planner')) {
    S.tasks.forEach(k => { if (k.status === 'done' || !k.due) return; const dd = diffDays(t, k.due);
      if (dd <= 0) out.push({ id:`t_${k.id}_${k.due}`, level: dd < 0 ? 'critical':'warn', text:`Tugas "${k.title}" ${dd < 0 ? 'melewati tenggat ' + (-dd) + ' hari' : 'jatuh tempo hari ini'}`, href: k.wedding ? '#wedding' : '#tugas' }); });
    upcomingEvents(1).forEach(x => out.push({ id:`e_${x.e.id}_${x.date}`, level:'info', text:`${x.e.title} ${x.date === t ? 'hari ini' : 'besok'}${x.e.time ? ' pukul ' + x.e.time : ''}`, href:'#kalender' }));
  }
  if (modOn('wedding')) S.wpays.forEach(p => { if (wpayStatus(p) === 'paid' || !p.due) return; const dd = diffDays(t, p.due); const v = vendor(p.vendorId);
    if (dd <= 7) out.push({ id:`wp_${p.id}`, level: dd <= 0 ? 'critical' : 'warn', text:`Pembayaran ${p.label}${v ? ' ' + v.name : ''} ${rp(p.amount)} ${relDue(dd)}`, href:'#wedding' }); });
  if (modOn('travel')) S.trips.forEach(tr => { if (tr.status !== 'rencana' || !tr.start) return; const dd = diffDays(t, tr.start);
    if (dd >= 0 && dd <= 3) out.push({ id:`tr_${tr.id}_${tr.start}`, level:'info', text:`Perjalanan ${tr.name} berangkat ${relDue(dd)}`, href:'#travel' }); });
  return out;
}
/* =====================================================================
   Shell: auth screen, sidebar, top bar, routing, modal, toast, form helpers
   ===================================================================== */
const ROUTES = [
  { k:'dashboard', l:'Dashboard', i:'dash', g:'' },
  { k:'transaksi', l:'Transaksi', i:'tx', g:'Keuangan', m:'finance' },
  { k:'rekening', l:'Rekening', i:'acc', g:'Keuangan', m:'finance' },
  { k:'anggaran', l:'Anggaran', i:'bud', g:'Keuangan', m:'finance' },
  { k:'berulang', l:'Berulang', i:'rec', g:'Keuangan', m:'finance' },
  { k:'utang', l:'Utang & Cicilan', i:'debt', g:'Keuangan', m:'finance' },
  { k:'tabungan', l:'Target Tabungan', i:'goal', g:'Keuangan', m:'finance' },
  { k:'bagi', l:'Bagi Biaya', i:'split', g:'Keuangan', m:'finance', shared:true },
  { k:'tugas', l:'Tugas', i:'task', g:'Planner', m:'planner' },
  { k:'kalender', l:'Kalender', i:'cal', g:'Planner', m:'planner' },
  { k:'wedding', l:'Wedding', i:'ring', g:'Rencana', m:'wedding' },
  { k:'travel', l:'Travel', i:'plane', g:'Rencana', m:'travel' },
  { k:'tujuan', l:'Tujuan Hidup', i:'flag', g:'Pengembangan diri', m:'growth' },
  { k:'kebiasaan', l:'Kebiasaan', i:'habit', g:'Pengembangan diri', m:'growth' },
  { k:'jurnal', l:'Jurnal', i:'book', g:'Pengembangan diri', m:'growth' },
  { k:'workspace', l:'Workspace & Anggota', i:'users', g:'Sistem' },
  { k:'pengaturan', l:'Pengaturan', i:'set', g:'Sistem' }
];
const routeOk = r => (!r.m || modOn(r.m)) && (!r.shared || isShared());
const route = () => { const h = (location.hash || '').slice(1); const r = ROUTES.find(x => x.k === h); return r && routeOk(r) ? h : 'dashboard'; };

function shellHTML(){
  return `<div class="app">
    <aside class="side" id="side" aria-label="Navigasi utama"></aside>
    <div class="scrim" id="scrim" data-act="close-menu"></div>
    <div class="main">
      <header class="top">
        <button class="icon-btn menu-btn" data-act="open-menu" aria-label="Buka menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="gsearch" type="search" placeholder="Cari transaksi, tugas, tamu, jurnal…" autocomplete="off" aria-label="Pencarian">
          <div class="search-res" id="gres" hidden></div>
        </div>
        <div class="top-actions">
          <span id="roNote"></span>
          <div class="bell"><button class="icon-btn" data-act="toggle-notif" aria-label="Notifikasi" id="bellBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="count" id="bellCount" hidden></span></button>
            <div class="notif-panel" id="notifPanel" hidden></div></div>
          <button class="btn btn-primary qa-btn" data-act="quick-add">${ic('plus', 16)}Tambah</button>
        </div>
      </header>
      <main class="content" id="view"></main>
    </div>
  </div>
  <button class="fab" data-act="quick-add" aria-label="Tambah cepat">${ic('plus', 24)}</button>`;
}

function authHTML(){
  return `<div class="auth"><div class="auth-card">
    <div class="logo"><div class="mark">${MARK}</div><b>Infina</b></div>
    <div><h1>Keuangan, rencana, dan kebiasaan dalam satu tempat</h1><p class="muted" style="margin-top:6px">Sendiri atau bersama pasangan dan keluarga. Data tersinkron di HP dan laptop.</p></div>
    <ul><li>Rekening, transaksi, anggaran, cicilan, dan target tabungan</li><li>Workspace bersama dengan bagi biaya otomatis</li><li>Wedding planner, travel planner, tujuan hidup, kebiasaan, dan jurnal</li></ul>
    ${fatal ? `<div class="banner err">${esc(fatal)}</div>` : ''}
    <button class="gbtn" data-act="sign-in"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Masuk dengan Google</button>
    <p class="note">Dengan masuk, Anda menyetujui bahwa Infina menyimpan nama, email, dan data yang Anda catat di Firebase (Google Cloud) agar bisa diakses dari perangkat Anda dan anggota workspace yang Anda undang.</p>
  </div></div>`;
}

let shellMounted = false;
function render(){
  const root = $('#root');
  if (backend && backend.mode === 'cloud' && !backend.user) { shellMounted = false; root.innerHTML = authHTML(); return; }
  if (!shellMounted) { root.innerHTML = shellHTML(); shellMounted = true; }
  renderSide(); renderBell();
  $('#roNote').innerHTML = wsReady && !canWrite() ? '<span class="readonly-note">Hanya lihat</span>' : '';
  const v = $('#view');
  const focused = document.activeElement && v.contains(document.activeElement) && document.activeElement.id ? document.activeElement : null;
  const fid = focused && focused.id, fsel = focused && typeof focused.selectionStart === 'number' ? [focused.selectionStart, focused.selectionEnd] : null;
  const banners = (fatal ? `<div class="banner err">${esc(fatal)}</div>` : '') + (bootNote ? `<div class="banner">${esc(bootNote)}</div>` : '') + inviteBanner();
  if (!wsReady || !WS()) { v.innerHTML = banners + '<div class="loading">Memuat data…</div>'; return; }
  const r = route();
  let html = '';
  try { html = VIEWS[r] ? VIEWS[r]() : ''; } catch(e) { console.error(e); html = `<div class="banner err">Halaman gagal ditampilkan: ${esc(e.message)}</div>`; }
  v.innerHTML = banners + html;
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); if (fsel) try { el.setSelectionRange(fsel[0], fsel[1]); } catch(e){} } }
}

function inviteBanner(){
  if (!backend || !backend.invitesIn || !backend.invitesIn.length) return '';
  return backend.invitesIn.map(inv => `<div class="banner acc"><span><b>${esc(inv.invitedByName || 'Seseorang')}</b> mengundang Anda ke workspace <b>${esc(inv.wsName)}</b> sebagai ${ROLE[inv.role] || inv.role}.</span>
    <span class="head-actions"><button class="btn btn-sm" data-act="decline-invite" data-id="${esc(inv.id)}">Tolak</button><button class="btn btn-sm btn-primary" data-act="accept-invite" data-id="${esc(inv.id)}">Terima</button></span></div>`).join('');
}

function renderSide(){
  const r = route(), groups = [];
  ROUTES.filter(routeOk).forEach(x => { let g = groups.find(y => y.g === x.g); if (!g) { g = { g:x.g, items:[] }; groups.push(g); } g.items.push(x); });
  const link = x => `<a href="#${x.k}" ${r === x.k ? 'aria-current="page"' : ''}>${ic(x.i, 18)}<span>${x.l}</span></a>`;
  const mode = backend ? backend.mode : '';
  const chip = mode === 'cloud' ? (navigator.onLine === false ? '<span class="store-chip off"><i></i>Offline · tersinkron saat online</span>' : '<span class="store-chip"><i></i>Tersinkron ke cloud</span>')
    : mode === 'local' ? '<span class="store-chip local"><i></i>Mode lokal · hanya di browser ini</span>' : '<span class="store-chip off"><i></i>Penyimpanan diblokir</span>';
  const u = backend && backend.user;
  const wsSel = backend && backend.workspaces && backend.workspaces.length > 1 || (backend && backend.mode === 'cloud')
    ? `<div class="ws-switch"><select id="wsSelect" aria-label="Pilih workspace">${(backend.workspaces || []).map(w => `<option value="${esc(w.id)}" ${WS() && WS().id === w.id ? 'selected' : ''}>${esc(w.name)}${w.type === 'personal' ? ' (pribadi)' : ''}</option>`).join('')}</select>
      <small>${WS() ? (isShared() ? `${(WS().memberIds || []).length} anggota · Anda ${ROLE[myRole()].toLowerCase()}` : 'Hanya Anda') : ''}</small></div>` : '';
  $('#side').innerHTML = `
    <div class="brand"><div class="mark sm">${MARK}</div><b>Infina</b></div>
    ${wsSel}
    <nav class="nav">${groups.map(g => (g.g ? `<div class="nav-label">${g.g}</div>` : '') + g.items.map(link).join('')).join('')}</nav>
    <div class="side-foot">
      ${u && u.email ? `<div class="me"><span class="avatar">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div><button class="icon-btn sm" data-act="sign-out" aria-label="Keluar" title="Keluar">${ic('logout', 15)}</button></div>` : ''}
      ${chip}
    </div>`;
}

function renderBell(){
  const list = notifications(), unread = list.filter(n => !readSet.has(n.id)).length;
  const c = $('#bellCount'); if (c) { c.hidden = !unread; c.textContent = unread; }
  const p = $('#notifPanel'); if (!p) return;
  p.hidden = !ui.notifOpen;
  if (!ui.notifOpen) return;
  p.innerHTML = `<header><h2>Notifikasi</h2>${list.length ? '<button class="linkish" data-act="notif-read-all">Tandai semua dibaca</button>' : ''}</header>` +
    (list.length ? list.map(n => `<a class="notif ${n.level} ${readSet.has(n.id) ? 'read' : ''}" href="${n.href}" data-act="notif-open" data-id="${esc(n.id)}" data-href="${n.href}"><i class="dot"></i><span>${esc(n.text)}</span></a>`).join('')
      : '<div class="empty"><b>Tidak ada notifikasi</b><span>Peringatan anggaran, jatuh tempo, dan tenggat akan muncul di sini.</span></div>');
}
function closeMenu(){ const s = $('#side'); if (s) s.classList.remove('open'); const sc = $('#scrim'); if (sc) sc.classList.remove('show'); }

/* ---------- small render helpers ---------- */
const pill = (t, k='') => `<span class="pill ${k}">${esc(t)}</span>`;
const sampleTag = o => o && o.sample ? ' ' + pill('Contoh', 'sample') : '';
const pageHead = (title, sub, actions='') => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="head-actions">${actions}</div></div>`;
const W = html => canWrite() ? html : '';   // render write controls only for editors
const emptyBox = (title, text, action='') => `<section class="panel"><div class="empty"><b>${title}</b>${text ? `<span>${text}</span>` : ''}${W(action)}</div></section>`;
const bar = (pct, k='') => `<div class="bar ${k}"><i style="width:${Math.max(0, Math.min(100, pct * 100)).toFixed(1)}%"></i></div>`;
const greeting = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; };
const tabsHTML = (tabs, cur, act) => `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${cur === k}" data-act="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;
const memberOpts = () => memberIds().map(id => [id, memberName(id) === 'Anda' ? `${memberFull(id)} (Anda)` : memberName(id)]);

/* ---------- modal & toast ---------- */
let onConfirm = null;
function openModal(title, body, opts){
  opts = opts || {};
  $('#modalRoot').innerHTML = `<div class="overlay" data-overlay><div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button class="icon-btn" data-act="close-modal" aria-label="Tutup">${ic('x', 18)}</button></header>${body}</div></div>`;
  const first = $('#modalRoot input:not([type=radio]):not([type=checkbox]):not([type=hidden]):not([disabled]), #modalRoot select:not([disabled]), #modalRoot textarea:not([disabled])');
  if (first && !opts.noFocus) setTimeout(() => first.focus(), 30);
}
function closeModal(){ $('#modalRoot').innerHTML = ''; onConfirm = null; }
function confirmBox(title, text, label, fn, danger=true){
  onConfirm = fn;
  openModal(title, `<div class="mb"><p>${text}</p></div><footer><button class="btn" data-act="close-modal">Batal</button><button class="btn ${danger ? 'btn-danger solid' : 'btn-primary'}" data-act="confirm-yes">${esc(label)}</button></footer>`);
}
function toast(msg, kind=''){
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg; box.appendChild(el);
  setTimeout(() => el.remove(), kind === 'neg' ? 6000 : 3200);
}
function formErr(f, msg){ const e = $('.form-error', f); if (!e) { toast(msg, 'neg'); return; } e.textContent = msg; e.hidden = false; e.scrollIntoView({ block:'nearest' }); }
const fv = (f, n) => { const el = f.elements[n]; return el ? String(el.value || '').trim() : ''; };
const fm = (f, n) => Number(fv(f, n).replace(/\D/g, '')) || 0;
const fchk = (f, n) => { const el = f.elements[n]; return !!(el && el.checked); };
const moneyIn = (name, val, label, hint='') => `<label class="f"><span>${label}</span><div class="money"><em>Rp</em><input name="${name}" id="m-${name}" inputmode="numeric" autocomplete="off" data-money value="${val ? Math.round(val).toLocaleString('id-ID') : ''}" placeholder="0"></div>${hint ? `<small>${hint}</small>` : ''}</label>`;
const selectIn = (name, label, opts, cur, extra='') => `<label class="f" ${extra}><span>${label}</span><select name="${name}" id="s-${name}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
const textIn = (name, label, val, attrs='') => `<label class="f"><span>${label}</span><input name="${name}" id="t-${name}" value="${esc(val ?? '')}" ${attrs}></label>`;
const dateIn = (name, label, val, attrs='') => `<label class="f"><span>${label}</span><input type="date" name="${name}" id="d-${name}" value="${esc(val || '')}" ${attrs}></label>`;
const areaIn = (name, label, val, attrs='') => `<label class="f"><span>${label}</span><textarea name="${name}" id="a-${name}" ${attrs}>${esc(val || '')}</textarea></label>`;
const formShell = (name, attrs, body, submitLabel, extraFoot='') => `<form data-form="${name}" ${attrs} novalidate><div class="mb"><div class="form-error" hidden></div>${body}</div><footer>${extraFoot}<span style="flex:1"></span><button type="button" class="btn" data-act="close-modal">Batal</button><button type="submit" class="btn btn-primary">${submitLabel}</button></footer></form>`;
const delBtn = (act, id, label='Hapus') => `<button type="button" class="btn btn-danger" data-act="${act}" data-id="${id}">${label}</button>`;
/* =====================================================================
   Views: dashboard and finance
   ===================================================================== */
const amtClass = t => t.type === 'income' ? 'pos' : t.type === 'expense' ? 'neg' : (t.type === 'adjustment' ? (t.dir < 0 ? 'neg' : 'pos') : '');
const amtSign = t => t.type === 'income' ? '+' : t.type === 'expense' ? '−' : t.type === 'adjustment' ? (t.dir < 0 ? '−' : '+') : '';
const amtText = t => amtSign(t) + 'Rp' + Math.round(+t.amount).toLocaleString('id-ID');
function txAccText(t){
  if (t.type === 'transfer') return `${esc(accName(t.accountId))} → ${esc(accName(t.toAccountId))}`;
  if (t.type === 'settlement') return `${esc(memberName(t.paidBy))} → ${esc(memberName(t.toMember))}`;
  if (!t.accountId && t.paidBy) return `Dibayar ${esc(memberName(t.paidBy))}`;
  return esc(accName(t.accountId)) + (isShared() && t.paidBy ? ` · ${esc(memberName(t.paidBy))}` : '');
}
function txCatText(t){
  if (t.type === 'transfer') return acc(t.toAccountId) && acc(t.toAccountId).type === 'credit_card' ? 'Bayar kartu kredit' : 'Transfer';
  if (t.type === 'adjustment') return 'Penyesuaian saldo';
  if (t.type === 'settlement') return 'Pelunasan antaranggota';
  return esc(catName(t.categoryId));
}
function txTags(t){
  const tags = [];
  if (t.recurringId) tags.push('berulang'); if (t.debtId) tags.push('cicilan');
  if (t.vendorId) { const v = vendor(t.vendorId); tags.push('wedding' + (v ? ': ' + esc(v.name) : '')); }
  if (t.tripId) { const tr = trip(t.tripId); tags.push('travel' + (tr ? ': ' + esc(tr.name) : '')); }
  if (t.split) tags.push('dibagi');
  return tags.length ? ' · ' + tags.join(' · ') : '';
}
function txRow(t, extra=''){
  return `<div class="row ${t.status === 'void' ? 'void' : ''}">
    <span class="c-date num muted">${fmtDate(t.date)}</span>
    <div class="desc"><b>${esc(t.desc || TX_TYPES[t.type])}${t.status === 'void' ? ' ' + pill('Dibatalkan', 'neg') : ''}${sampleTag(t)}</b><span>${fmtDateShort(t.date)} · ${txCatText(t)}${txTags(t)}${extra}</span></div>
    <span class="c-acc">${txAccText(t)}</span>
    <span class="amt num ${amtClass(t)}">${amtText(t)}</span>
    <div class="row-actions"><button class="icon-btn sm" data-act="edit-txn" data-id="${t.id}" aria-label="${t.status === 'posted' && canWrite() ? 'Ubah' : 'Lihat'} transaksi">${ic(t.status === 'posted' && canWrite() ? 'edit' : 'tx', 15)}</button></div>
  </div>`;
}

/* ---------- Dashboard ---------- */
function viewDashboard(){
  const u = backend.user, name = u && u.name ? ', ' + esc(firstName(u.name)) : '';
  const head = `<div class="page-head"><div><h1>${greeting()}${name}</h1><p>${esc(WS().name)} · ${fmtDateLong(todayISO())}</p></div></div>`;
  const parts = [];
  const nothing = !S.accounts.length && !S.tasks.length && !S.trips.length && !S.wedding.length && !S.habits.length;
  if (nothing) {
    parts.push(`<section class="panel welcome">
      <h2>${isShared() ? 'Workspace bersama ini masih kosong' : 'Mulai dari rekening pertama Anda'}</h2>
      <p class="muted">Saldo, laporan, anggaran, pembayaran wedding, dan pengeluaran perjalanan semuanya dihitung dari transaksi di rekening.</p>
      <ol><li>Tambahkan rekening (bank, tunai, e-wallet, atau kartu kredit) beserta saldo awalnya.</li><li>Catat pemasukan, pengeluaran, dan transfer.</li><li>Atur anggaran bulanan, lalu aktifkan modul lain sesuai kebutuhan di Pengaturan.</li></ol>
      ${W(`<div class="head-actions"><button class="btn btn-primary" data-act="new-account">Tambah rekening</button><button class="btn" data-act="load-sample">Isi data contoh</button></div>
      <p class="note">Data contoh diberi label "Contoh" dan bisa dihapus sekaligus dari Pengaturan.</p>`)}</section>`);
  }
  if (modOn('finance') && S.accounts.length) {
    const bal = balances(), ym = curYM(), mt = monthTotals(ym);
    let assets = 0, cc = 0;
    S.accounts.forEach(a => { if (a.type === 'credit_card') cc += Math.max(0, -(bal[a.id] || 0)); else assets += bal[a.id] || 0; });
    const debtsLeft = S.debts.filter(d => !d.archived).reduce((s, d) => s + debtInfo(d).remaining, 0);
    const brs = budgetRows(ym), bLimit = brs.reduce((s, r) => s + r.b.limit, 0), bSpent = brs.reduce((s, r) => s + r.spent, 0);
    parts.push(`<div class="kpis">
      <div class="kpi"><span class="lbl">Saldo bersih</span><span class="val num">${rp(assets - cc)}</span><span class="sub num">Aset ${rp(assets)} · Tagihan kartu ${rp(cc)}</span></div>
      <div class="kpi"><span class="lbl">Pemasukan bulan ini</span><span class="val num pos">${rp(mt.inc)}</span><span class="sub">Transfer tidak dihitung</span></div>
      <div class="kpi"><span class="lbl">Pengeluaran bulan ini</span><span class="val num neg">${rp(mt.exp)}</span><span class="sub num">Selisih ${rp(mt.inc - mt.exp)}</span></div>
      <div class="kpi"><span class="lbl">Sisa anggaran</span><span class="val num">${brs.length ? rp(bLimit - bSpent) : '—'}</span><span class="sub num">${brs.length ? `Terpakai ${Math.round(bLimit ? bSpent / bLimit * 100 : 0)}% dari ${rp(bLimit)}` : 'Belum ada anggaran bulan ini'}</span></div>
      <div class="kpi"><span class="lbl">Total kewajiban</span><span class="val num">${rp(debtsLeft + cc)}</span><span class="sub">Cicilan, utang, dan tagihan kartu</span></div>
    </div>`);
    parts.push(`<div class="grid2">${panelCashflow()}${panelCategories(ym)}</div>`);
    parts.push(`<div class="grid3">${panelDue()}${panelBudgets(brs)}${modOn('planner') ? panelTasks() : ''}</div>`);
  } else if (modOn('planner') && !nothing) parts.push(`<div class="grid2">${panelTasks()}</div>`);
  const extra = [];
  if (modOn('wedding') && weddingInfo()) extra.push(panelWedding());
  if (modOn('travel')) { const p = panelTrip(); if (p) extra.push(p); }
  if (modOn('growth') && S.habits.some(h => !h.archived)) extra.push(panelHabitsToday());
  if (modOn('finance') && isShared() && S.txns.some(t => t.split || t.type === 'settlement')) extra.push(panelSplit());
  if (extra.length) parts.push(`<div class="grid3">${extra.join('')}</div>`);
  if (modOn('finance') && S.accounts.length) parts.push(panelRecent());
  return head + parts.join('');
}
function panelCashflow(){
  const months = []; for (let i = 5; i >= 0; i--) months.push(ymShift(curYM(), -i));
  const data = months.map(m => monthTotals(m));
  const max = Math.max(1, ...data.map(d => Math.max(d.inc, d.exp)));
  const step = niceStep(max / 4), top = step * Math.ceil(max / step);
  const Wd = 560, H = 210, L = 52, R = 8, T = 10, B = 26, iw = Wd - L - R, ih = H - T - B, gw = iw / months.length, bw = Math.min(22, gw * .3);
  const y = v => T + ih - (v / top) * ih;
  let g = '';
  for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${Wd-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${compact(v)}</text>`;
  data.forEach((d, i) => {
    const cx = L + gw * i + gw / 2;
    g += `<rect x="${cx - bw - 2}" y="${y(d.inc)}" width="${bw}" height="${Math.max(0, T + ih - y(d.inc))}" rx="3" fill="var(--pos)"><title>Pemasukan ${ymLabel(months[i])}: ${rp(d.inc)}</title></rect>`;
    g += `<rect x="${cx + 2}" y="${y(d.exp)}" width="${bw}" height="${Math.max(0, T + ih - y(d.exp))}" rx="3" fill="var(--neg)"><title>Pengeluaran ${ymLabel(months[i])}: ${rp(d.exp)}</title></rect>`;
    g += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${MON3[+months[i].slice(5) - 1]}</text>`;
  });
  return `<section class="panel"><div class="panel-h"><div><h2>Arus kas 6 bulan</h2><p>Pemasukan dan pengeluaran per bulan</p></div>
    <div class="legend"><span><i style="background:var(--pos)"></i>Pemasukan</span><span><i style="background:var(--neg)"></i>Pengeluaran</span></div></div>
    <div class="panel-b chart"><svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Grafik arus kas enam bulan">${g}</svg></div></section>`;
}
function niceStep(raw){ const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function panelCategories(ym){
  const sp = spendByCat(ym), rows = Object.entries(sp).sort((a, b) => b[1] - a[1]), total = rows.reduce((s, r) => s + r[1], 0);
  const top = rows.slice(0, 6), rest = rows.slice(6).reduce((s, r) => s + r[1], 0);
  if (rest) top.push(['__rest', rest]);
  const max = Math.max(1, ...top.map(r => r[1]));
  return `<section class="panel"><div class="panel-h"><div><h2>Pengeluaran per kategori</h2><p>${ymLabel(ym)} · total ${rp(total)}</p></div></div>
    <div class="panel-b">${top.length ? top.map(([c, v]) => `<div class="hbar"><span>${c === '__rest' ? 'Kategori lain' : esc(catName(c))}</span>${bar(v / max)}<span class="num">${rp(v)}</span></div>`).join('')
      : `<div class="empty"><b>Belum ada pengeluaran bulan ini</b>${W('<button class="btn btn-sm" data-act="new-txn" data-type="expense">Catat pengeluaran</button>')}</div>`}</div></section>`;
}
function dueItems(days){
  const t = todayISO(), out = [], bal = balances();
  S.debts.forEach(d => { if (d.archived) return; const i = debtInfo(d); if (i.nextDue && diffDays(t, i.nextDue) <= days) out.push({ date:i.nextDue, label: /^cicilan/i.test(d.name) ? d.name : `Cicilan ${d.name}`, amt:Math.min(d.installment, i.remaining), act:W(`<button class="btn btn-sm" data-act="pay-debt" data-id="${d.id}">Bayar</button>`) }); });
  S.recurring.forEach(r => { if (r.type !== 'expense') return; const n = nextOccurrence(r); if (n && diffDays(t, n) <= days) out.push({ date:n, label:r.desc || 'Transaksi berulang', amt:r.amount, act:pill('Otomatis', 'acc') }); });
  S.accounts.forEach(a => { if (a.type !== 'credit_card' || a.active === false) return; const owe = -(bal[a.id] || 0), due = ccDueDate(a); if (owe <= 0 || !due) return;
    if (diffDays(t, due) <= days) out.push({ date:due, label:`Tagihan ${a.name}`, amt:owe, act:W(`<button class="btn btn-sm" data-act="new-txn" data-type="transfer" data-to="${a.id}" data-amount="${owe}">Bayar</button>`) }); });
  if (modOn('wedding')) S.wpays.forEach(p => { if (wpayStatus(p) === 'paid' || !p.due || diffDays(t, p.due) > days) return; const v = vendor(p.vendorId);
    out.push({ date:p.due, label:`${p.label}${v ? ' · ' + v.name : ''}`, amt:p.amount, act:W(`<button class="btn btn-sm" data-act="pay-wpay" data-id="${p.id}">Bayar</button>`) }); });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
function panelDue(){
  const items = dueItems(7), t = todayISO();
  return `<section class="panel"><div class="panel-h"><div><h2>Jatuh tempo 7 hari</h2><p>Cicilan, tagihan, dan pembayaran terjadwal</p></div></div>
    <div class="panel-b">${items.length ? items.map(x => { const dd = diffDays(t, x.date); return `<div class="mini"><div class="l"><b>${esc(x.label)}</b><span class="${dd < 0 ? 'neg' : dd <= 3 ? 'warn-t' : ''}">${fmtDate(x.date)} · ${relDue(dd)}</span></div><div class="r"><span class="num">${rp(x.amt)}</span>${x.act}</div></div>`; }).join('')
      : '<div class="empty"><span>Tidak ada yang jatuh tempo dalam 7 hari.</span></div>'}</div></section>`;
}
function panelBudgets(brs){
  return `<section class="panel"><div class="panel-h"><div><h2>Anggaran bulan ini</h2><p>Kategori dengan pemakaian tertinggi</p></div><a class="linkish" href="#anggaran">Lihat semua</a></div>
    <div class="panel-b">${brs.length ? brs.slice(0, 4).map(budgetMini).join('')
      : `<div class="empty"><span>Belum ada anggaran untuk bulan ini.</span><a class="btn btn-sm" href="#anggaran">Atur anggaran</a></div>`}</div></section>`;
}
function budgetMini(r){
  const k = r.pct >= 1 ? 'neg' : r.pct >= .8 ? 'warn' : 'pos';
  return `<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-weight:600">${esc(catName(r.b.categoryId))}</b><span class="num muted">${rp(r.spent)} / ${rp(r.b.limit)}</span></div>${bar(r.pct, k)}</div>`;
}
function panelTasks(){
  const t = todayISO(), end = addDays(t, 7);
  const tasks = S.tasks.filter(k => k.status !== 'done' && k.due && k.due <= end).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  const evs = upcomingEvents(7).slice(0, 4);
  const body = (tasks.length || evs.length) ?
    tasks.map(k => { const dd = diffDays(t, k.due); return `<div class="mini"><div class="l" style="display:flex;gap:10px;align-items:flex-start">${W(`<button class="tick" data-act="task-done" data-id="${k.id}" aria-label="Tandai selesai"></button>`)}<div><b>${esc(k.title)}</b><span class="${dd < 0 ? 'neg' : ''}">${k.wedding ? 'Wedding' : 'Tugas'} · ${relDue(dd)}</span></div></div>${pill(PRIO[k.priority] || 'Sedang', k.priority === 'tinggi' ? 'neg' : '')}</div>`; }).join('') +
    evs.map(x => `<div class="mini"><div class="l"><b>${esc(x.e.title)}</b><span>Acara · ${fmtDate(x.date)}${x.e.time ? ' · ' + esc(x.e.time) : ''}</span></div></div>`).join('')
    : `<div class="empty"><span>Tidak ada tugas atau acara dalam 7 hari.</span>${W('<button class="btn btn-sm" data-act="new-task">Tambah tugas</button>')}</div>`;
  return `<section class="panel"><div class="panel-h"><div><h2>Tugas & acara terdekat</h2><p>7 hari ke depan</p></div><a class="linkish" href="#tugas">Semua tugas</a></div><div class="panel-b">${body}</div></section>`;
}
function panelRecent(){
  const list = sortTx(S.txns.filter(posted)).slice(0, 6);
  return `<section class="panel"><div class="panel-h"><div><h2>Transaksi terbaru</h2></div><a class="linkish" href="#transaksi">Semua transaksi</a></div>
    <div class="panel-b" style="padding:8px 0 4px">${list.length ? `<div class="rows">${list.map(t => txRow(t)).join('')}</div>` : `<div class="empty"><span>Belum ada transaksi.</span>${W('<button class="btn btn-sm btn-primary" data-act="new-txn">Catat transaksi</button>')}</div>`}</div></section>`;
}
function panelSplit(){
  const net = splitBalances(), sug = settleSuggestions(net);
  return `<section class="panel"><div class="panel-h"><div><h2>Bagi biaya</h2><p>Siapa berutang ke siapa</p></div><a class="linkish" href="#bagi">Detail</a></div><div class="panel-b">
    ${sug.length ? sug.map(s => `<div class="mini"><div class="l"><b>${esc(memberName(s.from))} → ${esc(memberName(s.to))}</b><span>Belum dilunasi</span></div><span class="num">${rp(s.amount)}</span></div>`).join('') : '<div class="empty"><span>Semua sudah impas.</span></div>'}</div></section>`;
}

/* ---------- Transactions ---------- */
function filteredTx(){
  const q = ui.txQ.trim().toLowerCase();
  return sortTx(S.txns.filter(t => {
    if (!ui.txVoid && t.status === 'void') return false;
    if (ui.txMonth && t.date.slice(0,7) !== ui.txMonth) return false;
    if (ui.txType !== 'all' && t.type !== ui.txType) return false;
    if (ui.txAcc !== 'all' && t.accountId !== ui.txAcc && t.toAccountId !== ui.txAcc) return false;
    if (ui.txCat !== 'all' && t.categoryId !== ui.txCat) return false;
    if (q && !((t.desc || '') + ' ' + (t.note || '')).toLowerCase().includes(q)) return false;
    return true;
  }));
}
const needAccount = () => emptyBox('Belum ada rekening', 'Tambahkan rekening dulu; semua transaksi dicatat terhadap rekening.', '<button class="btn btn-primary" data-act="new-account">Tambah rekening</button>');
function viewTransaksi(){
  if (!S.accounts.length && !isShared()) return pageHead('Transaksi', 'Semua arus uang tercatat di sini') + needAccount();
  const list = filteredTx(), per = 50, pages = Math.max(1, Math.ceil(list.length / per));
  if (ui.txPage > pages) ui.txPage = pages;
  const slice = list.slice((ui.txPage - 1) * per, ui.txPage * per);
  let inc = 0, exp = 0; list.forEach(t => { if (!posted(t)) return; if (t.type === 'income') inc += +t.amount; if (t.type === 'expense') exp += +t.amount; });
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`;
  const types = Object.entries(TX_TYPES).filter(([k]) => k !== 'settlement' || isShared());
  return pageHead('Transaksi', 'Satu-satunya sumber saldo dan laporan', `<button class="btn" data-act="export-csv">Ekspor CSV</button>${W('<button class="btn btn-primary" data-act="new-txn">Catat transaksi</button>')}`) +
  `<section class="panel">
    <div class="filters">
      <input type="month" id="f-month" data-filter="txMonth" value="${ui.txMonth}" aria-label="Bulan">
      <select id="f-type" data-filter="txType" aria-label="Jenis">${opt('all','Semua jenis',ui.txType)}${types.map(([k, l]) => opt(k, l, ui.txType)).join('')}</select>
      <select id="f-acc" data-filter="txAcc" aria-label="Rekening">${opt('all','Semua rekening',ui.txAcc)}${S.accounts.map(a => opt(a.id, a.name, ui.txAcc)).join('')}</select>
      <select id="f-cat" data-filter="txCat" aria-label="Kategori">${opt('all','Semua kategori',ui.txCat)}${sortedCats().map(c => opt(c.id, c.name + (c.kind === 'income' ? ' (masuk)' : ''), ui.txCat)).join('')}</select>
      <input class="grow" type="search" id="f-q" data-filter="txQ" value="${esc(ui.txQ)}" placeholder="Cari deskripsi atau catatan">
      <label class="check"><input type="checkbox" id="f-void" data-filter="txVoid" ${ui.txVoid ? 'checked' : ''}>Tampilkan yang dibatalkan</label>
      ${ui.txMonth ? '<button class="linkish" data-act="tx-all-months">Semua bulan</button>' : ''}
    </div>
    <div class="totals num"><span>${list.length} transaksi</span><span>Pemasukan <b class="pos">${rp(inc)}</b></span><span>Pengeluaran <b class="neg">${rp(exp)}</b></span><span>Selisih <b>${rp(inc - exp)}</b></span></div>
    <div class="rows">
      ${slice.length ? `<div class="row head"><span class="c-date">Tanggal</span><span>Deskripsi</span><span class="c-acc">Rekening / pembayar</span><span class="amt">Nominal</span><span></span></div>` + slice.map(t => txRow(t)).join('')
        : '<div class="empty"><b>Tidak ada transaksi</b><span>Ubah filter atau catat transaksi baru.</span></div>'}
    </div>
    ${pages > 1 ? `<div class="pager"><span>Halaman ${ui.txPage} dari ${pages}</span><div style="display:flex;gap:6px"><button class="btn btn-sm" data-act="tx-page" data-d="-1" ${ui.txPage <= 1 ? 'disabled' : ''}>Sebelumnya</button><button class="btn btn-sm" data-act="tx-page" data-d="1" ${ui.txPage >= pages ? 'disabled' : ''}>Berikutnya</button></div></div>` : ''}
  </section>`;
}

/* ---------- Accounts ---------- */
function viewRekening(){
  const bal = balances();
  const card = a => {
    const b = bal[a.id] || 0, isCC = a.type === 'credit_card';
    const big = isCC ? `<div><span class="muted" style="font-size:12px">Tagihan berjalan</span><div class="big num ${b < 0 ? 'neg' : ''}">${rp(Math.max(0, -b))}</div></div>` : `<div class="big num ${b < 0 ? 'neg' : ''}">${rp(b)}</div>`;
    const lim = isCC && a.limit ? `<div>${bar(Math.max(0, -b) / a.limit, (-b) / a.limit >= .8 ? 'warn' : '')}<div class="meta" style="margin-top:6px"><span>Sisa limit ${rp(a.limit - Math.max(0, -b))}</span>${a.dueDay ? `<span>· jatuh tempo tgl ${a.dueDay}</span>` : ''}</div></div>` : '';
    return `<div class="card ${a.active === false ? 'inactive' : ''}"><div class="card-top"><div><b>${esc(a.name)}</b>${sampleTag(a)}<div class="meta"><span>${ACC_TYPES[a.type]}</span>${a.last4 ? `<span>· ••${esc(a.last4)}</span>` : ''}<span>· ${a.currency || 'IDR'}</span></div></div>${a.active === false ? pill('Nonaktif') : ''}</div>
      ${big}${lim}
      <div class="card-actions"><button class="btn btn-sm" data-act="acc-tx" data-id="${a.id}">Riwayat</button>${W(`<button class="btn btn-sm" data-act="edit-account" data-id="${a.id}">Ubah</button>
      ${isCC && b < 0 ? `<button class="btn btn-sm" data-act="new-txn" data-type="transfer" data-to="${a.id}" data-amount="${-b}">Bayar tagihan</button>` : ''}
      <button class="btn btn-sm" data-act="adjust-account" data-id="${a.id}">Koreksi saldo</button>`)}</div></div>`;
  };
  const act = S.accounts.filter(a => a.active !== false), inact = S.accounts.filter(a => a.active === false);
  return pageHead('Rekening', 'Saldo dihitung dari saldo awal ditambah transaksi yang tercatat', W('<button class="btn btn-primary" data-act="new-account">Tambah rekening</button>')) +
    (S.accounts.length ? `<div class="cards">${act.map(card).join('')}</div>${inact.length ? `<h2 class="muted">Nonaktif</h2><div class="cards">${inact.map(card).join('')}</div>` : ''}
      <p class="note">Kartu kredit dicatat sebagai rekening liabilitas: belanja dengan kartu adalah pengeluaran, sedangkan pembayaran tagihan adalah transfer dari rekening bank, sehingga pengeluaran tidak terhitung dua kali.${isShared() ? ' Rekening di workspace ini terlihat oleh semua anggota.' : ''}</p>` : needAccount());
}

/* ---------- Budgets ---------- */
function viewAnggaran(){
  const ym = ui.budMonth, rows = budgetRows(ym), prevYm = ymShift(ym, -1);
  const lim = rows.reduce((s, r) => s + r.b.limit, 0), sp = rows.reduce((s, r) => s + r.spent, 0);
  const hasPrev = S.budgets.some(b => b.month === prevYm);
  const head = pageHead('Anggaran', 'Realisasi dihitung dari pengeluaran tercatat pada kategori dan bulan yang sama',
    W(`${hasPrev ? `<button class="btn" data-act="copy-budgets">Salin dari ${ymLabel(prevYm)}</button>` : ''}<button class="btn btn-primary" data-act="new-budget">Tambah anggaran</button>`));
  const nav = `<div style="display:flex;align-items:center;gap:8px"><button class="icon-btn" data-act="bud-month" data-d="-1" aria-label="Bulan sebelumnya">${ic('back', 16)}</button><b style="min-width:140px;text-align:center">${ymLabel(ym)}</b><button class="icon-btn" data-act="bud-month" data-d="1" aria-label="Bulan berikutnya" style="transform:scaleX(-1)">${ic('back', 16)}</button></div>`;
  const cols = 'grid-template-columns:minmax(0,1.4fr) 1fr 1fr 1fr 120px auto';
  return head + `<section class="panel"><div class="panel-h">${nav}<div class="num muted">Total ${rp(sp)} dari ${rp(lim)}${lim ? ` · sisa <b class="${lim - sp < 0 ? 'neg' : ''}">${rp(lim - sp)}</b>` : ''}</div></div>
    <div class="panel-b" style="padding:12px 0 0">${rows.length ? `<div class="rows">
      <div class="row head" style="${cols}"><span>Kategori</span><span class="amt">Anggaran</span><span class="amt">Realisasi</span><span class="amt">Sisa</span><span class="amt">Bln lalu</span><span></span></div>
      ${rows.map(r => { const k = r.pct >= 1 ? 'neg' : r.pct >= .8 ? 'warn' : 'pos'; return `<div class="row plain" style="${cols}">
        <div class="desc"><b>${esc(catName(r.b.categoryId))}${sampleTag(r.b)}</b><div style="margin:6px 0 2px">${bar(r.pct, k)}</div><span>${Math.round(r.pct*100)}% terpakai ${r.pct >= 1 ? pill('Terlampaui','neg') : r.pct >= .8 ? pill('Hampir habis','warn') : ''}</span></div>
        <span class="amt num hide-m">${rp(r.b.limit)}</span><span class="amt num">${rp(r.spent)}</span><span class="amt num hide-m ${r.left < 0 ? 'neg' : ''}">${rp(r.left)}</span><span class="amt num muted hide-m">${rp(r.prev)}</span>
        <div class="row-actions">${W(`<button class="icon-btn sm" data-act="edit-budget" data-id="${r.b.id}" aria-label="Ubah anggaran">${ic('edit',15)}</button>`)}</div></div>`; }).join('')}</div>`
      : `<div class="empty"><b>Belum ada anggaran untuk ${ymLabel(ym)}</b><span>Tetapkan batas per kategori; peringatan muncul saat pemakaian mencapai 80% dan 100%.</span></div>`}</div></section>`;
}

/* ---------- Recurring ---------- */
function viewBerulang(){
  if (!S.accounts.length) return pageHead('Transaksi berulang', '') + needAccount();
  const t = todayISO();
  const card = r => { const n = nextOccurrence(r); return `<div class="card ${r.paused ? 'inactive' : ''}"><div class="card-top"><div><b>${esc(r.desc || TX_TYPES[r.type])}</b>${sampleTag(r)}<div class="meta"><span>${TX_TYPES[r.type]}</span><span>· ${FREQ[r.freq]}</span><span>· ${esc(accName(r.accountId))}${r.type === 'transfer' ? ' → ' + esc(accName(r.toAccountId)) : ''}</span></div></div>${r.paused ? pill('Dijeda') : pill('Aktif','pos')}</div>
    <div class="big num ${r.type === 'income' ? 'pos' : r.type === 'expense' ? 'neg' : ''}">${rp(r.amount)}</div>
    <div class="meta"><span>Mulai ${fmtDate(r.start)}</span>${r.end ? `<span>· sampai ${fmtDate(r.end)}</span>` : ''}${n ? `<span>· berikutnya ${fmtDate(n)} (${relDue(diffDays(t, n))})</span>` : ''}</div>
    ${W(`<div class="card-actions"><button class="btn btn-sm" data-act="edit-rec" data-id="${r.id}">Ubah</button><button class="btn btn-sm" data-act="toggle-rec" data-id="${r.id}">${r.paused ? 'Lanjutkan' : 'Jeda'}</button></div>`)}</div>`; };
  return pageHead('Transaksi berulang', 'Dicatat otomatis setiap kali aplikasi dibuka pada atau setelah tanggalnya', W('<button class="btn btn-primary" data-act="new-rec">Tambah jadwal</button>')) +
    (S.recurring.length ? `<div class="cards">${S.recurring.map(card).join('')}</div><p class="note">Setiap kemunculan punya nomor unik, jadi transaksi yang sama tidak tercatat dua kali walaupun aplikasi dibuka di beberapa perangkat. Transaksi yang sudah tercatat tidak ikut berubah saat jadwal diubah.</p>`
      : emptyBox('Belum ada transaksi berulang', 'Cocok untuk gaji, langganan internet, listrik, atau sewa.', '<button class="btn btn-primary" data-act="new-rec">Tambah jadwal</button>'));
}

/* ---------- Debts ---------- */
function viewUtang(){
  const bal = balances(), t = todayISO();
  const ccs = S.accounts.filter(a => a.type === 'credit_card' && Math.max(0, -(bal[a.id] || 0)) > 0);
  const active = S.debts.filter(d => !d.archived);
  const totalDebt = active.reduce((s, d) => s + debtInfo(d).remaining, 0), totalCC = ccs.reduce((s, a) => s + Math.max(0, -(bal[a.id] || 0)), 0);
  const card = d => { const i = debtInfo(d), dd = i.nextDue ? diffDays(t, i.nextDue) : null;
    return `<div class="card ${d.archived ? 'inactive' : ''}"><div class="card-top"><div><b>${esc(d.name)}</b>${sampleTag(d)}<div class="meta"><span>${DEBT_KINDS[d.kind] || 'Lainnya'}</span>${d.lender ? `<span>· ${esc(d.lender)}</span>` : ''}</div></div>${i.done ? pill('Lunas','pos') : dd !== null && dd < 0 ? pill('Terlambat','neg') : dd !== null && dd <= 3 ? pill(relDue(dd),'warn') : ''}</div>
      <div><span class="muted" style="font-size:12px">Sisa</span><div class="big num">${rp(i.remaining)}</div></div>
      <div>${bar(i.total ? i.paid / i.total : 0, 'pos')}<div class="meta" style="margin-top:6px"><span>${i.paidCount} dari ${d.count} kali · ${rp(d.installment)}/bulan</span></div></div>
      ${i.nextDue ? `<div class="meta"><span>Jatuh tempo berikutnya ${fmtDate(i.nextDue)}</span></div>` : ''}
      ${i.pays.length ? `<details><summary class="muted" style="cursor:pointer;font-size:12px">Riwayat pembayaran (${i.pays.length})</summary>${i.pays.map(p => `<div class="mini"><div class="l"><span>${fmtDate(p.date)} · ${esc(accName(p.accountId))}</span></div><span class="num">${rp(p.amount)}</span></div>`).join('')}</details>` : ''}
      ${W(`<div class="card-actions">${!i.done && !d.archived ? `<button class="btn btn-sm btn-primary" data-act="pay-debt" data-id="${d.id}">Catat pembayaran</button>` : ''}<button class="btn btn-sm" data-act="edit-debt" data-id="${d.id}">Ubah</button></div>`)}</div>`; };
  return pageHead('Utang & Cicilan', 'Status lunas dihitung dari pembayaran yang tercatat, bukan diubah manual', W('<button class="btn btn-primary" data-act="new-debt">Tambah utang/cicilan</button>')) +
    `<div class="kpis"><div class="kpi"><span class="lbl">Total kewajiban</span><span class="val num">${rp(totalDebt + totalCC)}</span><span class="sub">Utang, cicilan, dan tagihan kartu</span></div>
      <div class="kpi"><span class="lbl">Sisa utang & cicilan</span><span class="val num">${rp(totalDebt)}</span><span class="sub">${active.filter(d => !debtInfo(d).done).length} berjalan</span></div>
      <div class="kpi"><span class="lbl">Tagihan kartu kredit</span><span class="val num">${rp(totalCC)}</span><span class="sub">${ccs.length} kartu</span></div></div>` +
    (S.debts.length ? `<div class="cards">${S.debts.map(card).join('')}</div>` : emptyBox('Belum ada utang atau cicilan', 'Catat pinjaman, cicilan barang, atau PayLater beserta tenornya.')) +
    (ccs.length ? `<section class="panel"><div class="panel-h"><h2>Kartu kredit</h2></div><div class="panel-b">${ccs.map(a => `<div class="mini"><div class="l"><b>${esc(a.name)}</b><span>${a.dueDay ? 'Jatuh tempo tanggal ' + a.dueDay : 'Tanggal jatuh tempo belum diisi'}</span></div><div class="r"><span class="num">${rp(-(bal[a.id] || 0))}</span>${W(`<button class="btn btn-sm" data-act="new-txn" data-type="transfer" data-to="${a.id}" data-amount="${-(bal[a.id] || 0)}">Bayar</button>`)}</div></div>`).join('')}</div></section>` : '');
}

/* ---------- Savings goals ---------- */
function viewTabungan(){
  const bal = balances();
  const card = g => { const i = goalInfo(g, bal);
    return `<div class="card"><div class="card-top"><div><b>${esc(g.name)}</b>${sampleTag(g)}<div class="meta"><span>Rekening: ${esc(accName(g.accountId))}</span>${g.deadline ? `<span>· target ${fmtDate(g.deadline)}</span>` : ''}</div></div>${i.pct >= 1 ? pill('Tercapai','pos') : ''}</div>
      <div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="big num">${rp(i.cur)}</span><span class="muted num">dari ${rp(g.target)}</span></div>
      <div style="margin-top:8px">${bar(i.pct, 'pos')}</div><div class="meta" style="margin-top:6px"><span>${Math.round(i.pct*100)}% tercapai</span>${i.perMonth ? `<span>· perlu ${rp(i.perMonth)}/bulan</span>` : ''}</div></div>
      ${W(`<div class="card-actions"><button class="btn btn-sm btn-primary" data-act="new-txn" data-type="transfer" data-to="${g.accountId}">Setor</button><button class="btn btn-sm" data-act="edit-goal" data-id="${g.id}">Ubah</button></div>`)}</div>`; };
  return pageHead('Target Tabungan', 'Progres mengikuti saldo rekening yang ditautkan', W('<button class="btn btn-primary" data-act="new-goal">Tambah target</button>')) +
    (S.goals.length ? `<div class="cards">${S.goals.map(card).join('')}</div>` : emptyBox('Belum ada target tabungan', 'Buat rekening khusus (misalnya "Tabungan Darurat"), lalu tautkan ke target. Setoran dicatat sebagai transfer ke rekening itu.', '<button class="btn btn-primary" data-act="new-goal">Tambah target</button>')) +
    `<p class="note">Setoran ke tabungan adalah transfer antarrekening, sehingga tidak tercatat sebagai pengeluaran.</p>`;
}

/* ---------- Split (shared workspaces) ---------- */
function viewBagi(){
  const net = splitBalances(), sug = settleSuggestions(net);
  const list = sortTx(S.txns.filter(t => posted(t) && ((t.type === 'expense' && t.split) || t.type === 'settlement'))).slice(0, 100);
  const total = S.txns.filter(t => posted(t) && t.type === 'expense' && t.split).reduce((s, t) => s + (+t.amount), 0);
  return pageHead('Bagi Biaya', 'Pengeluaran bersama dibagi antaranggota; pelunasan mengurangi utang', W('<button class="btn" data-act="new-settle">Catat pelunasan</button><button class="btn btn-primary" data-act="new-txn" data-type="expense" data-split="1">Pengeluaran bersama</button>')) +
    `<div class="kpis">${memberIds().map(id => { const v = Math.round(net[id] || 0); return `<div class="kpi"><span class="lbl">${esc(memberName(id) === 'Anda' ? memberFull(id) + ' (Anda)' : memberName(id))}</span><span class="val num ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}">${v > 0 ? '+' : ''}${rp(v)}</span><span class="sub">${v > 0 ? 'Akan menerima' : v < 0 ? 'Perlu membayar' : 'Impas'}</span></div>`; }).join('')}
      <div class="kpi"><span class="lbl">Total pengeluaran bersama</span><span class="val num">${rp(total)}</span><span class="sub">Sepanjang waktu</span></div></div>
    <div class="grid2">
      <section class="panel"><div class="panel-h"><div><h2>Saran pelunasan</h2><p>Jumlah transfer paling sedikit agar semua impas</p></div></div><div class="panel-b">
        ${sug.length ? sug.map(s => `<div class="mini"><div class="l"><b>${esc(memberName(s.from))} membayar ${esc(memberName(s.to))}</b></div><div class="r"><span class="num">${rp(s.amount)}</span>${W(`<button class="btn btn-sm" data-act="new-settle" data-from="${s.from}" data-to="${s.to}" data-amount="${s.amount}">Catat lunas</button>`)}</div></div>`).join('') : '<div class="empty"><span>Semua anggota sudah impas.</span></div>'}
      </div></section>
      <section class="panel"><div class="panel-h"><h2>Cara kerja</h2></div><div class="panel-b"><ul class="limits">
        <li>Saat mencatat pengeluaran, pilih siapa yang membayar dan centang "Bagi biaya".</li>
        <li>Pembagian bisa rata, berdasarkan persentase, atau nominal per orang.</li>
        <li>Jika dibayar dari uang pribadi, kosongkan rekening agar saldo rekening bersama tidak berkurang.</li>
        <li>Pelunasan antaranggota tidak dihitung sebagai pemasukan atau pengeluaran.</li></ul></div></section>
    </div>
    <section class="panel"><div class="panel-h"><h2>Riwayat</h2></div><div class="panel-b" style="padding:8px 0 4px">${list.length ? `<div class="rows">${list.map(t => {
      const sh = t.type === 'expense' ? sharesOf(t) : null;
      return txRow(t, sh ? ' · ' + Object.entries(sh).map(([id, v]) => esc(memberName(id)) + ' ' + rp(v)).join(', ') : '');
    }).join('')}</div>` : '<div class="empty"><span>Belum ada pengeluaran bersama.</span></div>'}</div></section>`;
}
/* =====================================================================
   Views: tasks and calendar
   ===================================================================== */
const PR_ORDER = { tinggi:0, sedang:1, rendah:2 };
const taskSorter = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (PR_ORDER[a.priority] ?? 1) - (PR_ORDER[b.priority] ?? 1);
function taskMeta(k){
  const t = todayISO(), dd = k.due ? diffDays(t, k.due) : null, p = S.projects.find(x => x.id === k.projectId);
  return `${pill(PRIO[k.priority] || 'Sedang', k.priority === 'tinggi' ? 'neg' : k.priority === 'rendah' ? '' : 'acc')}${k.wedding ? pill('Wedding', 'info') : ''}${k.due ? `<span class="${k.status !== 'done' && dd < 0 ? 'neg' : ''}">${fmtDate(k.due)}${k.status !== 'done' ? ' · ' + relDue(dd) : ''}</span>` : '<span>Tanpa tenggat</span>'}${p ? `<span>· ${esc(p.name)}</span>` : ''}${k.assignee ? `<span>· ${esc(isShared() && WS().memberInfo && WS().memberInfo[k.assignee] ? memberName(k.assignee) : k.assignee)}</span>` : ''}${sampleTag(k)}`;
}
function taskRow(k){
  return `<div class="task-row ${k.status === 'done' ? 'done' : ''}">${W(`<button class="tick ${k.status === 'done' ? 'done' : ''}" data-act="task-done" data-id="${k.id}" aria-label="${k.status === 'done' ? 'Tandai belum selesai' : 'Tandai selesai'}">${k.status === 'done' ? ic('check', 13) : ''}</button>`)}
    <div class="l"><b>${esc(k.title)}</b>${k.status === 'doing' ? ' ' + pill('Dikerjakan','acc') : ''}<div class="meta">${taskMeta(k)}</div>${k.note ? `<p class="note" style="margin-top:4px">${esc(k.note)}</p>` : ''}</div>
    ${W(`<button class="icon-btn sm" data-act="edit-task" data-id="${k.id}" aria-label="Ubah tugas">${ic('edit',15)}</button>`)}</div>`;
}
function viewTugas(){
  let tasks = S.tasks.filter(k => ui.taskProject === 'all' || (ui.taskProject === 'none' ? !k.projectId : ui.taskProject === 'wedding' ? k.wedding : k.projectId === ui.taskProject));
  const projOpts = [['all','Semua tugas'],['none','Tanpa proyek']].concat(S.wedding.length ? [['wedding','Checklist wedding']] : [], S.projects.map(p => [p.id, p.name]))
    .map(([v, l]) => `<option value="${esc(v)}" ${ui.taskProject === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const head = pageHead('Tugas', 'Diurutkan berdasarkan tenggat lalu prioritas', W('<button class="btn" data-act="new-project">Proyek baru</button><button class="btn btn-primary" data-act="new-task">Tambah tugas</button>'));
  const filt = `<div class="filters"><div class="seg-tabs"><button data-act="task-view" data-v="list" aria-pressed="${ui.taskView === 'list'}">Daftar</button><button data-act="task-view" data-v="kanban" aria-pressed="${ui.taskView === 'kanban'}">Kanban</button></div>
    <select id="f-proj" data-filter="taskProject" aria-label="Proyek">${projOpts}</select>
    ${ui.taskView === 'list' ? `<label class="check"><input type="checkbox" id="f-done" data-filter="taskShowDone" ${ui.taskShowDone ? 'checked' : ''}>Tampilkan yang selesai</label>` : ''}
    ${projectProgress()}</div>`;
  if (ui.taskView === 'kanban') {
    const col = s => { const items = tasks.filter(k => (k.status || 'todo') === s).sort(taskSorter);
      return `<div class="col" data-col="${s}"><h3><span>${STATUS[s]}</span><span class="muted">${items.length}</span></h3>${items.map(k => `<div class="tcard" ${canWrite() ? 'draggable="true"' : ''} data-task="${k.id}"><b>${esc(k.title)}</b><div class="meta">${taskMeta(k)}</div>${W(`<div class="meta"><select data-status="${k.id}" aria-label="Status">${Object.entries(STATUS).map(([v, l]) => `<option value="${v}" ${(k.status || 'todo') === v ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="linkish" data-act="edit-task" data-id="${k.id}">Ubah</button></div>`)}</div>`).join('') || '<p class="note" style="padding:4px">Seret tugas ke sini</p>'}</div>`; };
    return head + `<section class="panel">${filt}<div class="panel-b kanban-wrap"><div class="kanban">${col('todo')}${col('doing')}${col('done')}</div></div></section>`;
  }
  const open = tasks.filter(k => k.status !== 'done').sort(taskSorter), done = tasks.filter(k => k.status === 'done').sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return head + `<section class="panel">${filt}${open.length ? open.map(taskRow).join('') : `<div class="empty"><b>Tidak ada tugas terbuka</b>${W('<button class="btn btn-sm btn-primary" data-act="new-task">Tambah tugas</button>')}</div>`}
    ${ui.taskShowDone && done.length ? `<div class="group-h">Selesai (${done.length})</div>${done.map(taskRow).join('')}` : ''}</section>`;
}
function projectProgress(){
  if (['all','none'].includes(ui.taskProject)) return '';
  const items = S.tasks.filter(k => ui.taskProject === 'wedding' ? k.wedding : k.projectId === ui.taskProject); if (!items.length) return '';
  const d = items.filter(k => k.status === 'done').length;
  return `<span class="muted" style="font-size:13px;display:flex;align-items:center;gap:8px">Progres ${d}/${items.length}<span style="width:90px;display:inline-block">${bar(d / items.length, 'pos')}</span></span>`;
}

function viewKalender(){
  const ym = ui.calMonth, [y, m] = ym.split('-').map(Number), first = new Date(y, m-1, 1), t = todayISO();
  const startOffset = (first.getDay() + 6) % 7, start = addDays(iso(first), -startOffset);
  const evs = expandEvents(ym), byDate = {};
  const put = (d, html) => (byDate[d] = byDate[d] || []).push(html);
  evs.forEach(x => put(x.date, `<span class="ev" title="${esc(x.e.title)}">${x.e.time ? esc(x.e.time) + ' ' : ''}${esc(x.e.title)}</span>`));
  S.tasks.forEach(k => { if (k.due && k.status !== 'done' && k.due.slice(0,7) === ym) put(k.due, `<span class="ev task" title="${esc(k.title)}">☐ ${esc(k.title)}</span>`); });
  if (modOn('finance')) S.debts.forEach(d => { if (d.archived) return; const pc = debtInfo(d).paidCount; for (let k = pc; k < d.count; k++) { const dd = addMonths(d.firstDue, k); if (dd > `${ym}-31`) break; if (dd.slice(0,7) === ym) put(dd, `<span class="ev due">${/^cicilan/i.test(d.name) ? '' : 'Cicilan '}${esc(d.name)}</span>`); } });
  if (modOn('wedding')) { S.wpays.forEach(p => { if (p.due && p.due.slice(0,7) === ym && wpayStatus(p) !== 'paid') put(p.due, `<span class="ev due">${esc(p.label)}</span>`); });
    const w = weddingInfo(); if (w && w.date && w.date.slice(0,7) === ym) put(w.date, `<span class="ev">Hari pernikahan</span>`); }
  if (modOn('travel')) S.trips.forEach(tr => { if (tr.status === 'impian' || !tr.start) return; tripDays(tr).forEach(d => { if (d.slice(0,7) === ym) put(d, `<span class="ev trip">${esc(tr.name)}</span>`); }); });
  const nCells = Math.ceil((startOffset + new Date(y, m, 0).getDate()) / 7) * 7;
  let cells = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < nCells; i++) {
    const d = addDays(start, i), items = byDate[d] || [];
    cells += `<button class="day ${d.slice(0,7) !== ym ? 'out' : ''} ${d === t ? 'today' : ''}" data-act="cal-day" data-date="${d}" aria-label="${fmtDate(d)}${canWrite() ? ', tambah acara' : ''}"><span class="dn">${+d.slice(8)}</span>${items.slice(0,3).join('')}${items.length > 3 ? `<span class="note">+${items.length - 3} lagi</span>` : ''}</button>`;
  }
  return pageHead('Kalender', 'Acara, tenggat tugas, jatuh tempo, dan perjalanan', W('<button class="btn btn-primary" data-act="new-event">Tambah acara</button>')) +
    `<section class="panel"><div class="panel-h"><div style="display:flex;align-items:center;gap:8px"><button class="icon-btn" data-act="cal-month" data-d="-1" aria-label="Bulan sebelumnya">${ic('back',16)}</button><b style="min-width:140px;text-align:center">${ymLabel(ym)}</b><button class="icon-btn" data-act="cal-month" data-d="1" aria-label="Bulan berikutnya" style="transform:scaleX(-1)">${ic('back',16)}</button>${ym !== curYM() ? '<button class="linkish" data-act="cal-today">Hari ini</button>' : ''}</div>
      <div class="legend"><span><i style="background:var(--accent-soft);border:1px solid var(--accent)"></i>Acara</span><span><i style="background:var(--surface-2);border:1px solid var(--line)"></i>Tugas</span><span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>Jatuh tempo</span><span><i style="background:var(--info-soft);border:1px solid var(--info)"></i>Perjalanan</span></div></div>
      <div class="panel-b cal-wrap"><div class="cal">${cells}</div></div></section>
    <section class="panel"><div class="panel-h"><h2>Acara bulan ini</h2></div><div class="panel-b">${evs.length ? evs.map(x => `<div class="mini"><div class="l"><b>${esc(x.e.title)}${sampleTag(x.e)}</b><span>${x.e.repeat && x.e.repeat !== 'none' ? REPEAT[x.e.repeat] : 'Sekali'}${x.e.note ? ' · ' + esc(x.e.note) : ''}</span></div><div class="r"><span class="when">${fmtDate(x.date)}${x.e.time ? ' · ' + esc(x.e.time) : ''}</span>${W(`<button class="icon-btn sm" data-act="edit-event" data-id="${x.e.id}" aria-label="Ubah acara">${ic('edit',15)}</button>`)}</div></div>`).join('') : '<div class="empty"><span>Belum ada acara bulan ini.</span></div>'}</div></section>`;
}
/* =====================================================================
   Views: wedding, travel, life goals, habits, journal
   ===================================================================== */

/* ---------- Wedding ---------- */
function panelWedding(){
  const w = weddingInfo(), dd = w.date ? diffDays(todayISO(), w.date) : null, tot = weddingTotals();
  const tasks = S.tasks.filter(isWeddingTask), done = tasks.filter(k => k.status === 'done').length;
  return `<section class="panel"><div class="panel-h"><div><h2>${esc(w.title || 'Pernikahan')}</h2><p>${w.date ? fmtDateLong(w.date) : 'Tanggal belum ditentukan'}</p></div><a class="linkish" href="#wedding">Buka</a></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
    ${dd !== null ? `<div class="count"><b class="num">${dd >= 0 ? dd : 0}</b><span class="muted">${dd > 0 ? 'hari lagi' : dd === 0 ? 'hari ini' : 'hari sejak pernikahan'}</span></div>` : ''}
    <div class="mini"><div class="l"><span>Terbayar dari anggaran</span></div><span class="num">${rp(tot.paid)} / ${rp(tot.est)}</span></div>
    ${bar(tot.est ? tot.paid / tot.est : 0, tot.paid > tot.est ? 'neg' : '')}
    <div class="mini"><div class="l"><span>Checklist</span></div><span class="num">${done}/${tasks.length} selesai</span></div></div></section>`;
}
function viewWedding(){
  const w = weddingInfo();
  if (!w) return pageHead('Wedding Planner', 'Anggaran, vendor, tamu, dan checklist pernikahan dalam satu tempat') +
    emptyBox('Mulai rencanakan pernikahan', 'Isi tanggal dan total anggaran dulu. Kategori anggaran standar akan dibuat otomatis dan bisa diubah.', '<button class="btn btn-primary" data-act="edit-wedding">Mulai rencana</button>');
  const tabs = [['ringkasan','Ringkasan'],['anggaran','Anggaran'],['vendor','Vendor & pembayaran'],['tamu','Tamu & RSVP'],['checklist','Checklist'],['inspirasi','Inspirasi']];
  const views = { ringkasan:wRingkasan, anggaran:wAnggaran, vendor:wVendor, tamu:wTamu, checklist:wChecklist, inspirasi:wInspo };
  return pageHead(esc(w.title || 'Wedding Planner'), `${w.date ? fmtDateLong(w.date) : 'Tanggal belum ditentukan'}${w.venue ? ' · ' + esc(w.venue) : ''}`, W('<button class="btn" data-act="edit-wedding">Ubah info</button>')) +
    `<section class="panel">${tabsHTML(tabs, ui.wTab, 'w-tab')}</section>` + (views[ui.wTab] || wRingkasan)();
}
function wRingkasan(){
  const w = weddingInfo(), t = todayISO(), dd = w.date ? diffDays(t, w.date) : null, tot = weddingTotals();
  const g = S.guests, invited = g.filter(x => x.invited).length, yes = g.filter(x => x.rsvp === 'hadir'), pax = yes.reduce((s, x) => s + (+x.pax || 1), 0);
  const tasks = S.tasks.filter(isWeddingTask), done = tasks.filter(k => k.status === 'done').length, late = tasks.filter(k => k.status !== 'done' && k.due && k.due < t).length;
  const pays = S.wpays.filter(p => wpayStatus(p) !== 'paid').sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).slice(0, 5);
  const next = tasks.filter(k => k.status !== 'done').sort(taskSorter).slice(0, 5);
  return `<div class="kpis">
    <div class="kpi"><span class="lbl">Hitung mundur</span><span class="val num">${dd === null ? '—' : dd >= 0 ? dd + ' hari' : 'Sudah lewat'}</span><span class="sub">${w.date ? fmtDate(w.date) : 'Isi tanggal di Ubah info'}</span></div>
    <div class="kpi"><span class="lbl">Anggaran</span><span class="val num">${rp(tot.est)}</span><span class="sub num">Sisa ${rp(tot.left)}</span></div>
    <div class="kpi"><span class="lbl">Nilai kontrak vendor</span><span class="val num">${rp(tot.contract)}</span><span class="sub num">Terbayar ${rp(tot.paid)}</span></div>
    <div class="kpi"><span class="lbl">Sisa kewajiban</span><span class="val num ${tot.owed ? 'warn-t' : ''}">${rp(tot.owed)}</span><span class="sub">Kontrak dikurangi yang sudah dibayar</span></div>
    <div class="kpi"><span class="lbl">Tamu</span><span class="val num">${pax} hadir</span><span class="sub">${g.length} tamu · ${invited} diundang</span></div>
    <div class="kpi"><span class="lbl">Checklist</span><span class="val num">${done}/${tasks.length}</span><span class="sub ${late ? 'neg' : ''}">${late ? late + ' terlambat' : 'Tidak ada yang terlambat'}</span></div>
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Pembayaran berikutnya</h2><button class="linkish" data-act="w-tab" data-v="vendor">Semua vendor</button></div><div class="panel-b">
      ${pays.length ? pays.map(p => { const v = vendor(p.vendorId), d2 = p.due ? diffDays(t, p.due) : null; return `<div class="mini"><div class="l"><b>${esc(p.label)} · ${esc(v ? v.name : 'Vendor')}</b><span class="${d2 !== null && d2 < 0 ? 'neg' : ''}">${p.due ? fmtDate(p.due) + ' · ' + relDue(d2) : 'Tanpa tanggal'}</span></div><div class="r"><span class="num">${rp(p.amount)}</span>${W(`<button class="btn btn-sm" data-act="pay-wpay" data-id="${p.id}">Bayar</button>`)}</div></div>`; }).join('') : '<div class="empty"><span>Tidak ada pembayaran terjadwal yang belum lunas.</span></div>'}</div></section>
    <section class="panel"><div class="panel-h"><h2>Checklist terdekat</h2><button class="linkish" data-act="w-tab" data-v="checklist">Semua</button></div><div class="panel-b" style="padding:6px 0">
      ${next.length ? next.map(taskRow).join('') : `<div class="empty"><span>Belum ada checklist.</span>${W('<button class="btn btn-sm" data-act="w-seed-checklist">Buat checklist standar</button>')}</div>`}</div></section>
  </div>`;
}
function wAnggaran(){
  const rows = S.wbudget.slice().sort((a, b) => (a.ord ?? 99) - (b.ord ?? 99));
  const calc = b => { const vs = S.vendors.filter(v => v.category === b.category); const chosen = vs.filter(v => v.status === 'dipilih');
    const contract = chosen.reduce((s, v) => s + (+v.contract || 0), 0), paid = vs.reduce((s, v) => s + vendorPaid(v.id), 0);
    return { contract, paid, owed: Math.max(0, contract - paid), diff: (+b.estimate || 0) - Math.max(contract, paid) }; };
  const tot = weddingTotals();
  const cols = 'grid-template-columns:minmax(0,1.2fr) 1fr 1fr 1fr 1fr auto';
  return `<section class="panel"><div class="panel-h"><div><h2>Anggaran per kategori</h2><p>Estimasi, nilai kontrak vendor terpilih, dan pembayaran tercatat</p></div>${W('<button class="btn btn-sm" data-act="new-wbudget">Tambah kategori</button>')}</div>
    <div class="panel-b" style="padding:12px 0 0"><div class="rows">
      <div class="row head" style="${cols}"><span>Kategori</span><span class="amt">Estimasi</span><span class="amt">Kontrak</span><span class="amt">Terbayar</span><span class="amt">Selisih estimasi</span><span></span></div>
      ${rows.map(b => { const c = calc(b); return `<div class="row plain" style="${cols}"><div class="desc"><b>${esc(b.category)}</b><span>${c.owed ? 'Sisa bayar ' + rp(c.owed) : c.contract ? 'Lunas' : 'Belum ada vendor terpilih'}</span></div>
        <span class="amt num hide-m">${rp(b.estimate)}</span><span class="amt num hide-m">${rp(c.contract)}</span><span class="amt num">${rp(c.paid)}</span><span class="amt num hide-m ${c.diff < 0 ? 'neg' : 'pos'}">${c.diff < 0 ? '−' : '+'}${rp(Math.abs(c.diff)).replace('−','')}</span>
        <div class="row-actions">${W(`<button class="icon-btn sm" data-act="edit-wbudget" data-id="${b.id}" aria-label="Ubah">${ic('edit',15)}</button>`)}</div></div>`; }).join('')}
      <div class="row plain" style="${cols};background:var(--surface-2);font-weight:700"><span>Total</span><span class="amt num hide-m">${rp(tot.est)}</span><span class="amt num hide-m">${rp(tot.contract)}</span><span class="amt num">${rp(tot.paid)}</span><span class="amt num hide-m"></span><span></span></div>
    </div></div></section>
    <p class="note">Realisasi berasal dari transaksi pengeluaran yang ditautkan ke vendor, jadi pembayaran wedding juga mengurangi saldo rekening dan masuk laporan keuangan.</p>`;
}
function wVendor(){
  const t = todayISO();
  const groups = {}; S.vendors.forEach(v => (groups[v.category] = groups[v.category] || []).push(v));
  const cats = Object.keys(groups).sort((a, b) => WED_CATS.indexOf(a) - WED_CATS.indexOf(b));
  const vcard = v => { const paid = vendorPaid(v.id), sched = S.wpays.filter(p => p.vendorId === v.id).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    const cheapest = groups[v.category].filter(x => x.status !== 'ditolak' && +x.quote > 0).sort((a, b) => a.quote - b.quote)[0];
    return `<div class="card ${v.status === 'ditolak' ? 'inactive' : ''}"><div class="card-top"><div><b>${esc(v.name)}</b>${sampleTag(v)}<div class="meta">${v.pkg ? `<span>${esc(v.pkg)}</span>` : ''}${v.contact ? `<span>· ${esc(v.contact)}</span>` : ''}</div></div>${pill(VENDOR_STATUS[v.status] || 'Kandidat', v.status === 'dipilih' ? 'pos' : v.status === 'negosiasi' ? 'warn' : v.status === 'ditolak' ? 'neg' : '')}</div>
      <div class="meta"><span>Penawaran ${+v.quote ? rp(v.quote) : '—'}</span>${cheapest && cheapest.id === v.id && groups[v.category].length > 1 ? pill('Termurah', 'info') : ''}${+v.contract ? `<span>· Kontrak ${rp(v.contract)}</span>` : ''}</div>
      ${v.status === 'dipilih' && +v.contract ? `<div>${bar(paid / v.contract, 'pos')}<div class="meta" style="margin-top:6px"><span>Terbayar ${rp(paid)} · sisa ${rp(Math.max(0, v.contract - paid))}</span></div></div>` : paid ? `<div class="meta"><span>Terbayar ${rp(paid)}</span></div>` : ''}
      ${v.note ? `<p class="note">${esc(v.note)}</p>` : ''}
      ${sched.length ? `<div>${sched.map(p => { const st = wpayStatus(p), d2 = p.due ? diffDays(t, p.due) : null; return `<div class="mini"><div class="l"><b>${esc(p.label)}</b><span class="${st !== 'paid' && d2 !== null && d2 < 0 ? 'neg' : ''}">${p.due ? fmtDate(p.due) : 'Tanpa tanggal'}${st === 'paid' ? ' · lunas' : d2 !== null ? ' · ' + relDue(d2) : ''}</span></div><div class="r"><span class="num">${rp(p.amount)}</span>${st === 'paid' ? pill('Lunas', 'pos') : W(`<button class="btn btn-sm" data-act="pay-wpay" data-id="${p.id}">Bayar</button>`)}${W(`<button class="icon-btn sm" data-act="edit-wpay" data-id="${p.id}" aria-label="Ubah jadwal">${ic('edit',14)}</button>`)}</div></div>`; }).join('')}</div>` : ''}
      ${W(`<div class="card-actions"><button class="btn btn-sm" data-act="edit-vendor" data-id="${v.id}">Ubah</button><button class="btn btn-sm" data-act="new-wpay" data-vendor="${v.id}">Jadwal bayar</button><button class="btn btn-sm" data-act="pay-vendor" data-id="${v.id}">Catat bayar</button></div>`)}</div>`; };
  return `<div class="page-head"><div><p>Bandingkan penawaran per kategori, lalu tandai vendor terpilih dan isi nilai kontraknya.</p></div><div class="head-actions">${W('<button class="btn btn-primary" data-act="new-vendor">Tambah vendor</button>')}</div></div>` +
    (cats.length ? cats.map(c => `<section style="display:flex;flex-direction:column;gap:10px"><h2>${esc(c)} <span class="muted" style="font-weight:500">· ${groups[c].length} vendor</span></h2><div class="cards">${groups[c].sort((a, b) => (a.status === 'ditolak') - (b.status === 'ditolak') || (+a.quote || 9e15) - (+b.quote || 9e15)).map(vcard).join('')}</div></section>`).join('')
      : emptyBox('Belum ada vendor', 'Catat setiap vendor yang Anda hubungi beserta penawarannya agar mudah dibandingkan.', '<button class="btn btn-primary" data-act="new-vendor">Tambah vendor</button>'));
}
function wTamu(){
  const g = S.guests, groups = Array.from(new Set(g.map(x => x.group).filter(Boolean))).sort();
  const q = ui.gQ.trim().toLowerCase();
  const list = g.filter(x => (ui.gGroup === 'all' || x.group === ui.gGroup) && (ui.gRsvp === 'all' || (x.rsvp || 'belum') === ui.gRsvp) && (!q || (x.name + ' ' + (x.phone || '')).toLowerCase().includes(q)))
    .sort((a, b) => (a.group || '').localeCompare(b.group || '') || a.name.localeCompare(b.name));
  const cnt = k => g.filter(x => (x.rsvp || 'belum') === k).length;
  const pax = g.filter(x => x.rsvp === 'hadir').reduce((s, x) => s + (+x.pax || 1), 0);
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`;
  return `<div class="kpis"><div class="kpi"><span class="lbl">Total tamu</span><span class="val num">${g.length}</span><span class="sub">${g.filter(x => x.invited).length} sudah diundang</span></div>
    <div class="kpi"><span class="lbl">Hadir</span><span class="val num pos">${cnt('hadir')}</span><span class="sub">${pax} orang termasuk pendamping</span></div>
    <div class="kpi"><span class="lbl">Mungkin</span><span class="val num warn-t">${cnt('mungkin')}</span><span class="sub">Perlu dikonfirmasi ulang</span></div>
    <div class="kpi"><span class="lbl">Belum jawab</span><span class="val num">${cnt('belum')}</span><span class="sub">${cnt('tidak')} tidak hadir</span></div></div>
  <section class="panel"><div class="filters">
    <select id="g-group" data-filter="gGroup" aria-label="Kelompok">${opt('all','Semua kelompok',ui.gGroup)}${groups.map(x => opt(x, x, ui.gGroup)).join('')}</select>
    <select id="g-rsvp" data-filter="gRsvp" aria-label="RSVP">${opt('all','Semua RSVP',ui.gRsvp)}${Object.entries(RSVP).map(([k, l]) => opt(k, l, ui.gRsvp)).join('')}</select>
    <input class="grow" type="search" id="g-q" data-filter="gQ" value="${esc(ui.gQ)}" placeholder="Cari nama atau nomor">
    ${W('<button class="btn btn-sm" data-act="bulk-guests">Tambah banyak</button><button class="btn btn-sm btn-primary" data-act="new-guest">Tambah tamu</button>')}</div>
    ${list.length ? `<div class="tbl-wrap"><table class="gtable"><thead><tr><th>Nama</th><th>Kelompok</th><th>Undangan</th><th>RSVP</th><th>Jumlah</th><th>Meja</th><th></th></tr></thead><tbody>
      ${list.map(x => `<tr><td><b style="font-weight:600">${esc(x.name)}</b>${sampleTag(x)}${x.phone ? `<div class="note">${esc(x.phone)}</div>` : ''}</td><td>${esc(x.group || '—')}</td>
        <td>${canWrite() ? `<button class="tick ${x.invited ? 'done' : ''}" data-act="guest-invited" data-id="${x.id}" aria-label="Sudah diundang">${x.invited ? ic('check', 13) : ''}</button>` : (x.invited ? 'Sudah' : 'Belum')}</td>
        <td>${canWrite() ? `<select data-rsvp="${x.id}" aria-label="RSVP ${esc(x.name)}">${Object.entries(RSVP).map(([k, l]) => `<option value="${k}" ${(x.rsvp || 'belum') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : RSVP[x.rsvp || 'belum']}</td>
        <td class="num">${+x.pax || 1}</td><td>${esc(x.table || '—')}</td><td>${W(`<button class="icon-btn sm" data-act="edit-guest" data-id="${x.id}" aria-label="Ubah">${ic('edit',14)}</button>`)}</td></tr>`).join('')}
    </tbody></table></div>` : `<div class="empty"><b>${g.length ? 'Tidak ada tamu yang cocok' : 'Belum ada daftar tamu'}</b>${g.length ? '' : '<span>Gunakan "Tambah banyak" untuk menempelkan daftar nama sekaligus.</span>'}</div>`}
  </section>`;
}
function wChecklist(){
  const tasks = S.tasks.filter(isWeddingTask), w = weddingInfo();
  if (!tasks.length) return emptyBox('Checklist masih kosong', w.date ? 'Buat checklist standar berdasarkan tanggal pernikahan, lalu sesuaikan.' : 'Isi tanggal pernikahan dulu agar tenggat checklist bisa dihitung.', w.date ? '<button class="btn btn-primary" data-act="w-seed-checklist">Buat checklist standar</button><button class="btn" data-act="new-task" data-wedding="1">Tambah manual</button>' : '<button class="btn btn-primary" data-act="edit-wedding">Isi tanggal</button>');
  const open = tasks.filter(k => k.status !== 'done').sort(taskSorter), done = tasks.filter(k => k.status === 'done');
  const groups = {};
  open.forEach(k => { const m = w.date && k.due ? Math.max(0, Math.round(diffDays(k.due, w.date) / 30)) : null; const key = m === null ? 'Tanpa tenggat' : m === 0 ? 'Bulan terakhir' : `${m} bulan sebelum hari H`; (groups[key] = groups[key] || []).push(k); });
  return `<section class="panel"><div class="panel-h"><div><h2>Checklist persiapan</h2><p>${done.length} dari ${tasks.length} selesai</p></div>${W('<button class="btn btn-sm" data-act="new-task" data-wedding="1">Tambah</button>')}</div>
    <div class="panel-b" style="padding:6px 0 0">${bar(done.length / tasks.length, 'pos').replace('class="bar', 'style="margin:0 16px 10px" class="bar')}
    ${Object.entries(groups).map(([k, items]) => `<div class="group-h">${k}</div>${items.map(taskRow).join('')}`).join('')}
    ${done.length ? `<div class="group-h">Selesai</div>${done.map(taskRow).join('')}` : ''}</div></section>`;
}
function wInspo(){
  const list = S.inspo.filter(x => ui.inspoKind === 'all' || x.kind === ui.inspoKind);
  const isImg = u => /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(u || '') || /images\.unsplash\.com|i\.pinimg\.com/.test(u || '');
  const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
  return `<section class="panel"><div class="filters"><select id="i-kind" data-filter="inspoKind" aria-label="Kategori">${[['all','Semua']].concat(INSPO_KINDS.map(k => [k, k])).map(([v, l]) => `<option value="${v}" ${ui.inspoKind === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span style="flex:1"></span>${W('<button class="btn btn-sm btn-primary" data-act="new-inspo">Simpan inspirasi</button>')}</div>
    <div class="panel-b">${list.length ? `<div class="inspo">${list.map(x => { const u = safeUrl(x.url); return `<div class="card">${u && isImg(u) ? `<img src="${esc(u)}" alt="${esc(x.title)}" loading="lazy" referrerpolicy="no-referrer">` : ''}<div class="card-top"><div><b>${esc(x.title)}</b><div class="meta"><span>${esc(x.kind)}</span></div></div>${W(`<button class="icon-btn sm" data-act="edit-inspo" data-id="${x.id}" aria-label="Ubah">${ic('edit',14)}</button>`)}</div>${x.note ? `<p class="note">${esc(x.note)}</p>` : ''}${u ? `<a class="linkish" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ic('link',13)} Buka tautan</a>` : ''}</div>`; }).join('')}</div>`
      : '<div class="empty"><b>Belum ada inspirasi</b><span>Simpan tautan Pinterest, Instagram, atau gambar referensi dekorasi, busana, dan undangan.</span></div>'}</div></section>`;
}

/* ---------- Travel ---------- */
function panelTrip(){
  const t = todayISO(), up = S.trips.filter(x => x.status === 'rencana' && x.end && x.end >= t).sort((a, b) => (a.start || '').localeCompare(b.start || ''))[0];
  if (!up) return '';
  const dd = up.start ? diffDays(t, up.start) : null, spent = tripSpent(up.id);
  return `<section class="panel"><div class="panel-h"><div><h2>${esc(up.name)}</h2><p>${esc(up.destination || '')}${up.start ? ' · ' + fmtDate(up.start) : ''}</p></div><button class="linkish" data-act="open-trip" data-id="${up.id}">Buka</button></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
    ${dd !== null ? `<div class="count"><b class="num">${Math.max(0, dd)}</b><span class="muted">${dd > 0 ? 'hari lagi' : 'sedang berlangsung'}</span></div>` : ''}
    ${+up.budget ? `<div class="mini"><div class="l"><span>Pengeluaran</span></div><span class="num">${rp(spent)} / ${rp(up.budget)}</span></div>${bar(spent / up.budget, spent > up.budget ? 'neg' : '')}` : ''}</div></section>`;
}
function viewTravel(){
  const tr = ui.tripId && trip(ui.tripId);
  if (tr) return viewTrip(tr);
  const t = todayISO();
  const plan = S.trips.filter(x => x.status === 'rencana').sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  const dream = S.trips.filter(x => x.status === 'impian'), past = S.trips.filter(x => x.status === 'selesai').sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  const card = x => { const spent = tripSpent(x.id), dd = x.start ? diffDays(t, x.start) : null;
    return `<div class="card click" data-act="open-trip" data-id="${x.id}"><div class="card-top"><div><b>${esc(x.name)}</b>${sampleTag(x)}<div class="meta"><span>${esc(x.destination || 'Destinasi belum diisi')}</span></div></div>${x.status === 'rencana' && dd !== null ? pill(dd > 0 ? `${dd} hari lagi` : x.end >= t ? 'Berlangsung' : 'Lewat', dd > 0 ? 'info' : 'acc') : pill(TRIP_STATUS[x.status])}</div>
      <div class="meta"><span>${x.start ? fmtDate(x.start) + (x.end && x.end !== x.start ? ' – ' + fmtDate(x.end) : '') : 'Tanggal belum ditentukan'}</span></div>
      ${+x.budget ? `<div>${bar(spent / x.budget, spent > x.budget ? 'neg' : '')}<div class="meta" style="margin-top:6px"><span>${rp(spent)} dari anggaran ${rp(x.budget)}</span></div></div>` : spent ? `<div class="meta"><span>Pengeluaran ${rp(spent)}</span></div>` : ''}</div>`; };
  const sec = (title, arr) => arr.length ? `<section style="display:flex;flex-direction:column;gap:10px"><h2>${title}</h2><div class="cards">${arr.map(card).join('')}</div></section>` : '';
  return pageHead('Travel Planner', 'Itinerary, booking, pengeluaran, dan packing list per perjalanan', W('<button class="btn btn-primary" data-act="new-trip">Tambah perjalanan</button>')) +
    (S.trips.length ? sec('Direncanakan', plan) + sec('Destinasi impian', dream) + sec('Selesai', past)
      : emptyBox('Belum ada perjalanan', 'Catat rencana liburan atau destinasi impian. Pengeluaran perjalanan tercatat di ledger keuangan dan bisa dibagi antaranggota.', '<button class="btn btn-primary" data-act="new-trip">Tambah perjalanan</button>'));
}
function viewTrip(tr){
  const tabs = [['itinerary','Itinerary'],['booking','Booking'],['biaya','Pengeluaran'],['packing','Packing list']];
  const spent = tripSpent(tr.id), dd = tr.start ? diffDays(todayISO(), tr.start) : null;
  const body = { itinerary:tItin, booking:tBook, biaya:tBiaya, packing:tPack }[ui.tripTab] || tItin;
  return `<div class="page-head"><div><button class="linkish" data-act="close-trip">${ic('back', 13)} Semua perjalanan</button><h1 style="margin-top:6px">${esc(tr.name)}</h1><p>${esc(tr.destination || '')}${tr.start ? ' · ' + fmtDate(tr.start) + (tr.end && tr.end !== tr.start ? ' – ' + fmtDate(tr.end) : '') : ''} · ${TRIP_STATUS[tr.status]}</p></div><div class="head-actions">${W(`<button class="btn" data-act="edit-trip" data-id="${tr.id}">Ubah</button>`)}</div></div>
    <div class="kpis"><div class="kpi"><span class="lbl">Keberangkatan</span><span class="val num">${dd === null ? '—' : dd > 0 ? dd + ' hari lagi' : tr.end >= todayISO() ? 'Berlangsung' : 'Selesai'}</span><span class="sub">${tripDays(tr).length ? tripDays(tr).length + ' hari perjalanan' : 'Tanggal belum diisi'}</span></div>
      <div class="kpi"><span class="lbl">Anggaran</span><span class="val num">${+tr.budget ? rp(tr.budget) : '—'}</span><span class="sub num">${+tr.budget ? 'Sisa ' + rp(tr.budget - spent) : 'Belum ditentukan'}</span></div>
      <div class="kpi"><span class="lbl">Pengeluaran</span><span class="val num neg">${rp(spent)}</span><span class="sub">${S.txns.filter(t => posted(t) && t.tripId === tr.id).length} transaksi</span></div>
      <div class="kpi"><span class="lbl">Packing</span><span class="val num">${S.packing.filter(p => p.tripId === tr.id && p.done).length}/${S.packing.filter(p => p.tripId === tr.id).length}</span><span class="sub">barang siap</span></div></div>
    <section class="panel">${tabsHTML(tabs, ui.tripTab, 'trip-tab')}${body(tr)}</section>`;
}
function tItin(tr){
  const items = S.itin.filter(x => x.tripId === tr.id).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const days = tripDays(tr); const byDay = {}; items.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
  const keys = days.length ? days.concat(Object.keys(byDay).filter(d => !days.includes(d)).sort()) : Object.keys(byDay).sort();
  return `<div class="filters"><span class="muted">${items.length} kegiatan</span><span style="flex:1"></span>${W(`<button class="btn btn-sm btn-primary" data-act="new-itin" data-trip="${tr.id}">Tambah kegiatan</button>`)}</div>
    ${keys.length ? keys.map((d, i) => `<div class="group-h">${days.includes(d) ? 'Hari ' + (days.indexOf(d) + 1) + ' · ' : ''}${fmtDateLong(d)}</div>${(byDay[d] || []).map(x => `<div class="task-row"><span class="when" style="width:48px">${esc(x.time || '—')}</span><div class="l"><b>${esc(x.title)}</b><div class="meta">${x.place ? `<span>${esc(x.place)}</span>` : ''}${x.note ? `<span>· ${esc(x.note)}</span>` : ''}</div></div>${W(`<button class="icon-btn sm" data-act="edit-itin" data-id="${x.id}" aria-label="Ubah">${ic('edit',14)}</button>`)}</div>`).join('') || `<div class="task-row"><span class="note">Belum ada kegiatan.</span>${W(`<span style="flex:1"></span><button class="linkish" data-act="new-itin" data-trip="${tr.id}" data-date="${d}">Tambah</button>`)}</div>`}`).join('')
      : '<div class="empty"><span>Isi tanggal perjalanan agar itinerary tersusun per hari.</span></div>'}`;
}
function tBook(tr){
  const items = S.bookings.filter(x => x.tripId === tr.id).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return `<div class="filters"><span class="muted">${items.length} booking · total ${rp(items.reduce((s, x) => s + (+x.cost || 0), 0))}</span><span style="flex:1"></span>${W(`<button class="btn btn-sm btn-primary" data-act="new-booking" data-trip="${tr.id}">Tambah booking</button>`)}</div>
    <div class="panel-b">${items.length ? items.map(x => { const paid = x.txnId && S.txns.find(t => t.id === x.txnId && posted(t));
      return `<div class="mini"><div class="l"><b>${esc(x.title)}</b><span>${esc(x.kind)}${x.date ? ' · ' + fmtDate(x.date) + (x.time ? ' ' + esc(x.time) : '') : ''}${x.ref ? ' · kode ' + esc(x.ref) : ''}</span></div><div class="r"><span class="num">${+x.cost ? rp(x.cost) : ''}</span>${paid ? pill('Tercatat', 'pos') : (+x.cost ? W(`<button class="btn btn-sm" data-act="pay-booking" data-id="${x.id}">Catat bayar</button>`) : '')}${W(`<button class="icon-btn sm" data-act="edit-booking" data-id="${x.id}" aria-label="Ubah">${ic('edit',14)}</button>`)}</div></div>`; }).join('')
      : '<div class="empty"><span>Simpan tiket pesawat, hotel, dan reservasi lain beserta kode booking-nya.</span></div>'}
      <p class="note" style="margin-top:10px">Jangan simpan nomor paspor atau KTP di sini. Simpan dokumen perjalanan di tempat yang terenkripsi.</p></div>`;
}
function tBiaya(tr){
  const list = sortTx(S.txns.filter(t => t.tripId === tr.id && t.status === 'posted'));
  const byCat = {}; list.forEach(t => { if (t.type === 'expense') byCat[t.categoryId || ''] = (byCat[t.categoryId || ''] || 0) + (+t.amount); });
  const max = Math.max(1, ...Object.values(byCat));
  return `<div class="filters"><span class="muted">${list.length} transaksi</span><span style="flex:1"></span>${W(`<button class="btn btn-sm btn-primary" data-act="new-txn" data-type="expense" data-trip="${tr.id}" ${isShared() ? 'data-split="1"' : ''}>Catat pengeluaran</button>`)}</div>
    ${Object.keys(byCat).length ? `<div class="panel-b">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div class="hbar"><span>${esc(catName(c))}</span>${bar(v / max)}<span class="num">${rp(v)}</span></div>`).join('')}</div>` : ''}
    <div class="rows">${list.length ? list.map(t => txRow(t)).join('') : '<div class="empty"><span>Belum ada pengeluaran untuk perjalanan ini.</span></div>'}</div>`;
}
function tPack(tr){
  const items = S.packing.filter(x => x.tripId === tr.id).sort((a, b) => (a.done - b.done) || a.item.localeCompare(b.item));
  return `<div class="filters"><span class="muted">${items.filter(x => x.done).length} dari ${items.length} siap</span><span style="flex:1"></span>${W(`${items.length ? '' : `<button class="btn btn-sm" data-act="pack-template" data-trip="${tr.id}">Isi daftar standar</button>`}`)}</div>
    <div class="panel-b">${W(`<form class="inline-form" data-form="pack" data-trip="${tr.id}" style="margin:0 0 10px"><input name="item" id="pack-item" placeholder="Tambah barang, pisahkan dengan koma" maxlength="300" autocomplete="off"><button class="btn btn-sm btn-primary" type="submit">Tambah</button></form>`)}
      ${items.length ? items.map(x => `<div class="ms ${x.done ? 'done' : ''}">${canWrite() ? `<button class="tick ${x.done ? 'done' : ''}" data-act="pack-toggle" data-id="${x.id}" aria-label="${esc(x.item)}">${x.done ? ic('check', 13) : ''}</button>` : ''}<span>${esc(x.item)}</span>${W(`<button class="icon-btn sm" data-act="pack-del" data-id="${x.id}" aria-label="Hapus">${ic('x',14)}</button>`)}</div>`).join('') : '<p class="muted">Belum ada barang.</p>'}</div>`;
}

/* ---------- Life goals ---------- */
function viewTujuan(){
  const list = S.lifegoals.filter(g => ui.goalCat === 'all' || g.category === ui.goalCat).sort((a, b) => (a.status === 'aktif' ? 0 : 1) - (b.status === 'aktif' ? 0 : 1) || (a.due || '9').localeCompare(b.due || '9'));
  const t = todayISO();
  const card = g => { const p = goalProgress(g), ms = g.milestones || [], dd = g.due ? diffDays(t, g.due) : null, sg = g.savingsGoalId && S.goals.find(x => x.id === g.savingsGoalId);
    return `<div class="card ${g.status === 'ditunda' ? 'inactive' : ''}"><div class="card-top"><div><b>${esc(g.title)}</b>${sampleTag(g)}<div class="meta"><span>${esc(g.category)}</span>${g.due ? `<span>· target ${fmtDate(g.due)}${g.status === 'aktif' && dd !== null ? ' (' + (dd < 0 ? 'lewat' : dd + ' hari lagi') + ')' : ''}</span>` : ''}</div></div>${pill(GOAL_STATUS[g.status] || 'Aktif', g.status === 'tercapai' ? 'pos' : g.status === 'ditunda' ? '' : 'acc')}</div>
      ${g.indicator ? `<p class="note"><b>Indikator berhasil:</b> ${esc(g.indicator)}</p>` : ''}
      <div>${bar(p, 'pos')}<div class="meta" style="margin-top:6px"><span>${Math.round(p * 100)}%${sg ? ' · mengikuti target tabungan "' + esc(sg.name) + '"' : ms.length ? ` · ${ms.filter(m => m.done).length}/${ms.length} milestone` : ''}</span></div></div>
      ${ms.length ? `<div>${ms.map(m => `<div class="ms ${m.done ? 'done' : ''}">${canWrite() ? `<button class="tick ${m.done ? 'done' : ''}" data-act="ms-toggle" data-goal="${g.id}" data-id="${m.id}" aria-label="${esc(m.title)}">${m.done ? ic('check', 13) : ''}</button>` : ''}<span>${esc(m.title)}${m.due ? ` <span class="note">· ${fmtDateShort(m.due)}</span>` : ''}</span>${W(`<button class="icon-btn sm" data-act="ms-del" data-goal="${g.id}" data-id="${m.id}" aria-label="Hapus milestone">${ic('x',13)}</button>`)}</div>`).join('')}</div>` : ''}
      ${W(`<form class="inline-form" data-form="ms" data-goal="${g.id}"><input name="title" id="ms-${g.id}" placeholder="Tambah milestone" maxlength="120" autocomplete="off"><button class="btn btn-sm" type="submit">Tambah</button></form>`)}
      ${(g.updates || []).length ? `<details><summary class="muted" style="cursor:pointer;font-size:12px">Catatan perkembangan (${g.updates.length})</summary>${g.updates.slice().reverse().map(u => `<div class="mini"><div class="l"><span>${fmtStamp(u.at)}</span><b style="font-weight:400">${esc(u.text)}</b></div></div>`).join('')}</details>` : ''}
      ${W(`<div class="card-actions"><button class="btn btn-sm" data-act="goal-update" data-id="${g.id}">Catat perkembangan</button><button class="btn btn-sm" data-act="edit-lgoal" data-id="${g.id}">Ubah</button></div>`)}</div>`; };
  const cats = Array.from(new Set(S.lifegoals.map(g => g.category)));
  return pageHead('Tujuan Hidup', 'Tujuan jangka pendek dan panjang, dipecah menjadi milestone', W('<button class="btn btn-primary" data-act="new-lgoal">Tambah tujuan</button>')) +
    (S.lifegoals.length ? `<div class="filters" style="border:0;padding:0"><select id="lg-cat" data-filter="goalCat" aria-label="Kategori"><option value="all">Semua kategori</option>${cats.map(c => `<option value="${esc(c)}" ${ui.goalCat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <span class="muted">${S.lifegoals.filter(g => g.status === 'aktif').length} aktif · ${S.lifegoals.filter(g => g.status === 'tercapai').length} tercapai</span></div><div class="cards">${list.map(card).join('')}</div>`
      : emptyBox('Belum ada tujuan', 'Tulis tujuan yang konkret, tentukan indikator keberhasilannya, lalu pecah menjadi beberapa milestone.', '<button class="btn btn-primary" data-act="new-lgoal">Tambah tujuan</button>'));
}

/* ---------- Habits ---------- */
function weekDates(){ const t = todayISO(), mon = addDays(t, -((parseISO(t).getDay() + 6) % 7)); return Array.from({ length:7 }, (_, i) => addDays(mon, i)); }
function habitWeekBtns(h){
  const t = todayISO();
  return `<div class="week">${weekDates().map(d => `<button class="dayck ${habitDone(h, d) ? 'on' : ''} ${d === t ? 'today' : ''}" ${canWrite() && d <= t ? `data-act="habit-toggle" data-id="${h.id}" data-date="${d}"` : 'disabled'} aria-label="${fmtDate(d)}${habitDone(h, d) ? ', selesai' : ''}"><span>${DOW[parseISO(d).getDay()]}</span><i>${habitDone(h, d) ? ic('check', 14) : ''}</i></button>`).join('')}</div>`;
}
function panelHabitsToday(){
  const t = todayISO(), hs = S.habits.filter(h => !h.archived);
  return `<section class="panel"><div class="panel-h"><div><h2>Kebiasaan hari ini</h2><p>${hs.filter(h => habitDone(h, t)).length} dari ${hs.length} selesai</p></div><a class="linkish" href="#kebiasaan">Semua</a></div><div class="panel-b">
    ${hs.slice(0, 5).map(h => `<div class="mini"><div class="l" style="display:flex;gap:10px;align-items:center">${canWrite() ? `<button class="tick ${habitDone(h, t) ? 'done' : ''}" data-act="habit-toggle" data-id="${h.id}" data-date="${t}" aria-label="${esc(h.name)}">${habitDone(h, t) ? ic('check', 13) : ''}</button>` : ''}<b>${esc(h.name)}</b></div><span class="muted num" style="font-size:12px">${habitStreak(h).n} ${habitStreak(h).unit} beruntun</span></div>`).join('')}</div></section>`;
}
function viewKebiasaan(){
  const hs = S.habits.filter(h => !h.archived), arch = S.habits.filter(h => h.archived);
  const row = h => { const st = habitStreak(h), r30 = habitRate(h, 28); const t = todayISO();
    const strip = Array.from({ length:28 }, (_, i) => addDays(t, -27 + i)).map(d => `<i class="${habitDone(h, d) ? 'on' : ''}" title="${fmtDate(d)}"></i>`).join('');
    const wk = weekDates().filter(d => habitDone(h, d)).length;
    return `<div class="habit"><div class="l"><b>${esc(h.name)}</b>${sampleTag(h)}<div class="meta"><span>${h.freq === 'weekly' ? `Target ${h.target}× per minggu · minggu ini ${wk}×` : 'Setiap hari'}</span><span>· ${st.n} ${st.unit} beruntun</span><span>· konsistensi 4 minggu ${Math.round(r30 * 100)}%</span></div><div class="strip" aria-label="28 hari terakhir">${strip}</div></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${habitWeekBtns(h)}${W(`<button class="icon-btn sm" data-act="edit-habit" data-id="${h.id}" aria-label="Ubah">${ic('edit',14)}</button>`)}</div></div>`; };
  return pageHead('Kebiasaan', 'Centang setiap kali kebiasaan dilakukan; konsistensi dihitung otomatis', W('<button class="btn btn-primary" data-act="new-habit">Tambah kebiasaan</button>')) +
    (hs.length ? `<section class="panel">${hs.map(row).join('')}</section>` : emptyBox('Belum ada kebiasaan', 'Mulai dari satu atau dua kebiasaan kecil, misalnya "Catat pengeluaran harian" atau "Jalan kaki 20 menit".', '<button class="btn btn-primary" data-act="new-habit">Tambah kebiasaan</button>')) +
    (arch.length ? `<section class="panel"><div class="panel-h"><h2 class="muted">Diarsipkan</h2></div><div class="panel-b">${arch.map(h => `<div class="mini"><div class="l"><b>${esc(h.name)}</b></div>${W(`<button class="btn btn-sm" data-act="edit-habit" data-id="${h.id}">Ubah</button>`)}</div>`).join('')}</div></section>` : '');
}

/* ---------- Journal ---------- */
function viewJurnal(){
  const q = ui.jQ.trim().toLowerCase();
  const list = S.journal.filter(j => (ui.jType === 'all' || j.type === ui.jType) && (!q || ((j.title || '') + ' ' + (j.body || '') + ' ' + (j.tags || '')).toLowerCase().includes(q)))
    .sort((a, b) => (b.date + (b.createdAt || 0)).localeCompare(a.date + (a.createdAt || 0)));
  const groups = {}; list.forEach(j => (groups[j.date.slice(0,7)] = groups[j.date.slice(0,7)] || []).push(j));
  return pageHead('Jurnal', 'Catatan harian, refleksi bulanan, tinjauan tahunan, dan ide', W('<button class="btn" data-act="new-journal" data-type="refleksi">Refleksi bulan ini</button><button class="btn btn-primary" data-act="new-journal">Tulis catatan</button>')) +
    (isShared() ? '<div class="banner info">Jurnal di workspace bersama bisa dibaca semua anggota. Tulis catatan pribadi di workspace Pribadi.</div>' : '') +
    (S.journal.length ? `<section class="panel"><div class="filters"><select id="j-type" data-filter="jType" aria-label="Jenis"><option value="all">Semua jenis</option>${Object.entries(J_TYPES).map(([k, l]) => `<option value="${k}" ${ui.jType === k ? 'selected' : ''}>${l}</option>`).join('')}</select><input class="grow" type="search" id="j-q" data-filter="jQ" value="${esc(ui.jQ)}" placeholder="Cari isi jurnal"></div>
      ${Object.keys(groups).length ? Object.entries(groups).map(([ym, items]) => `<div class="group-h">${ymLabel(ym)}</div>${items.map(j => `<div class="jentry" data-act="open-journal" data-id="${j.id}" role="button" tabindex="0"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(j.title || fmtDateLong(j.date))}</b><span class="when">${fmtDate(j.date)}</span></div><div class="meta" style="display:flex;gap:6px;flex-wrap:wrap">${pill(J_TYPES[j.type] || 'Catatan')}${j.mood ? pill('Suasana: ' + MOODS[j.mood - 1]) : ''}${j.tags ? String(j.tags).split(',').map(x => x.trim()).filter(Boolean).map(x => pill('#' + x, 'acc')).join('') : ''}${sampleTag(j)}</div><p>${esc(j.body || '')}</p></div>`).join('')}`).join('') : '<div class="empty"><span>Tidak ada catatan yang cocok.</span></div>'}</section>`
      : emptyBox('Jurnal masih kosong', 'Tulis catatan singkat setiap hari atau refleksi di akhir bulan.', '<button class="btn btn-primary" data-act="new-journal">Tulis catatan pertama</button>'));
}
/* =====================================================================
   Views: workspace & members, settings
   ===================================================================== */
function viewWorkspace(){
  const ws = WS(), cloud = backend.mode === 'cloud';
  if (!cloud) return pageHead('Workspace & Anggota', '') + `<section class="panel"><div class="panel-b" style="display:flex;flex-direction:column;gap:10px">
    <h2>Mode lokal</h2><p>Infina sedang berjalan tanpa Firebase, jadi hanya ada satu workspace pribadi dan data tersimpan di browser ini saja.</p>
    <p>Untuk sinkron di HP dan laptop serta mengundang pasangan atau keluarga, isi file <b>config.js</b> dengan konfigurasi Firebase. Langkahnya ada di README.</p></div></section>`;
  const owner = isOwner(), shared = isShared();
  const members = (ws.memberIds || []).slice().sort((a, b) => (ws.members[a] === 'owner' ? -1 : 0) - (ws.members[b] === 'owner' ? -1 : 0));
  const memberRow = id => { const info = (ws.memberInfo || {})[id] || {}, role = ws.members[id], self = id === me();
    const roleCtl = owner && !self && shared && role !== 'owner' ? `<select data-role="${id}" aria-label="Peran ${esc(info.name || '')}">${['editor','viewer'].map(r => `<option value="${r}" ${role === r ? 'selected' : ''}>${ROLE[r]}</option>`).join('')}</select>` : pill(ROLE[role] || role, role === 'owner' ? 'acc' : '');
    return `<div class="member"><span class="avatar">${esc(initials(info.name || info.email))}</span><div class="l"><b>${esc(info.name || info.email || 'Anggota')}${self ? ' (Anda)' : ''}</b><span>${esc(info.email || '')}</span></div>${roleCtl}
      ${owner && !self && shared ? `<button class="btn btn-sm" data-act="transfer-owner" data-id="${id}">Jadikan pemilik</button><button class="icon-btn sm" data-act="remove-member" data-id="${id}" aria-label="Keluarkan anggota" title="Keluarkan">${ic('x', 14)}</button>` : ''}</div>`; };
  const acts = sortTx(S.activity.map(a => ({ ...a, date: iso(new Date(a.at)), createdAt: a.at }))).slice(0, 40);
  return pageHead('Workspace & Anggota', 'Setiap workspace punya data, anggota, dan modul sendiri', '<button class="btn btn-primary" data-act="new-ws">Buat workspace bersama</button>') +
  `<div class="grid2">
    <section class="panel"><div class="panel-h"><div><h2>${esc(ws.name)}</h2><p>${shared ? 'Workspace bersama' : 'Workspace pribadi · hanya Anda yang bisa melihat'} · peran Anda: ${ROLE[myRole()]}</p></div>${owner ? '<button class="btn btn-sm" data-act="rename-ws">Ganti nama</button>' : ''}</div>
      <div class="panel-b">${members.map(memberRow).join('')}
      ${!owner && shared ? '<div style="margin-top:12px"><button class="btn btn-danger" data-act="leave-ws">Keluar dari workspace</button></div>' : ''}</div></section>
    ${shared && owner ? `<section class="panel"><div class="panel-h"><div><h2>Undang anggota</h2><p>Orang yang diundang masuk dengan akun Google dengan email yang sama</p></div></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
      <form data-form="invite" class="f2" style="align-items:end" novalidate><label class="f"><span>Email Google</span><input name="email" id="inv-email" type="email" autocomplete="off" placeholder="nama@gmail.com"></label>
        ${selectIn('role', 'Peran', [['editor','Editor (boleh mengubah data)'],['viewer','Hanya lihat']], 'editor')}<div><button class="btn btn-primary" type="submit">Kirim undangan</button></div></form>
      <p class="note">Infina tidak mengirim email. Beri tahu orang yang Anda undang untuk membuka Infina dan masuk; undangan akan muncul di bagian atas halaman.</p>
      ${backend.invitesOut.length ? `<div><h3 style="margin-bottom:6px">Menunggu diterima</h3>${backend.invitesOut.map(inv => `<div class="mini"><div class="l"><b>${esc(inv.email)}</b><span>${ROLE[inv.role]} · dikirim ${fmtStamp(inv.createdAt)}</span></div><button class="btn btn-sm" data-act="cancel-invite" data-id="${esc(inv.id)}">Batalkan</button></div>`).join('')}</div>` : ''}
    </div></section>` : !shared ? `<section class="panel"><div class="panel-h"><h2>Berbagi dengan pasangan atau keluarga</h2></div><div class="panel-b" style="display:flex;flex-direction:column;gap:10px">
      <p>Workspace pribadi tidak bisa dibagikan. Buat workspace bersama untuk keuangan rumah tangga, persiapan pernikahan, atau liburan bersama, lalu undang anggotanya.</p>
      <ul class="limits"><li>Data workspace bersama terpisah dari workspace pribadi.</li><li>Pemilik mengatur siapa yang boleh mengubah atau hanya melihat.</li><li>Pengeluaran bersama bisa dibagi dan dilunasi antaranggota.</li></ul></div></section>` : ''}
  </div>
  ${backend.invitesIn.length ? `<section class="panel"><div class="panel-h"><h2>Undangan untuk Anda</h2></div><div class="panel-b">${backend.invitesIn.map(inv => `<div class="mini"><div class="l"><b>${esc(inv.wsName)}</b><span>dari ${esc(inv.invitedByName || '')} · sebagai ${ROLE[inv.role]}</span></div><div class="r"><button class="btn btn-sm" data-act="decline-invite" data-id="${esc(inv.id)}">Tolak</button><button class="btn btn-sm btn-primary" data-act="accept-invite" data-id="${esc(inv.id)}">Terima</button></div></div>`).join('')}</div></section>` : ''}
  <div class="grid2">
    <section class="panel"><div class="panel-h"><h2>Semua workspace Anda</h2></div><div class="panel-b">${backend.workspaces.map(w => `<div class="mini"><div class="l"><b>${esc(w.name)}</b><span>${w.type === 'personal' ? 'Pribadi' : (w.memberIds || []).length + ' anggota'} · ${ROLE[w.members[me()]] || ''}</span></div>${w.id === ws.id ? pill('Aktif', 'acc') : `<button class="btn btn-sm" data-act="switch-ws" data-id="${esc(w.id)}">Buka</button>`}</div>`).join('')}</div></section>
    ${shared ? `<section class="panel"><div class="panel-h"><div><h2>Riwayat aktivitas</h2><p>Perubahan penting oleh anggota</p></div></div><div class="panel-b">${acts.length ? acts.map(a => `<div class="mini"><div class="l"><b style="font-weight:500">${esc(a.text)}</b><span>${esc(a.by === me() ? 'Anda' : (a.byName || memberName(a.by)))} · ${fmtStamp(a.at)}</span></div></div>`).join('') : '<p class="muted">Belum ada aktivitas.</p>'}</div></section>` : ''}
  </div>
  ${shared && owner ? `<section class="panel"><div class="panel-h"><h2 class="neg">Zona berbahaya</h2></div><div class="panel-b" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><p>Menghapus workspace akan menghapus seluruh datanya untuk semua anggota.</p><button class="btn btn-danger" data-act="delete-ws">Hapus workspace</button></div></section>` : ''}`;
}

function viewPengaturan(){
  const used = new Set(S.txns.map(t => t.categoryId).concat(S.budgets.map(b => b.categoryId), S.recurring.map(r => r.categoryId)));
  const catList = kind => sortedCats(kind).map(c => `<div class="mini"><div class="l"><b style="font-weight:500">${esc(c.name)}</b></div>${W(`<div class="r"><button class="btn btn-sm" data-act="edit-cat" data-id="${c.id}">Ubah</button>${used.has(c.id) ? '' : `<button class="btn btn-sm btn-danger" data-act="del-cat" data-id="${c.id}">Hapus</button>`}</div>`)}</div>`).join('');
  const hasSample = KINDS.some(k => S[k].some(x => x.sample));
  const mode = backend.mode, mods = settings().modules;
  return pageHead('Pengaturan', esc(WS().name)) + `<div class="grid2">
    <section class="panel"><div class="panel-h"><div><h2>Modul aktif</h2><p>Berlaku untuk workspace ini saja</p></div></div><div class="panel-b"><div class="modlist">
      ${Object.entries(MODULES).map(([k, l]) => `<label><input type="checkbox" data-module="${k}" id="mod-${k}" ${mods[k] !== false ? 'checked' : ''} ${canWrite() ? '' : 'disabled'}>${l}</label>`).join('')}</div>
      <p class="note" style="margin-top:10px">Menonaktifkan modul hanya menyembunyikan menunya. Datanya tetap tersimpan.</p></div></section>
    <section class="panel"><div class="panel-h"><h2>Penyimpanan & data</h2></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
      <p>${mode === 'cloud' ? `Data tersimpan di Firebase dan tersinkron ke semua perangkat yang masuk dengan akun ${esc(backend.user.email)}. Aplikasi tetap bisa dipakai saat offline; perubahan dikirim saat online kembali.` : mode === 'local' ? 'Mode lokal: data tersimpan di browser ini saja. Ekspor cadangan secara rutin, atau isi config.js agar tersinkron lewat Firebase.' : 'Penyimpanan diblokir; data hilang saat halaman ditutup.'}</p>
      <div class="head-actions"><button class="btn" data-act="export-json">Ekspor cadangan (JSON)</button><button class="btn" data-act="export-all-csv">Ekspor transaksi (CSV)</button>
        ${W('<label class="btn" for="importFile">Pulihkan dari cadangan<input type="file" id="importFile" accept=".json,application/json" hidden></label>')}</div>
      ${W(`<div class="head-actions">${hasSample ? '<button class="btn" data-act="clear-sample">Hapus data contoh</button>' : '<button class="btn" data-act="load-sample">Isi data contoh</button>'}${!isShared() || isOwner() ? '<button class="btn btn-danger" data-act="wipe">Hapus semua data workspace ini</button>' : ''}</div>`)}
    </div></section></div>
    ${modOn('finance') ? `<div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Kategori pengeluaran</h2>${W('<button class="btn btn-sm" data-act="new-cat" data-kind="expense">Tambah</button>')}</div><div class="panel-b">${catList('expense') || '<p class="muted">Belum ada.</p>'}</div></section>
      <section class="panel"><div class="panel-h"><h2>Kategori pemasukan</h2>${W('<button class="btn btn-sm" data-act="new-cat" data-kind="income">Tambah</button>')}</div><div class="panel-b">${catList('income') || '<p class="muted">Belum ada.</p>'}<p class="note" style="margin-top:10px">Kategori yang sudah dipakai tidak bisa dihapus, tetapi bisa diganti namanya.</p></div></section>
    </div>` : ''}
    <section class="panel"><div class="panel-h"><h2>Akun</h2></div><div class="panel-b" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
      ${mode === 'cloud' ? `<p>Masuk sebagai <b>${esc(backend.user.name)}</b> (${esc(backend.user.email)})</p><button class="btn" data-act="sign-out">${ic('logout', 15)}Keluar</button>` : '<p class="muted">Tidak ada akun dalam mode lokal.</p>'}</div></section>
    <section class="panel"><div class="panel-h"><h2>Tentang data Anda</h2></div><div class="panel-b"><ul class="limits">
      <li>Infina tidak meminta dan tidak perlu menyimpan nomor rekening lengkap, nomor kartu, NIK, atau nomor paspor. Simpan nama rekening dan 4 digit terakhir saja.</li>
      <li>Data workspace bersama bisa dilihat semua anggotanya. Catatan pribadi sebaiknya di workspace Pribadi.</li>
      <li>Anda bisa mengekspor seluruh data kapan saja dan menghapus seluruh data workspace dari halaman ini.</li>
      <li>Notifikasi hanya muncul di aplikasi. Transaksi berulang dicatat saat aplikasi dibuka pada atau setelah tanggalnya.</li></ul></div></section>`;
}

const VIEWS = { dashboard:viewDashboard, transaksi:viewTransaksi, rekening:viewRekening, anggaran:viewAnggaran, berulang:viewBerulang,
  utang:viewUtang, tabungan:viewTabungan, bagi:viewBagi, tugas:viewTugas, kalender:viewKalender, wedding:viewWedding, travel:viewTravel,
  tujuan:viewTujuan, kebiasaan:viewKebiasaan, jurnal:viewJurnal, workspace:viewWorkspace, pengaturan:viewPengaturan };
/* =====================================================================
   Forms: open + submit for every entity
   ===================================================================== */
const catByName = (name, kind='expense') => S.categories.find(c => c.kind === kind && c.name.toLowerCase() === name.toLowerCase());
const DEFAULT_EXP = ['Makanan & Minuman','Transportasi','Belanja','Kesehatan','Kebutuhan Pribadi','Hiburan','Tagihan','Pendidikan','Keluarga','Cicilan & Utang','Pernikahan','Perjalanan','Lainnya'];
const DEFAULT_INC = ['Gaji','Bonus','Usaha Sampingan','Lainnya'];
function ensureCat(name, kind='expense'){
  let c = catByName(name, kind); if (c) return c.id;
  c = { id: uid('cat'), name, kind, ord: 900 }; S.categories.push(c); persist('categories'); return c.id;
}
const curForm = () => $('#modalRoot form');

/* ---------- Transaction ---------- */
function txForm(t, preset){
  const isNew = !t; preset = preset || {};
  const shared = isShared();
  const accs = isNew ? activeAccounts() : S.accounts;
  const firstAcc = (accs.find(a => a.type !== 'credit_card') || accs[0] || {}).id || '';
  const defFrom = preset.to ? ((accs.find(a => a.id !== preset.to && a.type !== 'credit_card') || {}).id || '') : firstAcc;
  const d = t ? clone(t) : { type: preset.type || 'expense', date: todayISO(), amount: preset.amount ? +preset.amount : 0, accountId: defFrom, toAccountId: preset.to || '',
    categoryId: preset.categoryId || '', desc: preset.desc || '', note:'', dir:1, debtId: preset.debtId || '', vendorId: preset.vendorId || '', tripId: preset.tripId || '',
    paidBy: shared ? me() : null, split: preset.split && shared ? { mode:'equal', shares: Object.fromEntries(memberIds().map(id => [id, true])) } : null };
  const readonly = !!(t && (t.status === 'void' || !canWrite()));
  const accOpts = (shared ? [['', 'Uang pribadi (tidak mengubah saldo rekening)']] : []).concat(accs.map(a => [a.id, `${a.name} · ${ACC_TYPES[a.type]}${a.active === false ? ' (nonaktif)' : ''}`]));
  const debts = S.debts.filter(x => !x.archived || x.id === d.debtId), vendors = S.vendors.filter(v => v.status !== 'ditolak' || v.id === d.vendorId), trips = S.trips;
  const types = Object.entries(TX_TYPES).filter(([k]) => k !== 'settlement');
  if (t && t.type === 'settlement') return settleForm(t);
  const sp = d.split || { mode:'equal', shares:{} };
  const splitRows = memberIds().map(id => { const inc = d.split ? (sp.shares[id] !== undefined && sp.shares[id] !== null && sp.shares[id] !== false) : true; const val = d.split && sp.mode !== 'equal' && inc ? sp.shares[id] : '';
    return `<div class="split-row"><input type="checkbox" name="sp_in_${id}" id="sp-in-${id}" ${inc ? 'checked' : ''} aria-label="Ikut menanggung"><label for="sp-in-${id}">${esc(memberName(id) === 'Anda' ? memberFull(id) + ' (Anda)' : memberName(id))}</label><input type="text" inputmode="numeric" name="sp_v_${id}" id="sp-v-${id}" value="${val === '' || val === true ? '' : (sp.mode === 'amount' ? Math.round(val).toLocaleString('id-ID') : val)}" data-spv ${sp.mode === 'equal' ? 'hidden' : ''} placeholder="${sp.mode === 'percent' ? '%' : 'Rp'}"></div>`; }).join('');
  const body = `
    ${t && t.status === 'void' ? `<div class="banner err">Transaksi ini dibatalkan${t.voidedAt ? ' pada ' + fmtStamp(t.voidedAt) : ''} dan tidak dihitung di saldo maupun laporan.</div>` : ''}
    <div class="seg" role="radiogroup" aria-label="Jenis transaksi">${types.map(([k, l]) => `<label><input type="radio" name="type" value="${k}" ${d.type === k ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="f2">${moneyIn('amount', d.amount, 'Nominal')}${dateIn('date', 'Tanggal', d.date)}</div>
    <div class="f2">${selectIn('accountId', 'Rekening', accOpts, d.accountId ?? '')}${selectIn('toAccountId', 'Ke rekening', [['', 'Pilih rekening tujuan']].concat(accs.map(a => [a.id, a.name])), d.toAccountId, 'data-g="to"')}
      ${selectIn('categoryId', 'Kategori', [], d.categoryId, 'data-g="cat"')}${selectIn('dir', 'Arah koreksi', [['1', 'Tambah saldo'], ['-1', 'Kurangi saldo']], d.dir < 0 ? '-1' : '1', 'data-g="dir"')}
      ${shared ? selectIn('paidBy', 'Dibayar oleh', memberOpts(), d.paidBy || me(), 'data-g="payer"') : ''}</div>
    <p class="note" data-g="cchint" hidden>Pembayaran tagihan kartu kredit dicatat sebagai transfer, sehingga belanja yang sudah tercatat tidak terhitung dua kali.</p>
    ${textIn('desc', 'Deskripsi', d.desc, 'maxlength="120" placeholder="Contoh: Makan siang, Gaji November"')}
    ${shared ? `<div class="box" data-g="split"><label class="check" style="color:var(--fg);font-weight:600"><input type="checkbox" name="doSplit" id="doSplit" ${d.split ? 'checked' : ''}>Bagi biaya antaranggota</label>
      <div data-g="splitbody" ${d.split ? '' : 'hidden'} style="display:flex;flex-direction:column;gap:10px"><div class="seg" role="radiogroup" aria-label="Cara membagi">${Object.entries(SPLIT_MODES).map(([k, l]) => `<label><input type="radio" name="spMode" value="${k}" ${sp.mode === k ? 'checked' : ''}>${l}</label>`).join('')}</div>
      <div class="split-rows">${splitRows}</div><p class="note" id="spHint"></p></div></div>` : ''}
    <div data-g="links" class="f2">
      ${debts.length ? selectIn('debtId', 'Terkait cicilan/utang', [['', 'Tidak terkait']].concat(debts.map(x => [x.id, x.name])), d.debtId) : ''}
      ${vendors.length && modOn('wedding') ? selectIn('vendorId', 'Terkait vendor pernikahan', [['', 'Tidak terkait']].concat(vendors.map(v => [v.id, `${v.name} (${v.category})`])), d.vendorId) : ''}
      ${trips.length && modOn('travel') ? selectIn('tripId', 'Terkait perjalanan', [['', 'Tidak terkait']].concat(trips.map(x => [x.id, x.name])), d.tripId) : ''}</div>
    ${areaIn('note', 'Catatan', d.note, 'maxlength="500"')}
    ${t && t.history && t.history.length ? `<div class="hist"><b>Riwayat perubahan</b>${t.history.slice().reverse().map(h => `<span>${fmtStamp(h.at)}${h.byName ? ' · ' + esc(h.byName) : ''} — ${esc(h.what)}</span>`).join('')}</div>` : ''}
    ${t ? `<p class="note">Dibuat ${fmtStamp(t.createdAt)}${isShared() && t.createdBy ? ' oleh ' + esc(memberName(t.createdBy)) : ''}${t.recurringId ? ' · dari transaksi berulang' : ''}</p>` : ''}`;
  if (readonly) {
    openModal('Detail transaksi', `<form data-form="noop"><div class="mb">${body}</div><footer><button type="button" class="btn" data-act="close-modal">Tutup</button></footer></form>`, { noFocus:true });
    $$('#modalRoot input, #modalRoot select, #modalRoot textarea').forEach(el => el.disabled = true);
  } else {
    const foot = t && t.status === 'posted' ? `<button type="button" class="btn btn-danger" data-act="void-txn" data-id="${t.id}">${ic('ban', 15)}Batalkan transaksi</button>` : '';
    openModal(isNew ? 'Catat transaksi' : 'Ubah transaksi', formShell('tx', `data-id="${t ? t.id : ''}" data-rid="${uid('tx')}" data-sched="${esc(preset.schedId || '')}" data-booking="${esc(preset.bookingId || '')}"`, body, isNew ? 'Simpan' : 'Simpan perubahan', foot));
  }
  syncTxForm(curForm(), d.categoryId);
}
function syncTxForm(f, keepCat){
  if (!f) return;
  const type = (f.querySelector('input[name=type]:checked') || {}).value || 'expense';
  const show = (g, on) => $$(`[data-g="${g}"]`, f).forEach(el => el.hidden = !on);
  show('to', type === 'transfer'); show('cat', type === 'expense' || type === 'income'); show('dir', type === 'adjustment');
  show('links', type === 'expense'); show('split', type === 'expense'); show('payer', type === 'expense');
  const to = acc(f.elements.toAccountId.value); show('cchint', type === 'transfer' && to && to.type === 'credit_card');
  const accLabel = $('span', f.elements.accountId.closest('label')); if (accLabel) accLabel.textContent = type === 'transfer' ? 'Dari rekening' : 'Rekening';
  const sel = f.elements.categoryId, cur = keepCat !== undefined ? keepCat : sel.value;
  if (type === 'expense' || type === 'income') sel.innerHTML = `<option value="">Pilih kategori</option>` + sortedCats(type).map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const doSplit = f.elements.doSplit;
  if (doSplit) {
    show('splitbody', doSplit.checked);
    const mode = (f.querySelector('input[name=spMode]:checked') || {}).value || 'equal';
    $$('[data-spv]', f).forEach(el => { el.hidden = mode === 'equal'; el.placeholder = mode === 'percent' ? '%' : 'Rp'; });
    const hint = $('#spHint', f); if (hint) {
      const ids = memberIds().filter(id => f.elements['sp_in_' + id] && f.elements['sp_in_' + id].checked), amt = fm(f, 'amount');
      hint.textContent = mode === 'equal' ? (ids.length ? `Masing-masing ${rp(Math.floor(amt / ids.length))}` : 'Pilih minimal satu anggota') : mode === 'percent' ? `Total ${ids.reduce((s, id) => s + (parseFloat(String(f.elements['sp_v_' + id].value).replace(',', '.')) || 0), 0)}% (harus 100%)` : `Total ${rp(ids.reduce((s, id) => s + (Number(String(f.elements['sp_v_' + id].value).replace(/\D/g, '')) || 0), 0))} dari ${rp(amt)}`;
    }
  }
}
function submitTx(f){
  const id = f.dataset.id, rid = f.dataset.rid;
  if (!id && S.txns.some(t => t.id === rid)) { closeModal(); return; }
  const type = (f.querySelector('input[name=type]:checked') || {}).value;
  const shared = isShared();
  const v = { type, amount: fm(f, 'amount'), date: fv(f, 'date'), accountId: fv(f, 'accountId') || null, toAccountId: type === 'transfer' ? fv(f, 'toAccountId') : null,
    categoryId: (type === 'expense' || type === 'income') ? fv(f, 'categoryId') : null, dir: type === 'adjustment' ? Number(fv(f, 'dir')) : 1,
    debtId: type === 'expense' ? (fv(f, 'debtId') || null) : null, vendorId: type === 'expense' ? (fv(f, 'vendorId') || null) : null, tripId: type === 'expense' ? (fv(f, 'tripId') || null) : null,
    paidBy: shared && type === 'expense' ? (fv(f, 'paidBy') || me()) : null, split: null, desc: fv(f, 'desc'), note: fv(f, 'note') };
  if (!v.amount || v.amount <= 0) return formErr(f, 'Isi nominal lebih dari 0.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return formErr(f, 'Isi tanggal transaksi.');
  if (!v.accountId && !(shared && type === 'expense')) return formErr(f, 'Pilih rekening.');
  if (v.accountId && !acc(v.accountId)) return formErr(f, 'Rekening tidak ditemukan.');
  if (type === 'transfer') { if (!acc(v.toAccountId)) return formErr(f, 'Pilih rekening tujuan transfer.'); if (v.toAccountId === v.accountId) return formErr(f, 'Rekening asal dan tujuan harus berbeda.'); }
  if ((type === 'expense' || type === 'income') && !cat(v.categoryId)) return formErr(f, 'Pilih kategori.');
  if (shared && type === 'expense' && f.elements.doSplit && f.elements.doSplit.checked) {
    const mode = (f.querySelector('input[name=spMode]:checked') || {}).value || 'equal';
    const ids = memberIds().filter(x => f.elements['sp_in_' + x] && f.elements['sp_in_' + x].checked);
    if (!ids.length) return formErr(f, 'Pilih minimal satu anggota yang menanggung biaya.');
    const shares = {};
    if (mode === 'equal') ids.forEach(x => shares[x] = true);
    else if (mode === 'percent') { let sum = 0; ids.forEach(x => { const p = parseFloat(String(f.elements['sp_v_' + x].value).replace(',', '.')) || 0; shares[x] = p; sum += p; }); if (Math.abs(sum - 100) > 0.01) return formErr(f, `Total persentase harus 100% (sekarang ${sum}%).`); }
    else { let sum = 0; ids.forEach(x => { const a = Number(String(f.elements['sp_v_' + x].value).replace(/\D/g, '')) || 0; shares[x] = a; sum += a; }); if (sum !== v.amount) return formErr(f, `Total pembagian ${rp(sum)} harus sama dengan nominal ${rp(v.amount)}.`); }
    v.split = { mode, shares };
  }
  if (!v.accountId && !v.split && shared && type === 'expense' && v.paidBy) { /* paid personally, not split: recorded as shared spending only */ }
  $('button[type=submit]', f).disabled = true;
  const who = backend.user ? backend.user.name : '';
  if (!id) {
    const tx = mkTx(Object.assign({ id: rid }, v));
    if (f.dataset.sched) { const p = S.wpays.find(x => x.id === f.dataset.sched); if (p) { p.txnId = rid; tx.schedId = p.id; persist('wpays'); } }
    if (f.dataset.booking) { const b = S.bookings.find(x => x.id === f.dataset.booking); if (b) { b.txnId = rid; persist('bookings'); } }
    S.txns.push(tx); persist('txns');
    logAct(`Mencatat ${TX_TYPES[type].toLowerCase()} ${rp(v.amount)}${v.desc ? ' — ' + v.desc : ''}`);
    toast(`${TX_TYPES[type]} ${rp(v.amount)} tercatat`);
  } else {
    const t = S.txns.find(x => x.id === id); if (!t) return closeModal();
    const L = { type:'Jenis', amount:'Nominal', date:'Tanggal', accountId:'Rekening', toAccountId:'Rekening tujuan', categoryId:'Kategori', dir:'Arah', debtId:'Cicilan', vendorId:'Vendor', tripId:'Perjalanan', paidBy:'Pembayar', split:'Pembagian', desc:'Deskripsi', note:'Catatan' };
    const show = (k, x) => k === 'amount' ? rp(x) : k === 'type' ? TX_TYPES[x] : (k === 'accountId' || k === 'toAccountId') ? accName(x) : k === 'categoryId' ? catName(x) : k === 'date' ? fmtDate(x) : k === 'paidBy' ? memberName(x) : (x || '—');
    const changes = [];
    Object.keys(L).forEach(k => { if (stable(t[k] ?? null) !== stable(v[k] ?? null)) changes.push(['note','desc','split','debtId','vendorId','tripId'].includes(k) ? `${L[k]} diubah` : `${L[k]}: ${show(k, t[k])} → ${show(k, v[k])}`); });
    if (!changes.length) { closeModal(); return; }
    Object.assign(t, v, { updatedAt: Date.now() });
    t.history = (t.history || []).concat([{ at: Date.now(), by: me(), byName: who, what: changes.join('; ') }]).slice(-20);
    persist('txns'); logAct(`Mengubah transaksi "${t.desc || TX_TYPES[t.type]}": ${changes.join('; ')}`);
    toast('Perubahan disimpan; saldo dan laporan diperbarui');
  }
  closeModal(); render();
}
function settleForm(t, preset){
  preset = preset || {};
  const d = t || { paidBy: preset.from || me(), toMember: preset.to || memberIds().find(x => x !== me()) || '', amount: preset.amount ? +preset.amount : 0, date: todayISO(), note:'' };
  const foot = t && t.status === 'posted' && canWrite() ? `<button type="button" class="btn btn-danger" data-act="void-txn" data-id="${t.id}">${ic('ban', 15)}Batalkan</button>` : '';
  openModal(t ? 'Pelunasan antaranggota' : 'Catat pelunasan', formShell('settle', `data-id="${t ? t.id : ''}" data-rid="${uid('tx')}"`,
    `<div class="f2">${selectIn('paidBy', 'Dibayar oleh', memberOpts(), d.paidBy)}${selectIn('toMember', 'Kepada', memberOpts(), d.toMember)}</div>
     <div class="f2">${moneyIn('amount', d.amount, 'Nominal')}${dateIn('date', 'Tanggal', d.date)}</div>
     ${areaIn('note', 'Catatan', d.note, 'maxlength="300" placeholder="Contoh: transfer BCA"')}
     <p class="note">Pelunasan hanya mengubah saldo utang antaranggota, tidak dihitung sebagai pemasukan atau pengeluaran workspace.</p>`, 'Simpan', foot));
}
function submitSettle(f){
  const id = f.dataset.id, rid = f.dataset.rid;
  const v = { paidBy: fv(f, 'paidBy'), toMember: fv(f, 'toMember'), amount: fm(f, 'amount'), date: fv(f, 'date'), note: fv(f, 'note') };
  if (v.paidBy === v.toMember) return formErr(f, 'Pembayar dan penerima harus berbeda.');
  if (v.amount <= 0) return formErr(f, 'Isi nominal lebih dari 0.');
  if (!v.date) return formErr(f, 'Isi tanggal.');
  if (id) { const t = S.txns.find(x => x.id === id); Object.assign(t, v, { updatedAt: Date.now() }); }
  else { if (S.txns.some(t => t.id === rid)) return closeModal(); S.txns.push(mkTx(Object.assign({ id: rid, type:'settlement', desc:`Pelunasan ${memberFull(v.paidBy)} ke ${memberFull(v.toMember)}` }, v))); }
  persist('txns'); logAct(`Mencatat pelunasan ${rp(v.amount)} dari ${memberFull(v.paidBy)} ke ${memberFull(v.toMember)}`);
  toast('Pelunasan dicatat'); closeModal(); render();
}

/* ---------- Accounts ---------- */
function accountForm(a){
  const d = a || { name:'', type:'bank', opening:0, last4:'', limit:0, dueDay:'' };
  const isCC = d.type === 'credit_card';
  const body = `${textIn('name', 'Nama rekening', d.name, 'maxlength="50" placeholder="Contoh: BCA Gaji, Dompet, GoPay"')}
    <div class="f2">${selectIn('type', 'Jenis', Object.entries(ACC_TYPES), d.type)}${textIn('last4', '4 digit terakhir (opsional)', d.last4, 'inputmode="numeric" maxlength="4" placeholder="Tidak wajib"')}</div>
    <div data-cc="0" ${isCC ? 'hidden' : ''}>${moneyIn('opening', isCC ? 0 : d.opening, 'Saldo awal', 'Saldo saat mulai mencatat di Infina. Untuk koreksi di kemudian hari, gunakan "Koreksi saldo".')}</div>
    <div data-cc="1" ${isCC ? '' : 'hidden'} style="display:flex;flex-direction:column;gap:14px">${moneyIn('ccOpening', isCC ? -d.opening : 0, 'Tagihan awal', 'Tagihan yang belum dibayar saat mulai mencatat.')}<div class="f2">${moneyIn('limit', d.limit, 'Limit kartu')}${textIn('dueDay', 'Tanggal jatuh tempo (1–31)', d.dueDay, 'inputmode="numeric" maxlength="2"')}</div></div>
    <p class="note">Simpan nama dan 4 digit terakhir saja. Nomor rekening atau kartu lengkap tidak perlu dan tidak disimpan.</p>`;
  const foot = a ? `<button type="button" class="btn ${a.active === false ? '' : 'btn-danger'}" data-act="toggle-account" data-id="${a.id}">${a.active === false ? 'Aktifkan kembali' : 'Nonaktifkan'}</button>` : '';
  openModal(a ? 'Ubah rekening' : 'Tambah rekening', formShell('account', `data-id="${a ? a.id : ''}"`, body, a ? 'Simpan perubahan' : 'Tambah rekening', foot));
  if (a) { const sel = curForm().elements.type; sel.disabled = true; sel.title = 'Jenis rekening tidak bisa diubah setelah dibuat'; }
}
function submitAccount(f){
  const id = f.dataset.id, type = fv(f, 'type'), name = fv(f, 'name'), last4 = fv(f, 'last4'), dueDay = fv(f, 'dueDay');
  if (!name) return formErr(f, 'Isi nama rekening.');
  if (S.accounts.some(a => a.id !== id && a.name.toLowerCase() === name.toLowerCase())) return formErr(f, 'Nama rekening sudah dipakai. Gunakan nama lain.');
  if (last4 && !/^\d{4}$/.test(last4)) return formErr(f, '4 digit terakhir harus berupa 4 angka.');
  if (type === 'credit_card' && dueDay && !(+dueDay >= 1 && +dueDay <= 31)) return formErr(f, 'Tanggal jatuh tempo harus 1 sampai 31.');
  const v = { name, type, last4, opening: type === 'credit_card' ? -fm(f, 'ccOpening') : fm(f, 'opening'), limit: type === 'credit_card' ? fm(f, 'limit') : 0, dueDay: type === 'credit_card' && dueDay ? +dueDay : null };
  if (id) { Object.assign(acc(id), v, { updatedAt: Date.now() }); toast('Rekening diperbarui'); }
  else { S.accounts.push(Object.assign({ id: uid('acc'), currency:'IDR', active:true, createdAt: Date.now() }, v)); logAct(`Menambah rekening ${name}`); toast('Rekening ditambahkan'); }
  persist('accounts'); closeModal(); render();
}
function adjustForm(a){
  const cur = balances()[a.id] || 0, isCC = a.type === 'credit_card';
  openModal('Koreksi saldo', formShell('adjust', `data-id="${a.id}" data-rid="${uid('tx')}"`,
    `<p>${isCC ? 'Tagihan' : 'Saldo'} <b>${esc(a.name)}</b> menurut catatan: <b class="num">${rp(isCC ? -cur : cur)}</b></p>
     ${moneyIn('actual', 0, isCC ? 'Tagihan sebenarnya' : 'Saldo sebenarnya')}${textIn('desc', 'Keterangan', 'Koreksi saldo', 'maxlength="120"')}
     <p class="note">Selisihnya dicatat sebagai transaksi Penyesuaian. Saldo awal tidak diubah, jadi jejak koreksi tetap terlihat.</p>`, 'Catat koreksi'));
}
function submitAdjust(f){
  const a = acc(f.dataset.id), rid = f.dataset.rid; if (!a) return closeModal();
  if (S.txns.some(t => t.id === rid)) return closeModal();
  if (!fv(f, 'actual')) return formErr(f, 'Isi saldo sebenarnya (boleh 0).');
  const cur = balances()[a.id] || 0, target = a.type === 'credit_card' ? -fm(f, 'actual') : fm(f, 'actual'), diff = target - cur;
  if (Math.round(diff) === 0) { toast('Saldo sudah sesuai, tidak ada koreksi'); return closeModal(); }
  S.txns.push(mkTx({ id: rid, type:'adjustment', amount: Math.abs(diff), dir: diff < 0 ? -1 : 1, accountId: a.id, desc: fv(f, 'desc') || 'Koreksi saldo' }));
  persist('txns'); logAct(`Koreksi saldo ${a.name} ${diff < 0 ? '−' : '+'}${rp(Math.abs(diff))}`); toast(`Koreksi ${diff < 0 ? '−' : '+'}${rp(Math.abs(diff))} dicatat`); closeModal(); render();
}

/* ---------- Budget, recurring, debt, savings goal ---------- */
function budgetForm(b){
  const ym = b ? b.month : ui.budMonth, taken = new Set(S.budgets.filter(x => x.month === ym && (!b || x.id !== b.id)).map(x => x.categoryId));
  const cats = sortedCats('expense').filter(c => !taken.has(c.id));
  if (!b && !cats.length) { toast('Semua kategori pengeluaran sudah punya anggaran bulan ini'); return; }
  openModal(`${b ? 'Ubah' : 'Tambah'} anggaran · ${ymLabel(ym)}`, formShell('budget', `data-id="${b ? b.id : ''}" data-month="${ym}"`,
    `${selectIn('categoryId', 'Kategori pengeluaran', [['', 'Pilih kategori']].concat(cats.map(c => [c.id, c.name])), b ? b.categoryId : '')}${moneyIn('limit', b ? b.limit : 0, 'Batas anggaran')}`, 'Simpan', b ? delBtn('del-budget', b.id) : ''));
}
function submitBudget(f){
  const id = f.dataset.id, categoryId = fv(f, 'categoryId'), limit = fm(f, 'limit');
  if (!cat(categoryId)) return formErr(f, 'Pilih kategori.');
  if (limit <= 0) return formErr(f, 'Isi batas anggaran lebih dari 0.');
  if (id) Object.assign(S.budgets.find(b => b.id === id), { categoryId, limit });
  else S.budgets.push({ id: uid('bud'), month: f.dataset.month, categoryId, limit });
  persist('budgets'); toast('Anggaran disimpan'); closeModal(); render();
}
function recForm(r){
  const d = r || { type:'expense', amount:0, accountId:(activeAccounts()[0] || {}).id, toAccountId:'', categoryId:'', desc:'', freq:'monthly', start: todayISO(), end:'' };
  const accOpts = activeAccounts().map(a => [a.id, a.name]);
  const catOpts = k => sortedCats(k).map(c => [c.id, c.name]);
  const body = `${selectIn('type', 'Jenis', [['expense','Pengeluaran'],['income','Pemasukan'],['transfer','Transfer']], d.type)}
    ${textIn('desc', 'Deskripsi', d.desc, 'maxlength="120" placeholder="Contoh: Internet rumah, Gaji"')}
    <div class="f2">${moneyIn('amount', d.amount, 'Nominal')}${selectIn('freq', 'Frekuensi', Object.entries(FREQ), d.freq)}</div>
    <div class="f2">${selectIn('accountId', 'Rekening', accOpts, d.accountId)}<div data-rg="transfer">${selectIn('toAccountId', 'Ke rekening', [['', 'Pilih']].concat(accOpts), d.toAccountId)}</div>
      <div data-rg="expense">${selectIn('catE', 'Kategori', [['', 'Pilih kategori']].concat(catOpts('expense')), d.type === 'expense' ? d.categoryId : '')}</div>
      <div data-rg="income">${selectIn('catI', 'Kategori', [['', 'Pilih kategori']].concat(catOpts('income')), d.type === 'income' ? d.categoryId : '')}</div></div>
    <div class="f2">${dateIn('start', 'Mulai tanggal', d.start)}${dateIn('end', 'Berakhir (opsional)', d.end)}</div>
    <p class="note">Jika tanggal mulai di masa lalu, kemunculan yang sudah lewat langsung dicatat saat disimpan.</p>`;
  openModal(r ? 'Ubah transaksi berulang' : 'Tambah transaksi berulang', formShell('rec', `data-id="${r ? r.id : ''}"`, body, 'Simpan', r ? delBtn('del-rec', r.id, 'Hapus jadwal') : ''));
  syncRecForm(curForm());
}
function syncRecForm(f){ const t = f.elements.type.value; $$('[data-rg]', f).forEach(el => el.hidden = el.dataset.rg !== t); }
function submitRec(f){
  const id = f.dataset.id, type = fv(f, 'type');
  const v = { type, desc: fv(f, 'desc'), amount: fm(f, 'amount'), freq: fv(f, 'freq'), accountId: fv(f, 'accountId'), toAccountId: type === 'transfer' ? fv(f, 'toAccountId') : null,
    categoryId: type === 'expense' ? fv(f, 'catE') : type === 'income' ? fv(f, 'catI') : null, start: fv(f, 'start'), end: fv(f, 'end') || null };
  if (!v.desc) return formErr(f, 'Isi deskripsi.');
  if (v.amount <= 0) return formErr(f, 'Isi nominal lebih dari 0.');
  if (!acc(v.accountId)) return formErr(f, 'Pilih rekening.');
  if (type === 'transfer' && (!acc(v.toAccountId) || v.toAccountId === v.accountId)) return formErr(f, 'Pilih rekening tujuan yang berbeda.');
  if (type !== 'transfer' && !cat(v.categoryId)) return formErr(f, 'Pilih kategori.');
  if (!v.start) return formErr(f, 'Isi tanggal mulai.');
  if (v.end && v.end < v.start) return formErr(f, 'Tanggal berakhir harus setelah tanggal mulai.');
  if (id) Object.assign(S.recurring.find(r => r.id === id), v); else S.recurring.push(Object.assign({ id: uid('rec'), paused:false }, v));
  persist('recurring'); closeModal(); runRecurring(); toast('Jadwal disimpan'); render();
}
function debtForm(d){
  const x = d || { name:'', kind:'cicilan', lender:'', installment:0, count:12, firstDue: addMonths(todayISO(), 1), note:'' };
  const body = `${textIn('name', 'Nama', x.name, 'maxlength="60" placeholder="Contoh: Cicilan laptop"')}
    <div class="f2">${selectIn('kind', 'Jenis', Object.entries(DEBT_KINDS), x.kind)}${textIn('lender', 'Pemberi pinjaman / toko', x.lender, 'maxlength="60"')}</div>
    <div class="f2">${moneyIn('installment', x.installment, 'Cicilan per bulan')}${textIn('count', 'Tenor (kali bayar)', x.count, 'inputmode="numeric" maxlength="3"')}</div>
    ${dateIn('firstDue', 'Jatuh tempo pertama', x.firstDue)}${areaIn('note', 'Catatan', x.note, 'maxlength="300"')}
    <p class="note">Pembayaran dicatat sebagai pengeluaran yang ditautkan ke utang ini. Sisa dan status lunas dihitung dari pembayaran itu.</p>`;
  const foot = d ? `<button type="button" class="btn ${d.archived ? '' : 'btn-danger'}" data-act="archive-debt" data-id="${d.id}">${d.archived ? 'Aktifkan kembali' : 'Arsipkan'}</button>` : '';
  openModal(d ? 'Ubah utang/cicilan' : 'Tambah utang/cicilan', formShell('debt', `data-id="${d ? d.id : ''}"`, body, 'Simpan', foot));
}
function submitDebt(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), kind: fv(f, 'kind'), lender: fv(f, 'lender'), installment: fm(f, 'installment'), count: parseInt(fv(f, 'count'), 10) || 0, firstDue: fv(f, 'firstDue'), note: fv(f, 'note') };
  if (!v.name) return formErr(f, 'Isi nama utang/cicilan.');
  if (v.installment <= 0) return formErr(f, 'Isi cicilan per bulan lebih dari 0.');
  if (v.count < 1 || v.count > 600) return formErr(f, 'Tenor harus 1 sampai 600 kali.');
  if (!v.firstDue) return formErr(f, 'Isi tanggal jatuh tempo pertama.');
  if (id) Object.assign(S.debts.find(d => d.id === id), v); else S.debts.push(Object.assign({ id: uid('debt'), archived:false, createdAt: Date.now() }, v));
  persist('debts'); toast('Utang/cicilan disimpan'); closeModal(); render();
}
function goalForm(g){
  const accs = activeAccounts().filter(a => a.type !== 'credit_card');
  if (!accs.length) { toast('Tambahkan rekening tabungan terlebih dahulu'); location.hash = '#rekening'; return; }
  const x = g || { name:'', target:0, deadline:'', accountId: accs[0].id };
  openModal(g ? 'Ubah target tabungan' : 'Tambah target tabungan', formShell('goal', `data-id="${g ? g.id : ''}"`,
    `${textIn('name', 'Nama target', x.name, 'maxlength="60" placeholder="Contoh: Dana darurat, Dana pernikahan"')}
     <div class="f2">${moneyIn('target', x.target, 'Target nominal')}${dateIn('deadline', 'Tenggat (opsional)', x.deadline)}</div>
     ${selectIn('accountId', 'Rekening tabungan', accs.map(a => [a.id, a.name]), x.accountId)}
     <p class="note">Progres = saldo rekening ini. Gunakan rekening yang khusus untuk target ini agar progresnya akurat.</p>`, 'Simpan', g ? delBtn('del-goal', g.id) : ''));
}
function submitGoal(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), target: fm(f, 'target'), deadline: fv(f, 'deadline') || null, accountId: fv(f, 'accountId') };
  if (!v.name) return formErr(f, 'Isi nama target.');
  if (v.target <= 0) return formErr(f, 'Isi target nominal lebih dari 0.');
  if (!acc(v.accountId)) return formErr(f, 'Pilih rekening.');
  if (S.goals.some(g => g.id !== id && g.accountId === v.accountId)) return formErr(f, 'Rekening ini sudah dipakai target lain. Satu rekening untuk satu target.');
  if (id) Object.assign(S.goals.find(g => g.id === id), v); else S.goals.push(Object.assign({ id: uid('goal') }, v));
  persist('goals'); toast('Target disimpan'); closeModal(); render();
}

/* ---------- Tasks, events, projects, categories ---------- */
function taskForm(k, preset){
  preset = preset || {};
  const x = k || { title:'', note:'', priority:'sedang', due: preset.due || '', status:'todo', projectId: (!['all','none','wedding'].includes(ui.taskProject)) ? ui.taskProject : '', assignee:'', wedding: !!preset.wedding || ui.taskProject === 'wedding' };
  const assignee = isShared() ? selectIn('assignee', 'Penanggung jawab', [['', 'Belum ditentukan']].concat(memberOpts()), x.assignee) : textIn('assignee', 'Penanggung jawab (opsional)', x.assignee, 'maxlength="40"');
  openModal(k ? 'Ubah tugas' : 'Tambah tugas', formShell('task', `data-id="${k ? k.id : ''}"`,
    `${textIn('title', 'Judul', x.title, 'maxlength="120" placeholder="Contoh: Bayar iuran lingkungan"')}
     <div class="f2">${selectIn('priority', 'Prioritas', Object.entries(PRIO), x.priority)}${dateIn('due', 'Tenggat', x.due)}</div>
     <div class="f2">${selectIn('status', 'Status', Object.entries(STATUS), x.status)}${selectIn('projectId', 'Proyek', [['', 'Tanpa proyek']].concat(S.projects.map(p => [p.id, p.name])), x.projectId)}</div>
     ${assignee}
     ${modOn('wedding') && weddingInfo() ? `<label class="check"><input type="checkbox" name="wedding" id="t-wedding" ${x.wedding ? 'checked' : ''}>Bagian dari checklist wedding</label>` : ''}
     ${areaIn('note', 'Catatan', x.note, 'maxlength="1000"')}`, 'Simpan', k ? delBtn('del-task', k.id) : ''));
}
function submitTask(f){
  const id = f.dataset.id, v = { title: fv(f, 'title'), priority: fv(f, 'priority'), due: fv(f, 'due') || null, status: fv(f, 'status'), projectId: fv(f, 'projectId') || null, assignee: fv(f, 'assignee'), note: fv(f, 'note') };
  if (f.elements.wedding) v.wedding = fchk(f, 'wedding');
  if (!v.title) return formErr(f, 'Isi judul tugas.');
  if (id) { const k = S.tasks.find(x => x.id === id); if (v.status === 'done' && k.status !== 'done') v.doneAt = Date.now(); Object.assign(k, v); }
  else { S.tasks.push(Object.assign({ id: uid('task'), createdAt: Date.now(), doneAt: v.status === 'done' ? Date.now() : null }, v)); logAct(`Menambah tugas "${v.title}"`); }
  persist('tasks'); toast('Tugas disimpan'); closeModal(); render();
}
function setTaskStatus(id, status){
  const k = S.tasks.find(x => x.id === id); if (!k || k.status === status || !canWrite()) return;
  k.status = status; k.doneAt = status === 'done' ? Date.now() : null; persist('tasks');
  if (status === 'done') logAct(`Menyelesaikan tugas "${k.title}"`);
  render();
}
function eventForm(e, date){
  const x = e || { title:'', date: date || todayISO(), time:'', repeat:'none', note:'' };
  openModal(e ? 'Ubah acara' : 'Tambah acara', formShell('event', `data-id="${e ? e.id : ''}"`,
    `${textIn('title', 'Nama acara', x.title, 'maxlength="100" placeholder="Contoh: Ulang tahun Ibu"')}
     <div class="f2">${dateIn('date', 'Tanggal', x.date)}<label class="f"><span>Jam (opsional)</span><input type="time" name="time" id="t-time" value="${esc(x.time || '')}"></label></div>
     ${selectIn('repeat', 'Pengulangan', Object.entries(REPEAT), x.repeat || 'none')}${areaIn('note', 'Catatan', x.note, 'maxlength="500"')}
     <p class="note">Pengingat muncul di notifikasi sehari sebelum dan pada hari acara.</p>`, 'Simpan', e ? delBtn('del-event', e.id) : ''));
}
function submitEvent(f){
  const id = f.dataset.id, v = { title: fv(f, 'title'), date: fv(f, 'date'), time: fv(f, 'time'), repeat: fv(f, 'repeat'), note: fv(f, 'note') };
  if (!v.title) return formErr(f, 'Isi nama acara.');
  if (!v.date) return formErr(f, 'Isi tanggal.');
  if (id) Object.assign(S.events.find(x => x.id === id), v); else S.events.push(Object.assign({ id: uid('ev') }, v));
  persist('events'); toast('Acara disimpan'); closeModal(); render();
}
function catForm(c, kind){
  openModal(c ? 'Ubah kategori' : 'Tambah kategori', formShell('cat', `data-id="${c ? c.id : ''}" data-kind="${c ? c.kind : kind}"`, textIn('name', 'Nama kategori', c ? c.name : '', 'maxlength="40"'), 'Simpan'));
}
function submitCat(f){
  const id = f.dataset.id, name = fv(f, 'name'), kind = f.dataset.kind;
  if (!name) return formErr(f, 'Isi nama kategori.');
  if (S.categories.some(c => c.id !== id && c.kind === kind && c.name.toLowerCase() === name.toLowerCase())) return formErr(f, 'Kategori dengan nama ini sudah ada.');
  if (id) S.categories.find(c => c.id === id).name = name; else S.categories.push({ id: uid('cat'), name, kind, ord: 500 });
  persist('categories'); closeModal(); render();
}

/* ---------- Wedding ---------- */
const WED_SPLIT = { Venue:20, Katering:35, Dekorasi:10, Dokumentasi:8, Busana:7, Makeup:4, Undangan:3, Souvenir:3, Hiburan:4, Transportasi:2, Lainnya:4 };
function weddingForm(){
  const w = weddingInfo(), x = w || { title:'Pernikahan Kami', date:'', venue:'', note:'' };
  openModal(w ? 'Ubah info pernikahan' : 'Mulai rencana pernikahan', formShell('wedding', '',
    `${textIn('title', 'Judul', x.title, 'maxlength="80" placeholder="Contoh: Pernikahan Alfi & Dimas"')}
     <div class="f2">${dateIn('date', 'Tanggal pernikahan', x.date)}${textIn('venue', 'Lokasi (opsional)', x.venue, 'maxlength="80"')}</div>
     ${w ? '' : moneyIn('total', 0, 'Total anggaran (opsional)', 'Jika diisi, anggaran dibagi otomatis ke 11 kategori berdasarkan porsi umum (misalnya katering 35%, venue 20%). Angkanya bisa diubah kapan saja.')}
     ${areaIn('note', 'Catatan', x.note, 'maxlength="500"')}`, w ? 'Simpan' : 'Mulai'));
}
function submitWedding(f){
  const v = { title: fv(f, 'title') || 'Pernikahan', date: fv(f, 'date') || null, venue: fv(f, 'venue'), note: fv(f, 'note') };
  const w = weddingInfo();
  if (w) Object.assign(w, v);
  else {
    S.wedding.push(Object.assign({ id:'wedding', createdAt: Date.now() }, v));
    const total = fm(f, 'total');
    WED_CATS.forEach((c, i) => S.wbudget.push({ id: uid('wb'), category:c, estimate: total ? Math.round(total * WED_SPLIT[c] / 100 / 1000) * 1000 : 0, ord:i }));
    persist('wbudget'); ensureCat('Pernikahan'); logAct('Memulai rencana pernikahan');
  }
  persist('wedding'); closeModal(); ui.wTab = 'ringkasan'; toast('Info pernikahan disimpan'); render();
}
function wbudgetForm(b){
  openModal(b ? 'Ubah kategori anggaran' : 'Tambah kategori anggaran', formShell('wbudget', `data-id="${b ? b.id : ''}"`,
    `${textIn('category', 'Kategori', b ? b.category : '', 'maxlength="40"' + (b && S.vendors.some(v => v.category === b.category) ? ' readonly title="Kategori dipakai vendor"' : ''))}${moneyIn('estimate', b ? b.estimate : 0, 'Estimasi biaya')}`,
    'Simpan', b && !S.vendors.some(v => v.category === b.category) ? delBtn('del-wbudget', b.id) : ''));
}
function submitWbudget(f){
  const id = f.dataset.id, v = { category: fv(f, 'category'), estimate: fm(f, 'estimate') };
  if (!v.category) return formErr(f, 'Isi nama kategori.');
  if (S.wbudget.some(b => b.id !== id && b.category.toLowerCase() === v.category.toLowerCase())) return formErr(f, 'Kategori ini sudah ada.');
  if (id) Object.assign(S.wbudget.find(b => b.id === id), v); else S.wbudget.push(Object.assign({ id: uid('wb'), ord: 50 }, v));
  persist('wbudget'); closeModal(); render();
}
function vendorForm(v){
  const cats = Array.from(new Set(S.wbudget.map(b => b.category).concat(WED_CATS)));
  const x = v || { name:'', category: cats[0], status:'kandidat', contact:'', pkg:'', quote:0, contract:0, note:'' };
  const hasPay = v && S.txns.some(t => t.vendorId === v.id);
  openModal(v ? 'Ubah vendor' : 'Tambah vendor', formShell('vendor', `data-id="${v ? v.id : ''}"`,
    `${textIn('name', 'Nama vendor', x.name, 'maxlength="80"')}
     <div class="f2">${selectIn('category', 'Kategori', cats.map(c => [c, c]), x.category)}${selectIn('status', 'Status', Object.entries(VENDOR_STATUS), x.status)}</div>
     <div class="f2">${textIn('contact', 'Kontak', x.contact, 'maxlength="80" placeholder="Nama, WA, atau Instagram"')}${textIn('pkg', 'Paket layanan', x.pkg, 'maxlength="80"')}</div>
     <div class="f2">${moneyIn('quote', x.quote, 'Harga penawaran')}${moneyIn('contract', x.contract, 'Nilai kontrak / hasil negosiasi', 'Isi setelah vendor dipilih.')}</div>
     ${areaIn('note', 'Catatan negosiasi', x.note, 'maxlength="600"')}`, 'Simpan', v && !hasPay ? delBtn('del-vendor', v.id) : ''));
}
function submitVendor(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), category: fv(f, 'category'), status: fv(f, 'status'), contact: fv(f, 'contact'), pkg: fv(f, 'pkg'), quote: fm(f, 'quote'), contract: fm(f, 'contract'), note: fv(f, 'note') };
  if (!v.name) return formErr(f, 'Isi nama vendor.');
  if (v.status === 'dipilih' && !v.contract && v.quote) v.contract = v.quote;
  if (!S.wbudget.some(b => b.category === v.category)) { S.wbudget.push({ id: uid('wb'), category: v.category, estimate: 0, ord: 60 }); persist('wbudget'); }
  if (id) { const o = S.vendors.find(x => x.id === id); if (o.status !== 'dipilih' && v.status === 'dipilih') logAct(`Memilih vendor ${v.name} (${v.category})`); Object.assign(o, v); }
  else S.vendors.push(Object.assign({ id: uid('ven') }, v));
  persist('vendors'); closeModal(); toast('Vendor disimpan'); render();
}
function wpayForm(p, vendorId){
  const x = p || { vendorId, label: S.wpays.some(q => q.vendorId === vendorId) ? 'Pelunasan' : 'DP', due:'', amount:0 };
  const v = vendor(x.vendorId);
  openModal(`${p ? 'Ubah' : 'Tambah'} jadwal bayar · ${v ? v.name : ''}`, formShell('wpay', `data-id="${p ? p.id : ''}" data-vendor="${x.vendorId}"`,
    `<div class="f2">${textIn('label', 'Keterangan', x.label, 'maxlength="40" placeholder="DP, Termin 2, Pelunasan"')}${dateIn('due', 'Jatuh tempo', x.due)}</div>${moneyIn('amount', x.amount, 'Nominal')}
     ${v && +v.contract ? `<p class="note">Nilai kontrak ${rp(v.contract)} · sudah terjadwal ${rp(S.wpays.filter(q => q.vendorId === v.id && (!p || q.id !== p.id)).reduce((s, q) => s + (+q.amount || 0), 0))}</p>` : ''}`,
    'Simpan', p && wpayStatus(p) !== 'paid' ? delBtn('del-wpay', p.id) : ''));
}
function submitWpay(f){
  const id = f.dataset.id, v = { vendorId: f.dataset.vendor, label: fv(f, 'label') || 'Pembayaran', due: fv(f, 'due') || null, amount: fm(f, 'amount') };
  if (v.amount <= 0) return formErr(f, 'Isi nominal lebih dari 0.');
  if (id) Object.assign(S.wpays.find(x => x.id === id), v); else S.wpays.push(Object.assign({ id: uid('wp'), txnId:null }, v));
  persist('wpays'); closeModal(); render();
}
function guestForm(g){
  const groups = Array.from(new Set(S.guests.map(x => x.group).filter(Boolean)));
  const x = g || { name:'', group: ui.gGroup !== 'all' ? ui.gGroup : '', phone:'', invited:false, rsvp:'belum', pax:1, table:'', note:'' };
  openModal(g ? 'Ubah tamu' : 'Tambah tamu', formShell('guest', `data-id="${g ? g.id : ''}"`,
    `${textIn('name', 'Nama', x.name, 'maxlength="80"')}
     <div class="f2"><label class="f"><span>Kelompok</span><input name="group" id="t-group" list="groupList" value="${esc(x.group)}" maxlength="40" placeholder="Keluarga, teman kantor, …"><datalist id="groupList">${groups.map(gr => `<option value="${esc(gr)}">`).join('')}</datalist></label>${textIn('phone', 'Nomor HP (opsional)', x.phone, 'inputmode="tel" maxlength="20"')}</div>
     <div class="f2">${selectIn('rsvp', 'RSVP', Object.entries(RSVP), x.rsvp)}${textIn('pax', 'Jumlah orang', x.pax, 'inputmode="numeric" maxlength="2"')}${textIn('table', 'Meja / area', x.table, 'maxlength="20"')}</div>
     <label class="check"><input type="checkbox" name="invited" id="t-invited" ${x.invited ? 'checked' : ''}>Undangan sudah dikirim</label>
     ${areaIn('note', 'Catatan', x.note, 'maxlength="300"')}`, 'Simpan', g ? delBtn('del-guest', g.id) : ''));
}
function submitGuest(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), group: fv(f, 'group'), phone: fv(f, 'phone'), rsvp: fv(f, 'rsvp'), pax: Math.max(1, parseInt(fv(f, 'pax'), 10) || 1), table: fv(f, 'table'), invited: fchk(f, 'invited'), note: fv(f, 'note') };
  if (!v.name) return formErr(f, 'Isi nama tamu.');
  if (id) Object.assign(S.guests.find(x => x.id === id), v); else S.guests.push(Object.assign({ id: uid('gst') }, v));
  persist('guests'); closeModal(); render();
}
function bulkGuestForm(){
  openModal('Tambah banyak tamu', formShell('bulkguest', '',
    `${textIn('group', 'Kelompok', ui.gGroup !== 'all' ? ui.gGroup : '', 'maxlength="40" placeholder="Contoh: Keluarga mempelai pria"')}
     ${areaIn('names', 'Daftar nama', '', 'class="big" style="min-height:180px" placeholder="Satu nama per baris. Tambahkan jumlah orang setelah koma, misalnya:\nBudi Santoso, 2\nSiti Aminah"')}`, 'Tambahkan'));
}
function submitBulkGuest(f){
  const group = fv(f, 'group'), lines = fv(f, 'names').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return formErr(f, 'Isi minimal satu nama.');
  lines.slice(0, 1000).forEach(l => { const m = l.match(/^(.*?)(?:[,;]\s*(\d{1,2}))?$/); S.guests.push({ id: uid('gst'), name: (m[1] || l).trim(), group, phone:'', invited:false, rsvp:'belum', pax: m[2] ? +m[2] : 1, table:'', note:'' }); });
  persist('guests'); closeModal(); toast(`${Math.min(lines.length, 1000)} tamu ditambahkan`); render();
}
function inspoForm(x){
  const d = x || { title:'', kind: ui.inspoKind !== 'all' ? ui.inspoKind : 'Dekorasi', url:'', note:'' };
  openModal(x ? 'Ubah inspirasi' : 'Simpan inspirasi', formShell('inspo', `data-id="${x ? x.id : ''}"`,
    `${textIn('title', 'Judul', d.title, 'maxlength="80" placeholder="Contoh: Dekorasi rustic putih-hijau"')}${selectIn('kind', 'Kategori', INSPO_KINDS.map(k => [k, k]), d.kind)}
     ${textIn('url', 'Tautan atau URL gambar (opsional)', d.url, 'type="url" maxlength="500" placeholder="https://…"')}${areaIn('note', 'Catatan', d.note, 'maxlength="500"')}`, 'Simpan', x ? delBtn('del-inspo', x.id) : ''));
}
function submitInspo(f){
  const id = f.dataset.id, v = { title: fv(f, 'title'), kind: fv(f, 'kind'), url: fv(f, 'url'), note: fv(f, 'note') };
  if (!v.title) return formErr(f, 'Isi judul.');
  if (v.url && !/^https?:\/\//i.test(v.url)) return formErr(f, 'Tautan harus diawali https://');
  if (id) Object.assign(S.inspo.find(x => x.id === id), v); else S.inspo.push(Object.assign({ id: uid('insp') }, v));
  persist('inspo'); closeModal(); render();
}
const CHECKLIST_TEMPLATE = [
  [12, 'Tentukan tanggal dan konsep pernikahan', 'tinggi'], [12, 'Susun anggaran dan sumber dana', 'tinggi'], [11, 'Buat daftar tamu awal', 'sedang'],
  [10, 'Survei dan pesan venue', 'tinggi'], [9, 'Pilih katering dan jadwalkan food testing', 'tinggi'], [8, 'Pilih fotografer dan videografer', 'sedang'],
  [7, 'Pilih dekorasi', 'sedang'], [6, 'Pesan busana pengantin dan keluarga', 'sedang'], [6, 'Pilih penata rias', 'sedang'],
  [5, 'Pesan undangan dan souvenir', 'sedang'], [4, 'Siapkan hiburan atau MC', 'rendah'], [3, 'Urus dokumen pernikahan (KUA/catatan sipil)', 'tinggi'],
  [3, 'Fitting busana pertama', 'sedang'], [2, 'Sebar undangan', 'tinggi'], [1, 'Konfirmasi RSVP dan jumlah porsi katering', 'tinggi'],
  [1, 'Final meeting dengan semua vendor', 'tinggi'], [0.5, 'Pelunasan vendor sesuai kontrak', 'tinggi'], [0.25, 'Gladi bersih', 'sedang']
];
function seedChecklist(){
  const w = weddingInfo(); if (!w || !w.date) return toast('Isi tanggal pernikahan dulu');
  const t = todayISO(); let n = 0;
  CHECKLIST_TEMPLATE.forEach(([m, title, pr]) => {
    if (S.tasks.some(k => k.wedding && k.title === title)) return;
    let due = m >= 1 ? addMonths(w.date, -Math.round(m)) : addDays(w.date, -Math.round(m * 30));
    if (due < t) due = t;
    S.tasks.push({ id: uid('task'), title, priority: pr, due, status:'todo', projectId:null, assignee:'', note:'', wedding:true, createdAt: Date.now() }); n++;
  });
  persist('tasks'); toast(`${n} item checklist dibuat`); render();
}

/* ---------- Travel ---------- */
function tripForm(tr){
  const x = tr || { name:'', destination:'', start:'', end:'', budget:0, status:'rencana', note:'' };
  openModal(tr ? 'Ubah perjalanan' : 'Tambah perjalanan', formShell('trip', `data-id="${tr ? tr.id : ''}"`,
    `${textIn('name', 'Nama perjalanan', x.name, 'maxlength="80" placeholder="Contoh: Liburan Lombok"')}
     <div class="f2">${textIn('destination', 'Destinasi', x.destination, 'maxlength="80"')}${selectIn('status', 'Status', Object.entries(TRIP_STATUS), x.status)}</div>
     <div class="f2">${dateIn('start', 'Berangkat', x.start)}${dateIn('end', 'Pulang', x.end)}</div>
     ${moneyIn('budget', x.budget, 'Anggaran perjalanan')}${areaIn('note', 'Catatan', x.note, 'maxlength="500"')}`, 'Simpan', tr ? delBtn('del-trip', tr.id) : ''));
}
function submitTrip(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), destination: fv(f, 'destination'), status: fv(f, 'status'), start: fv(f, 'start') || null, end: fv(f, 'end') || null, budget: fm(f, 'budget'), note: fv(f, 'note') };
  if (!v.name) return formErr(f, 'Isi nama perjalanan.');
  if (v.start && !v.end) v.end = v.start;
  if (v.start && v.end < v.start) return formErr(f, 'Tanggal pulang harus setelah tanggal berangkat.');
  if (v.start && diffDays(v.start, v.end) > 59) return formErr(f, 'Perjalanan maksimal 60 hari.');
  if (id) Object.assign(S.trips.find(x => x.id === id), v);
  else { const nid = uid('trip'); S.trips.push(Object.assign({ id: nid, createdAt: Date.now() }, v)); ui.tripId = nid; ui.tripTab = 'itinerary'; ensureCat('Perjalanan'); logAct(`Menambah perjalanan ${v.name}`); }
  persist('trips'); closeModal(); render();
}
function itinForm(x, tripId, date){
  const tr = trip(x ? x.tripId : tripId), d = x || { tripId, date: date || (tr && tr.start) || todayISO(), time:'', title:'', place:'', note:'' };
  openModal(x ? 'Ubah kegiatan' : 'Tambah kegiatan', formShell('itin', `data-id="${x ? x.id : ''}" data-trip="${d.tripId}"`,
    `${textIn('title', 'Kegiatan', d.title, 'maxlength="100" placeholder="Contoh: Snorkeling di Gili Nanggu"')}
     <div class="f2">${dateIn('date', 'Tanggal', d.date, tr && tr.start ? `min="${tr.start}" max="${tr.end}"` : '')}<label class="f"><span>Jam</span><input type="time" name="time" id="t-itime" value="${esc(d.time || '')}"></label></div>
     ${textIn('place', 'Tempat', d.place, 'maxlength="100"')}${areaIn('note', 'Catatan', d.note, 'maxlength="400"')}`, 'Simpan', x ? delBtn('del-itin', x.id) : ''));
}
function submitItin(f){
  const id = f.dataset.id, v = { tripId: f.dataset.trip, title: fv(f, 'title'), date: fv(f, 'date'), time: fv(f, 'time'), place: fv(f, 'place'), note: fv(f, 'note') };
  if (!v.title) return formErr(f, 'Isi nama kegiatan.');
  if (!v.date) return formErr(f, 'Isi tanggal.');
  if (id) Object.assign(S.itin.find(x => x.id === id), v); else S.itin.push(Object.assign({ id: uid('it') }, v));
  persist('itin'); closeModal(); render();
}
function bookingForm(x, tripId){
  const d = x || { tripId, kind:'Penerbangan', title:'', date:'', time:'', ref:'', cost:0, note:'' };
  openModal(x ? 'Ubah booking' : 'Tambah booking', formShell('booking', `data-id="${x ? x.id : ''}" data-trip="${d.tripId}"`,
    `<div class="f2">${selectIn('kind', 'Jenis', BOOK_KINDS.map(k => [k, k]), d.kind)}${textIn('ref', 'Kode booking', d.ref, 'maxlength="30"')}</div>
     ${textIn('title', 'Detail', d.title, 'maxlength="100" placeholder="Contoh: CGK → LOP, Garuda GA 432"')}
     <div class="f2">${dateIn('date', 'Tanggal', d.date)}<label class="f"><span>Jam</span><input type="time" name="time" id="t-btime" value="${esc(d.time || '')}"></label></div>
     ${moneyIn('cost', d.cost, 'Biaya', 'Untuk mencatatnya sebagai pengeluaran, gunakan tombol "Catat bayar" setelah disimpan.')}${areaIn('note', 'Catatan', d.note, 'maxlength="400"')}`, 'Simpan', x ? delBtn('del-booking', x.id) : ''));
}
function submitBooking(f){
  const id = f.dataset.id, v = { tripId: f.dataset.trip, kind: fv(f, 'kind'), title: fv(f, 'title'), date: fv(f, 'date') || null, time: fv(f, 'time'), ref: fv(f, 'ref'), cost: fm(f, 'cost'), note: fv(f, 'note') };
  if (!v.title) return formErr(f, 'Isi detail booking.');
  if (id) Object.assign(S.bookings.find(x => x.id === id), v); else S.bookings.push(Object.assign({ id: uid('bk'), txnId:null }, v));
  persist('bookings'); closeModal(); render();
}
const PACK_TEMPLATE = ['KTP / paspor','Tiket dan bukti booking','Dompet dan kartu','Charger dan power bank','Obat pribadi','Pakaian','Pakaian dalam','Perlengkapan mandi','Sunscreen','Payung atau jas hujan','Sandal','Adaptor colokan'];

/* ---------- Growth ---------- */
function lgoalForm(g){
  const x = g || { title:'', category: GOAL_CATS[0], indicator:'', due:'', status:'aktif', savingsGoalId:'', note:'' };
  const sgOpts = [['', 'Tidak ditautkan']].concat(S.goals.map(s => [s.id, s.name]));
  openModal(g ? 'Ubah tujuan' : 'Tambah tujuan', formShell('lgoal', `data-id="${g ? g.id : ''}"`,
    `${textIn('title', 'Tujuan', x.title, 'maxlength="120" placeholder="Contoh: Lulus S1 Sistem Informasi"')}
     <div class="f2">${selectIn('category', 'Kategori', GOAL_CATS.map(c => [c, c]), x.category)}${selectIn('status', 'Status', Object.entries(GOAL_STATUS), x.status)}</div>
     ${textIn('indicator', 'Indikator keberhasilan', x.indicator, 'maxlength="160" placeholder="Bagaimana Anda tahu tujuan ini tercapai?"')}
     <div class="f2">${dateIn('due', 'Target tanggal', x.due)}${modOn('finance') && S.goals.length ? selectIn('savingsGoalId', 'Tautkan ke target tabungan', sgOpts, x.savingsGoalId) : ''}</div>
     <p class="note">Progres dihitung dari milestone yang selesai, atau dari target tabungan jika ditautkan.</p>`, 'Simpan', g ? delBtn('del-lgoal', g.id) : ''));
}
function submitLgoal(f){
  const id = f.dataset.id, v = { title: fv(f, 'title'), category: fv(f, 'category'), status: fv(f, 'status'), indicator: fv(f, 'indicator'), due: fv(f, 'due') || null, savingsGoalId: fv(f, 'savingsGoalId') || null };
  if (!v.title) return formErr(f, 'Isi tujuan.');
  if (id) Object.assign(S.lifegoals.find(x => x.id === id), v); else S.lifegoals.push(Object.assign({ id: uid('lg'), milestones:[], updates:[], createdAt: Date.now() }, v));
  persist('lifegoals'); closeModal(); render();
}
function habitForm(h){
  const x = h || { name:'', freq:'daily', target:3, archived:false };
  openModal(h ? 'Ubah kebiasaan' : 'Tambah kebiasaan', formShell('habit', `data-id="${h ? h.id : ''}"`,
    `${textIn('name', 'Kebiasaan', x.name, 'maxlength="80" placeholder="Contoh: Jalan kaki 20 menit"')}
     <div class="f2">${selectIn('freq', 'Frekuensi', [['daily','Setiap hari'],['weekly','Beberapa kali per minggu']], x.freq)}${textIn('target', 'Target per minggu', x.target, 'inputmode="numeric" maxlength="1" data-hg="weekly"')}</div>
     ${h ? `<label class="check"><input type="checkbox" name="archived" id="t-arch" ${x.archived ? 'checked' : ''}>Arsipkan (riwayat tetap tersimpan)</label>` : ''}`, 'Simpan', h ? delBtn('del-habit', h.id) : ''));
}
function submitHabit(f){
  const id = f.dataset.id, v = { name: fv(f, 'name'), freq: fv(f, 'freq'), target: Math.min(7, Math.max(1, parseInt(fv(f, 'target'), 10) || 1)) };
  if (f.elements.archived) v.archived = fchk(f, 'archived');
  if (!v.name) return formErr(f, 'Isi nama kebiasaan.');
  if (id) Object.assign(S.habits.find(x => x.id === id), v); else S.habits.push(Object.assign({ id: uid('hb'), logs:{}, createdAt: Date.now(), archived:false }, v));
  persist('habits'); closeModal(); render();
}
const J_PROMPTS = {
  refleksi: 'Apa yang berjalan baik bulan ini?\n\n\nApa yang kurang berjalan baik, dan apa penyebabnya?\n\n\nBagaimana kondisi keuangan bulan ini dibanding rencana?\n\n\nApa yang ingin saya ubah atau fokuskan bulan depan?\n',
  tahunan: 'Pencapaian terbesar tahun ini:\n\n\nPelajaran terpenting:\n\n\nTujuan yang tercapai dan yang belum:\n\n\nTiga fokus utama tahun depan:\n'
};
function journalForm(j, type){
  const t = type || 'harian';
  const x = j || { date: todayISO(), type: t, title: t === 'refleksi' ? 'Refleksi ' + ymLabel(curYM()) : t === 'tahunan' ? 'Tinjauan tahun ' + todayISO().slice(0,4) : '', body: J_PROMPTS[t] || '', mood:0, tags:'' };
  openModal(j ? 'Catatan jurnal' : 'Tulis catatan', formShell('journal', `data-id="${j ? j.id : ''}"`,
    `<div class="f2">${dateIn('date', 'Tanggal', x.date)}${selectIn('type', 'Jenis', Object.entries(J_TYPES), x.type)}</div>
     ${textIn('title', 'Judul (opsional)', x.title, 'maxlength="120"')}
     <div class="f"><span>Suasana hati (opsional)</span><div class="mood">${MOODS.map((m, i) => `<label><input type="radio" name="mood" value="${i + 1}" ${+x.mood === i + 1 ? 'checked' : ''}>${m}</label>`).join('')}</div></div>
     ${areaIn('body', 'Isi', x.body, 'class="big" maxlength="20000"')}
     ${textIn('tags', 'Tag (pisahkan dengan koma)', x.tags, 'maxlength="120" placeholder="kerja, keluarga, skripsi"')}`, 'Simpan', j ? delBtn('del-journal', j.id) : ''), { wide:true });
}
function submitJournal(f){
  const id = f.dataset.id, mood = (f.querySelector('input[name=mood]:checked') || {}).value;
  const v = { date: fv(f, 'date'), type: fv(f, 'type'), title: fv(f, 'title'), body: f.elements.body.value, mood: mood ? +mood : 0, tags: fv(f, 'tags') };
  if (!v.date) return formErr(f, 'Isi tanggal.');
  if (!v.body.trim() && !v.title) return formErr(f, 'Tulis isi catatan.');
  if (id) Object.assign(S.journal.find(x => x.id === id), v, { updatedAt: Date.now() }); else S.journal.push(Object.assign({ id: uid('jr'), createdAt: Date.now() }, v));
  persist('journal'); closeModal(); toast('Catatan disimpan'); render();
}

/* ---------- Workspace ---------- */
function wsNameForm(rename){
  openModal(rename ? 'Ganti nama workspace' : 'Buat workspace bersama', formShell('wsname', `data-rename="${rename ? 1 : ''}"`,
    `${textIn('name', 'Nama workspace', rename ? WS().name : '', 'maxlength="40" placeholder="Contoh: Keluarga Kecil, Persiapan Nikah"')}
     ${rename ? '' : '<p class="note">Anda menjadi pemilik. Setelah dibuat, undang pasangan atau keluarga dari halaman Workspace & Anggota.</p>'}`, rename ? 'Simpan' : 'Buat workspace'));
}
async function submitWsName(f){
  const name = fv(f, 'name'); if (!name) return formErr(f, 'Isi nama workspace.');
  $('button[type=submit]', f).disabled = true;
  try {
    if (f.dataset.rename) { await backend.renameWs(name); toast('Nama workspace diperbarui'); }
    else { const id = await backend.createWorkspace(name); toast('Workspace dibuat'); closeModal(); setTimeout(() => backend.switchTo(id), 400); location.hash = '#workspace'; return; }
  } catch(e) { $('button[type=submit]', f).disabled = false; return formErr(f, 'Gagal: ' + (e.code || e.message)); }
  closeModal(); render();
}
async function submitInvite(f){
  const email = fv(f, 'email').toLowerCase(), role = fv(f, 'role');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Isi alamat email yang valid', 'neg');
  if (email === backend.user.email) return toast('Itu email Anda sendiri', 'neg');
  if (Object.values(WS().memberInfo || {}).some(m => (m.email || '').toLowerCase() === email)) return toast('Orang ini sudah menjadi anggota', 'neg');
  try { await backend.invite(email, role); logAct(`Mengundang ${email} sebagai ${ROLE[role]}`); toast('Undangan dibuat. Minta ' + email + ' membuka Infina dan masuk dengan akun Google tersebut.'); f.reset(); }
  catch(e) { toast('Gagal mengundang: ' + (e.code || e.message), 'neg'); }
}

const FORMS = { tx:submitTx, settle:submitSettle, account:submitAccount, adjust:submitAdjust, budget:submitBudget, rec:submitRec, debt:submitDebt, goal:submitGoal,
  task:submitTask, event:submitEvent, cat:submitCat, wedding:submitWedding, wbudget:submitWbudget, vendor:submitVendor, wpay:submitWpay, guest:submitGuest,
  bulkguest:submitBulkGuest, inspo:submitInspo, trip:submitTrip, itin:submitItin, booking:submitBooking, lgoal:submitLgoal, habit:submitHabit, journal:submitJournal,
  wsname:submitWsName, invite:submitInvite,
  project: f => { const name = fv(f, 'name'); if (!name) return formErr(f, 'Isi nama proyek.'); const p = { id: uid('proj'), name }; S.projects.push(p); persist('projects'); ui.taskProject = p.id; closeModal(); render(); },
  ms: f => { const g = S.lifegoals.find(x => x.id === f.dataset.goal), title = fv(f, 'title'); if (!g || !title) return; g.milestones = (g.milestones || []).concat([{ id: uid('ms'), title, done:false }]); persist('lifegoals'); render(); },
  gupdate: f => { const g = S.lifegoals.find(x => x.id === f.dataset.goal), text = fv(f, 'text'); if (!text) return formErr(f, 'Tulis perkembangannya.'); g.updates = (g.updates || []).concat([{ at: Date.now(), text }]).slice(-50); persist('lifegoals'); closeModal(); render(); },
  pack: f => { const items = fv(f, 'item').split(',').map(s => s.trim()).filter(Boolean); if (!items.length) return; items.forEach(item => S.packing.push({ id: uid('pk'), tripId: f.dataset.trip, item, done:false })); persist('packing'); render(); setTimeout(() => { const el = $('#pack-item'); if (el) el.focus(); }, 0); },
  noop: () => {} };
/* =====================================================================
   Actions, sample data, import/export, event wiring, boot
   ===================================================================== */
function onWsReady(definitive){
  if (definitive && canWrite() && !S.categories.length) {
    S.categories = DEFAULT_EXP.map((n, i) => ({ id: uid('cat'), name:n, kind:'expense', ord:i })).concat(DEFAULT_INC.map((n, i) => ({ id: uid('cat'), name:n, kind:'income', ord:i })));
    persist('categories');
  }
  if (definitive) runRecurring();
}

/* ---------- export / import ---------- */
function csvOf(list){
  const q = s => { s = String(s ?? ''); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const head = ['Tanggal','Jenis','Deskripsi','Kategori','Rekening','Rekening tujuan','Dibayar oleh','Nominal','Mata uang','Status','Catatan'];
  const rows = sortTx(list).map(t => [t.date, TX_TYPES[t.type] + (t.type === 'adjustment' ? (t.dir < 0 ? ' (−)' : ' (+)') : ''), t.desc,
    (t.type === 'expense' || t.type === 'income') ? catName(t.categoryId) : '', t.type === 'settlement' ? '' : accName(t.accountId), t.type === 'transfer' ? accName(t.toAccountId) : t.type === 'settlement' ? memberFull(t.toMember) : '',
    t.paidBy ? memberFull(t.paidBy) : '', Math.round(t.amount), t.currency || 'IDR', t.status === 'void' ? 'Dibatalkan' : 'Tercatat', t.note]);
  return '﻿' + [head].concat(rows).map(r => r.map(q).join(';')).join('\r\n');
}
function offerFile(filename, text, type){
  try { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
  catch(e) { toast('Unduhan gagal: ' + e.message, 'neg'); }
}
function exportJSON(){
  const out = { aplikasi:'Infina', versi:2, diekspor: new Date().toISOString(), workspace: WS() ? WS().name : '' };
  KINDS.filter(k => k !== 'activity').forEach(k => out[k] = S[k]);
  offerFile(`infina-${(WS() ? WS().name : 'data').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${todayISO()}.json`, JSON.stringify(out, null, 2), 'application/json');
}
function importData(obj){
  let data = obj;
  if (obj && obj.aplikasi === 'LIFEHUB' && Array.isArray(obj.transaksi)) { data = Object.assign({}, obj, { txns: obj.transaksi }); }
  else if (!obj || obj.aplikasi !== 'Infina') { toast('File ini bukan cadangan Infina yang valid', 'neg'); return; }
  const nTx = (data.txns || []).length, nAcc = (data.accounts || []).length;
  confirmBox('Pulihkan dari cadangan?', `File berisi <b>${nAcc} rekening</b> dan <b>${nTx} transaksi</b>${data.diekspor ? ' (diekspor ' + esc(fmtStamp(data.diekspor)) + ')' : ''}. Semua data di workspace <b>${esc(WS().name)}</b> akan <b>diganti</b> dengan isi file ini.`, 'Ganti dengan cadangan', () => {
    KINDS.forEach(k => { if (k === 'activity') return; const arr = Array.isArray(data[k]) ? data[k] : []; S[k] = arr.filter(x => x && typeof x === 'object' && x.id && !/[\/]/.test(x.id)); });
    S.txns = S.txns.filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t.date || '')).map(t => Object.assign({ status:'posted', currency:'IDR', history:[] }, t));
    KINDS.forEach(persist); onWsReady(true); logAct('Memulihkan data dari file cadangan');
    toast('Data dipulihkan dari cadangan'); location.hash = '#dashboard'; render();
  }, false);
}

/* ---------- sample data ---------- */
function loadSample(){
  const T = todayISO(), cid = n => (catByName(n) || catByName(n, 'income') || {}).id, mk = p => uid(p);
  const a = { bca: mk('acc'), cash: mk('acc'), gopay: mk('acc'), cc: mk('acc'), sav: mk('acc') };
  S.accounts.push(
    { id:a.bca, name:'Bank Gaji (contoh)', type:'bank', opening:6500000, currency:'IDR', active:true, sample:true },
    { id:a.cash, name:'Dompet (contoh)', type:'cash', opening:400000, currency:'IDR', active:true, sample:true },
    { id:a.gopay, name:'E-wallet (contoh)', type:'ewallet', opening:150000, currency:'IDR', active:true, sample:true },
    { id:a.cc, name:'Kartu Kredit (contoh)', type:'credit_card', opening:0, limit:10000000, dueDay:17, currency:'IDR', active:true, sample:true },
    { id:a.sav, name:'Tabungan Darurat (contoh)', type:'bank', opening:7500000, currency:'IDR', active:true, sample:true });
  const prev = ymShift(curYM(), -1), cur = curYM(), day = n => { const d = `${cur}-${pad(n)}`; return d <= T ? d : null; };
  [[`${prev}-25`, 'income', 9500000, a.bca, null, 'Gaji', 'Gaji bulanan'], [`${prev}-26`, 'transfer', 1500000, a.bca, a.sav, null, 'Setor dana darurat'],
   [`${prev}-27`, 'expense', 650000, a.bca, null, 'Belanja', 'Belanja bulanan'], [`${prev}-28`, 'expense', 1200000, a.cc, null, 'Belanja', 'Sepatu kerja'],
   [`${prev}-28`, 'expense', 85000, a.gopay, null, 'Transportasi', 'Ojek ke kantor'], [day(1), 'expense', 120000, a.cash, null, 'Makanan & Minuman', 'Makan siang tim'],
   [day(2), 'transfer', 300000, a.bca, a.gopay, null, 'Isi saldo e-wallet'], [day(3), 'expense', 230000, a.gopay, null, 'Transportasi', 'Ojek dan KRL'],
   [day(4), 'expense', 540000, a.bca, null, 'Makanan & Minuman', 'Belanja dapur'], [day(6), 'expense', 175000, a.gopay, null, 'Hiburan', 'Nonton bioskop'],
   [day(8), 'expense', 410000, a.cc, null, 'Makanan & Minuman', 'Makan malam keluarga'], [day(9), 'transfer', 1200000, a.bca, a.cc, null, 'Bayar tagihan kartu kredit'],
   [day(10), 'expense', 95000, a.cash, null, 'Kesehatan', 'Vitamin'], [day(11), 'expense', 760000, a.bca, null, 'Makanan & Minuman', 'Belanja bulanan']
  ].filter(r => r[0]).forEach(([date, type, amount, from, to, catN, desc]) => S.txns.push(mkTx({ date, type, amount, accountId:from, toAccountId:to, categoryId: catN ? cid(catN) : null, desc, sample:true, paidBy: isShared() && type === 'expense' ? me() : null })));
  const debt = { id: mk('debt'), name:'Cicilan laptop (contoh)', kind:'cicilan', lender:'Toko elektronik', installment:650000, count:12, firstDue: addMonths(`${cur}-10`, -2), note:'', archived:false, sample:true };
  S.debts.push(debt);
  [0, 1].forEach(k => S.txns.push(mkTx({ date: addMonths(debt.firstDue, k), type:'expense', amount:650000, accountId:a.bca, categoryId: cid('Cicilan & Utang'), desc:`Cicilan laptop ke-${k + 1}`, debtId: debt.id, sample:true })));
  [['Makanan & Minuman', 2000000], ['Transportasi', 800000], ['Hiburan', 200000], ['Belanja', 1000000]].forEach(([n, l]) => S.budgets.push({ id: mk('bud'), month: cur, categoryId: cid(n), limit:l, sample:true }));
  S.recurring.push({ id: mk('rec'), type:'expense', desc:'Internet rumah (contoh)', amount:350000, freq:'monthly', accountId:a.bca, categoryId: cid('Tagihan'), start: addMonths(`${cur}-05`, -1), end:null, paused:false, sample:true });
  const sg = { id: mk('goal'), name:'Dana darurat (contoh)', target:30000000, deadline: addMonths(T, 12), accountId:a.sav, sample:true }; S.goals.push(sg);
  const proj = { id: mk('proj'), name:'Pindahan rumah (contoh)', sample:true }; S.projects.push(proj);
  S.tasks.push(
    { id: mk('task'), title:'Bayar iuran lingkungan', priority:'tinggi', due: addDays(T, 1), status:'todo', note:'', sample:true },
    { id: mk('task'), title:'Bandingkan harga jasa angkut', priority:'sedang', due: addDays(T, 4), status:'doing', projectId: proj.id, note:'', sample:true },
    { id: mk('task'), title:'Kemas buku dan dokumen', priority:'rendah', due: addDays(T, 9), status:'todo', projectId: proj.id, note:'', sample:true },
    { id: mk('task'), title:'Perpanjang SIM', priority:'sedang', due: addDays(T, -1), status:'todo', note:'', sample:true });
  S.events.push({ id: mk('ev'), title:'Arisan keluarga', date: addDays(T, 3), time:'16:00', repeat:'monthly', note:'', sample:true }, { id: mk('ev'), title:'Kontrol gigi', date: addDays(T, 6), time:'10:30', repeat:'none', note:'', sample:true });
  // wedding
  if (!weddingInfo()) {
    S.wedding.push({ id:'wedding', title:'Pernikahan (contoh)', date: addMonths(T, 8), venue:'Gedung serbaguna', note:'', sample:true });
    WED_CATS.forEach((c, i) => S.wbudget.push({ id: mk('wb'), category:c, estimate: Math.round(150000000 * WED_SPLIT[c] / 100 / 1000) * 1000, ord:i, sample:true }));
    const v1 = { id: mk('ven'), name:'Katering Sari Rasa (contoh)', category:'Katering', status:'dipilih', contact:'WA 08xx', pkg:'500 porsi', quote:55000000, contract:52000000, note:'Gratis food testing untuk 4 orang', sample:true };
    const v2 = { id: mk('ven'), name:'Katering Nusantara (contoh)', category:'Katering', status:'ditolak', contact:'', pkg:'500 porsi', quote:58000000, contract:0, note:'', sample:true };
    const v3 = { id: mk('ven'), name:'Studio Foto Lensa (contoh)', category:'Dokumentasi', status:'negosiasi', contact:'@lensa', pkg:'Foto + video', quote:12500000, contract:0, note:'Minta potongan 10%', sample:true };
    S.vendors.push(v1, v2, v3);
    const dp = { id: mk('wp'), vendorId:v1.id, label:'DP', due: addDays(T, -10), amount:15600000, txnId:null, sample:true };
    const tx = mkTx({ date: addDays(T, -10), type:'expense', amount:15600000, accountId:a.bca, categoryId: cid('Pernikahan'), desc:'DP katering', vendorId:v1.id, schedId:dp.id, sample:true });
    dp.txnId = tx.id; S.txns.push(tx);
    S.wpays.push(dp, { id: mk('wp'), vendorId:v1.id, label:'Termin 2', due: addDays(T, 5), amount:18200000, txnId:null, sample:true }, { id: mk('wp'), vendorId:v1.id, label:'Pelunasan', due: addMonths(T, 7), amount:18200000, txnId:null, sample:true });
    [['Keluarga Bapak Budi', 'Keluarga', 4, 'hadir', true], ['Rina & suami', 'Teman kuliah', 2, 'mungkin', true], ['Tim Audit', 'Kantor', 6, 'belum', false], ['Om Hendra', 'Keluarga', 2, 'tidak', true]]
      .forEach(([name, group, pax, rsvp, invited]) => S.guests.push({ id: mk('gst'), name, group, pax, rsvp, invited, phone:'', table:'', note:'', sample:true }));
    S.inspo.push({ id: mk('insp'), title:'Dekorasi putih-hijau (contoh)', kind:'Dekorasi', url:'', note:'Banyak daun eucalyptus, lampu gantung', sample:true });
    S.tasks.push({ id: mk('task'), title:'Food testing katering', priority:'sedang', due: addDays(T, 12), status:'todo', wedding:true, note:'', sample:true }, { id: mk('task'), title:'Survei venue', priority:'tinggi', due: addDays(T, -20), status:'done', doneAt: Date.now(), wedding:true, note:'', sample:true });
  }
  // travel
  const trp = { id: mk('trip'), name:'Liburan Lombok (contoh)', destination:'Lombok', status:'rencana', start: addDays(T, 20), end: addDays(T, 23), budget:8000000, note:'', sample:true, createdAt: Date.now() };
  S.trips.push(trp, { id: mk('trip'), name:'Jepang musim gugur (contoh)', destination:'Kyoto', status:'impian', start:null, end:null, budget:35000000, note:'', sample:true });
  S.itin.push({ id: mk('it'), tripId:trp.id, date:trp.start, time:'09:00', title:'Penerbangan ke Lombok', place:'Bandara', note:'', sample:true }, { id: mk('it'), tripId:trp.id, date: addDays(trp.start, 1), time:'08:00', title:'Snorkeling Gili', place:'Gili Nanggu', note:'Bawa sunscreen', sample:true });
  const bk = { id: mk('bk'), tripId:trp.id, kind:'Penerbangan', title:'Pulang-pergi Jakarta–Lombok', date:trp.start, time:'07:30', ref:'ABC123', cost:2400000, note:'', sample:true };
  const btx = mkTx({ date: addDays(T, -3), type:'expense', amount:2400000, accountId:a.cc, categoryId: cid('Perjalanan'), desc:'Tiket pesawat Lombok', tripId:trp.id, sample:true }); bk.txnId = btx.id; S.txns.push(btx); S.bookings.push(bk);
  PACK_TEMPLATE.slice(0, 6).forEach((item, i) => S.packing.push({ id: mk('pk'), tripId:trp.id, item, done: i < 2, sample:true }));
  // growth
  S.lifegoals.push({ id: mk('lg'), title:'Lulus S1 tepat waktu', category:'Pendidikan', status:'aktif', indicator:'Sidang skripsi lulus', due: addMonths(T, 6), savingsGoalId:null, sample:true,
    milestones:[{ id: mk('ms'), title:'Proposal disetujui', done:true }, { id: mk('ms'), title:'Bab 1–3 selesai', done:true }, { id: mk('ms'), title:'Bab 4–5 selesai', done:false }, { id: mk('ms'), title:'Sidang', done:false }], updates:[], createdAt: Date.now() },
    { id: mk('lg'), title:'Dana darurat 6 bulan pengeluaran', category:'Keuangan', status:'aktif', indicator:'Saldo tabungan darurat Rp30 juta', due: sg.deadline, savingsGoalId: sg.id, milestones:[], updates:[], sample:true, createdAt: Date.now() });
  const logs = {}; for (let i = 1; i < 20; i++) if (i % 4 !== 0) logs[addDays(T, -i)] = 1;
  const logs2 = {}; for (let i = 0; i < 28; i += 2) logs2[addDays(T, -i - 1)] = 1;
  S.habits.push({ id: mk('hb'), name:'Catat pengeluaran harian', freq:'daily', target:7, logs, archived:false, sample:true }, { id: mk('hb'), name:'Olahraga 30 menit', freq:'weekly', target:3, logs:logs2, archived:false, sample:true });
  S.journal.push({ id: mk('jr'), date: addDays(T, -1), type:'harian', title:'Hari yang padat', body:'Selesai merapikan working paper dan lanjut revisi bab 4. Besok fokus olah data.', mood:4, tags:'kerja, skripsi', sample:true, createdAt: Date.now() });
  KINDS.forEach(persist); runRecurring(); toast('Data contoh dimuat'); render();
}
function clearSample(){
  KINDS.forEach(k => { const before = S[k].length; S[k] = S[k].filter(x => !x.sample); if (S[k].length !== before) persist(k); });
  toast('Data contoh dihapus'); render();
}
async function wipeAll(){
  try { await backend.wipe(); } catch(e) { toast('Gagal menghapus: ' + (e.code || e.message), 'neg'); return; }
  KINDS.forEach(k => { S[k] = []; synced[k] = new Map(); });
  onWsReady(true); toast('Semua data workspace ini dihapus'); location.hash = '#dashboard'; render();
}

/* ---------- global search ---------- */
function searchResults(q){
  q = q.trim().toLowerCase(); if (q.length < 2) return [];
  const out = [], has = s => String(s || '').toLowerCase().includes(q);
  sortTx(S.txns).forEach(t => { if (has(t.desc) || has(t.note)) out.push({ act:'edit-txn', id:t.id, l:t.desc || TX_TYPES[t.type], r:`${fmtDate(t.date)} · ${amtText(t)}` }); });
  S.tasks.forEach(k => { if (has(k.title) || has(k.note)) out.push({ act:'edit-task', id:k.id, l:k.title, r:k.wedding ? 'Checklist wedding' : 'Tugas' }); });
  S.events.forEach(e => { if (has(e.title)) out.push({ act:'edit-event', id:e.id, l:e.title, r:'Acara · ' + fmtDate(e.date) }); });
  S.accounts.forEach(a => { if (has(a.name)) out.push({ act:'edit-account', id:a.id, l:a.name, r:'Rekening' }); });
  S.vendors.forEach(v => { if (has(v.name)) out.push({ act:'edit-vendor', id:v.id, l:v.name, r:'Vendor · ' + v.category }); });
  S.guests.forEach(g => { if (has(g.name) || has(g.phone)) out.push({ act:'edit-guest', id:g.id, l:g.name, r:'Tamu · ' + (RSVP[g.rsvp] || '') }); });
  S.trips.forEach(t => { if (has(t.name) || has(t.destination)) out.push({ act:'open-trip', id:t.id, l:t.name, r:'Perjalanan' }); });
  S.lifegoals.forEach(g => { if (has(g.title)) out.push({ act:'edit-lgoal', id:g.id, l:g.title, r:'Tujuan' }); });
  S.journal.forEach(j => { if (has(j.title) || has(j.body) || has(j.tags)) out.push({ act:'open-journal', id:j.id, l:j.title || fmtDateLong(j.date), r:'Jurnal' }); });
  return out.slice(0, 25);
}

/* ---------- actions ---------- */
const findIn = (k, id) => S[k].find(x => x.id === id);
const READ_ACTS = new Set(['open-menu','close-menu','close-modal','confirm-yes','toggle-notif','notif-read-all','notif-open','search-pick','tx-page','tx-all-months','export-csv','export-all-csv','export-json',
  'acc-tx','bud-month','task-view','cal-month','cal-today','w-tab','open-trip','close-trip','trip-tab','sign-in','sign-out','switch-ws','accept-invite','decline-invite','leave-ws','new-ws','edit-txn','open-journal']);
const delConfirm = (title, text, kind, id, after) => confirmBox(title, text, 'Hapus', () => { S[kind] = S[kind].filter(x => x.id !== id); persist(kind); if (after) after(); render(); });
const A = {
  'open-menu': () => { $('#side').classList.add('open'); $('#scrim').classList.add('show'); },
  'close-menu': closeMenu,
  'close-modal': closeModal,
  'confirm-yes': () => { const fn = onConfirm; closeModal(); if (fn) fn(); },
  'sign-in': () => backend.signIn(),
  'sign-out': () => confirmBox('Keluar dari Infina?', 'Anda bisa masuk lagi kapan saja dengan akun Google yang sama. Data tetap tersimpan di cloud.', 'Keluar', () => backend.signOut(), false),
  'quick-add': () => { if (!canWrite()) return toast('Anda hanya bisa melihat di workspace ini', 'neg'); openModal('Tambah cepat', `<div class="mb"><div class="qa-list">
      ${modOn('finance') ? `<button data-act="new-txn" data-type="expense"><b>Pengeluaran</b><span>Catat uang keluar</span></button><button data-act="new-txn" data-type="income"><b>Pemasukan</b><span>Gaji, bonus, dll.</span></button><button data-act="new-txn" data-type="transfer"><b>Transfer</b><span>Antarrekening</span></button>` : ''}
      ${modOn('planner') ? '<button data-act="new-task"><b>Tugas</b><span>Dengan tenggat</span></button><button data-act="new-event"><b>Acara</b><span>Masuk kalender</span></button>' : ''}
      ${modOn('growth') ? '<button data-act="new-journal"><b>Jurnal</b><span>Catatan hari ini</span></button>' : ''}
      ${modOn('wedding') && weddingInfo() ? '<button data-act="new-guest"><b>Tamu</b><span>Daftar undangan</span></button>' : ''}
    </div></div>`); },
  'new-txn': d => { if (!S.accounts.length && !isShared()) { closeModal(); toast('Tambahkan rekening terlebih dahulu'); location.hash = '#rekening'; return; }
    txForm(null, { type:d.type, to:d.to, amount:d.amount, tripId:d.trip, split: d.split === '1', categoryId: d.trip ? (catByName('Perjalanan') || {}).id : undefined }); },
  'edit-txn': d => { const t = S.txns.find(x => x.id === d.id); if (t) txForm(t); },
  'void-txn': d => confirmBox('Batalkan transaksi?', 'Transaksi tetap tersimpan dengan status <b>Dibatalkan</b> sebagai jejak audit, tetapi tidak lagi dihitung di saldo, anggaran, maupun laporan. Pembatalan tidak bisa diurungkan.', 'Batalkan transaksi', () => {
    const t = S.txns.find(x => x.id === d.id); if (!t) return;
    t.status = 'void'; t.voidedAt = Date.now(); t.history = (t.history || []).concat([{ at: Date.now(), by: me(), byName: backend.user ? backend.user.name : '', what:'Transaksi dibatalkan' }]).slice(-20);
    persist('txns'); logAct(`Membatalkan transaksi "${t.desc || TX_TYPES[t.type]}" ${rp(t.amount)}`); toast('Transaksi dibatalkan'); render(); }),
  'new-settle': d => settleForm(null, { from:d.from, to:d.to, amount:d.amount }),
  'tx-page': d => { ui.txPage += +d.d; render(); window.scrollTo(0, 0); },
  'tx-all-months': () => { ui.txMonth = ''; ui.txPage = 1; render(); },
  'export-csv': () => offerFile(`infina-transaksi-${ui.txMonth || 'semua'}.csv`, csvOf(filteredTx()), 'text/csv'),
  'export-all-csv': () => offerFile(`infina-transaksi-${todayISO()}.csv`, csvOf(S.txns), 'text/csv'),
  'export-json': exportJSON,
  'new-account': () => accountForm(null),
  'edit-account': d => { const a = acc(d.id); if (a) accountForm(a); },
  'toggle-account': d => { const a = acc(d.id); if (!a) return; a.active = a.active === false; persist('accounts'); closeModal(); toast(a.active ? 'Rekening diaktifkan' : 'Rekening dinonaktifkan; riwayatnya tetap tersimpan'); render(); },
  'adjust-account': d => { const a = acc(d.id); if (a) adjustForm(a); },
  'acc-tx': d => { ui.txAcc = d.id; ui.txMonth = ''; ui.txPage = 1; location.hash = '#transaksi'; render(); },
  'new-budget': () => budgetForm(null),
  'edit-budget': d => { const b = findIn('budgets', d.id); if (b) budgetForm(b); },
  'del-budget': d => delConfirm('Hapus anggaran?', 'Batas anggaran kategori ini untuk bulan tersebut akan dihapus. Transaksinya tidak terpengaruh.', 'budgets', d.id),
  'copy-budgets': () => { const prev = ymShift(ui.budMonth, -1), have = new Set(S.budgets.filter(b => b.month === ui.budMonth).map(b => b.categoryId)); let n = 0;
    S.budgets.filter(b => b.month === prev && !have.has(b.categoryId)).forEach(b => { S.budgets.push({ id: uid('bud'), month: ui.budMonth, categoryId: b.categoryId, limit: b.limit, sample: b.sample }); n++; });
    if (n) { persist('budgets'); toast(`${n} anggaran disalin`); } else toast('Semua kategori sudah punya anggaran bulan ini'); render(); },
  'bud-month': d => { ui.budMonth = ymShift(ui.budMonth, +d.d); render(); },
  'new-rec': () => recForm(null),
  'edit-rec': d => { const r = findIn('recurring', d.id); if (r) recForm(r); },
  'toggle-rec': d => { const r = findIn('recurring', d.id); if (!r) return; r.paused = !r.paused; persist('recurring'); if (!r.paused) runRecurring(); render(); },
  'del-rec': d => delConfirm('Hapus jadwal berulang?', 'Jadwal berhenti membuat transaksi baru. Transaksi yang sudah tercatat tetap ada.', 'recurring', d.id),
  'new-debt': () => debtForm(null),
  'edit-debt': d => { const x = findIn('debts', d.id); if (x) debtForm(x); },
  'archive-debt': d => { const x = findIn('debts', d.id); if (!x) return; x.archived = !x.archived; persist('debts'); closeModal(); render(); },
  'pay-debt': d => { const x = findIn('debts', d.id); if (!x) return; const i = debtInfo(x);
    txForm(null, { type:'expense', amount: Math.min(x.installment, i.remaining), debtId: x.id, categoryId: (catByName('Cicilan & Utang') || {}).id, desc:`${x.name} ke-${i.paidCount + 1}` }); },
  'new-goal': () => goalForm(null),
  'edit-goal': d => { const g = findIn('goals', d.id); if (g) goalForm(g); },
  'del-goal': d => delConfirm('Hapus target?', 'Target dihapus. Rekening dan saldonya tidak berubah.', 'goals', d.id),
  'new-task': d => taskForm(null, { wedding: d && d.wedding === '1' }),
  'edit-task': d => { const k = findIn('tasks', d.id); if (k) taskForm(k); },
  'del-task': d => delConfirm('Hapus tugas?', 'Tugas akan dihapus permanen.', 'tasks', d.id),
  'task-done': d => { const k = findIn('tasks', d.id); if (k) setTaskStatus(k.id, k.status === 'done' ? 'todo' : 'done'); },
  'task-view': d => { ui.taskView = d.v; render(); },
  'new-project': () => openModal('Proyek baru', formShell('project', '', textIn('name', 'Nama proyek', '', 'maxlength="60" placeholder="Contoh: Renovasi dapur"'), 'Buat proyek')),
  'new-event': () => eventForm(null),
  'edit-event': d => { const e = findIn('events', d.id); if (e) eventForm(e); },
  'del-event': d => delConfirm('Hapus acara?', 'Acara dan seluruh pengulangannya akan dihapus.', 'events', d.id),
  'cal-day': d => { if (canWrite()) eventForm(null, d.date); },
  'cal-month': d => { ui.calMonth = ymShift(ui.calMonth, +d.d); render(); },
  'cal-today': () => { ui.calMonth = curYM(); render(); },
  'new-cat': d => catForm(null, d.kind),
  'edit-cat': d => { const c = cat(d.id); if (c) catForm(c); },
  'del-cat': d => delConfirm('Hapus kategori?', 'Kategori belum pernah dipakai, jadi aman dihapus.', 'categories', d.id),
  // wedding
  'w-tab': d => { ui.wTab = d.v; if (location.hash !== '#wedding') location.hash = '#wedding'; render(); },
  'edit-wedding': () => weddingForm(),
  'w-seed-checklist': seedChecklist,
  'new-wbudget': () => wbudgetForm(null),
  'edit-wbudget': d => { const b = findIn('wbudget', d.id); if (b) wbudgetForm(b); },
  'del-wbudget': d => delConfirm('Hapus kategori anggaran?', 'Kategori ini belum dipakai vendor.', 'wbudget', d.id),
  'new-vendor': () => vendorForm(null),
  'edit-vendor': d => { const v = vendor(d.id); if (v) vendorForm(v); },
  'del-vendor': d => delConfirm('Hapus vendor?', 'Vendor dan jadwal pembayarannya akan dihapus.', 'vendors', d.id, () => { S.wpays = S.wpays.filter(p => p.vendorId !== d.id); persist('wpays'); }),
  'new-wpay': d => wpayForm(null, d.vendor),
  'edit-wpay': d => { const p = findIn('wpays', d.id); if (p) wpayForm(p); },
  'del-wpay': d => delConfirm('Hapus jadwal bayar?', 'Jadwal ini akan dihapus.', 'wpays', d.id),
  'pay-wpay': d => { const p = findIn('wpays', d.id); if (!p) return; const v = vendor(p.vendorId);
    txForm(null, { type:'expense', amount:p.amount, vendorId:p.vendorId, schedId:p.id, categoryId: ensureCat('Pernikahan'), desc:`${p.label} ${v ? v.name : 'vendor'}` }); },
  'pay-vendor': d => { const v = vendor(d.id); if (!v) return; txForm(null, { type:'expense', vendorId:v.id, categoryId: ensureCat('Pernikahan'), desc:`Pembayaran ${v.name}` }); },
  'new-guest': () => { if (location.hash !== '#wedding') { ui.wTab = 'tamu'; location.hash = '#wedding'; } guestForm(null); },
  'edit-guest': d => { const g = findIn('guests', d.id); if (g) guestForm(g); },
  'del-guest': d => delConfirm('Hapus tamu?', 'Tamu akan dihapus dari daftar.', 'guests', d.id),
  'bulk-guests': () => bulkGuestForm(),
  'guest-invited': d => { const g = findIn('guests', d.id); if (!g) return; g.invited = !g.invited; persist('guests'); render(); },
  'new-inspo': () => inspoForm(null),
  'edit-inspo': d => { const x = findIn('inspo', d.id); if (x) inspoForm(x); },
  'del-inspo': d => delConfirm('Hapus inspirasi?', 'Referensi ini akan dihapus.', 'inspo', d.id),
  // travel
  'new-trip': () => tripForm(null),
  'edit-trip': d => { const t = trip(d.id); if (t) tripForm(t); },
  'del-trip': d => confirmBox('Hapus perjalanan?', 'Itinerary, booking, dan packing list perjalanan ini ikut dihapus. Transaksi pengeluarannya tetap ada di ledger.', 'Hapus', () => {
    S.trips = S.trips.filter(x => x.id !== d.id); ['itin','bookings','packing'].forEach(k => { S[k] = S[k].filter(x => x.tripId !== d.id); persist(k); }); persist('trips'); ui.tripId = null; render(); }),
  'open-trip': d => { ui.tripId = d.id; ui.tripTab = 'itinerary'; if (location.hash !== '#travel') location.hash = '#travel'; render(); window.scrollTo(0, 0); },
  'close-trip': () => { ui.tripId = null; render(); },
  'trip-tab': d => { ui.tripTab = d.v; render(); },
  'new-itin': d => itinForm(null, d.trip, d.date),
  'edit-itin': d => { const x = findIn('itin', d.id); if (x) itinForm(x); },
  'del-itin': d => delConfirm('Hapus kegiatan?', 'Kegiatan ini akan dihapus dari itinerary.', 'itin', d.id),
  'new-booking': d => bookingForm(null, d.trip),
  'edit-booking': d => { const x = findIn('bookings', d.id); if (x) bookingForm(x); },
  'del-booking': d => delConfirm('Hapus booking?', 'Booking ini akan dihapus. Transaksi pembayarannya (jika ada) tetap tercatat.', 'bookings', d.id),
  'pay-booking': d => { const b = findIn('bookings', d.id); if (!b) return; txForm(null, { type:'expense', amount:b.cost, tripId:b.tripId, bookingId:b.id, categoryId: ensureCat('Perjalanan'), desc:`${b.kind}: ${b.title}`, split: isShared() }); },
  'pack-toggle': d => { const p = findIn('packing', d.id); if (!p) return; p.done = !p.done; persist('packing'); render(); },
  'pack-del': d => { S.packing = S.packing.filter(x => x.id !== d.id); persist('packing'); render(); },
  'pack-template': d => { PACK_TEMPLATE.forEach(item => S.packing.push({ id: uid('pk'), tripId:d.trip, item, done:false })); persist('packing'); render(); },
  // growth
  'new-lgoal': () => lgoalForm(null),
  'edit-lgoal': d => { const g = findIn('lifegoals', d.id); if (g) lgoalForm(g); },
  'del-lgoal': d => delConfirm('Hapus tujuan?', 'Tujuan beserta milestone dan catatannya akan dihapus.', 'lifegoals', d.id),
  'ms-toggle': d => { const g = findIn('lifegoals', d.goal); if (!g) return; const m = (g.milestones || []).find(x => x.id === d.id); if (!m) return; m.done = !m.done;
    if (g.milestones.length && g.milestones.every(x => x.done) && g.status === 'aktif') { g.status = 'tercapai'; toast('Semua milestone selesai. Tujuan ditandai tercapai.'); }
    persist('lifegoals'); render(); },
  'ms-del': d => { const g = findIn('lifegoals', d.goal); if (!g) return; g.milestones = (g.milestones || []).filter(x => x.id !== d.id); persist('lifegoals'); render(); },
  'goal-update': d => openModal('Catat perkembangan', formShell('gupdate', `data-goal="${d.id}"`, areaIn('text', 'Apa perkembangannya?', '', 'maxlength="500" placeholder="Contoh: Bab 4 sudah dikirim ke dosen pembimbing"'), 'Simpan')),
  'new-habit': () => habitForm(null),
  'edit-habit': d => { const h = findIn('habits', d.id); if (h) habitForm(h); },
  'del-habit': d => delConfirm('Hapus kebiasaan?', 'Kebiasaan dan seluruh riwayatnya akan dihapus. Pilih Arsipkan jika ingin menyimpan riwayatnya.', 'habits', d.id),
  'habit-toggle': d => { const h = findIn('habits', d.id); if (!h || d.date > todayISO()) return; h.logs = Object.assign({}, h.logs); if (h.logs[d.date]) delete h.logs[d.date]; else h.logs[d.date] = 1; persist('habits'); render(); },
  'new-journal': d => journalForm(null, d && d.type),
  'open-journal': d => { const j = findIn('journal', d.id); if (!j) return; if (canWrite()) journalForm(j); else openModal(j.title || fmtDateLong(j.date), `<div class="mb"><p class="muted">${fmtDateLong(j.date)} · ${J_TYPES[j.type] || ''}</p><div style="white-space:pre-wrap">${esc(j.body)}</div></div>`); },
  'del-journal': d => delConfirm('Hapus catatan?', 'Catatan jurnal ini akan dihapus permanen.', 'journal', d.id),
  // workspace
  'new-ws': () => { if (backend.mode !== 'cloud') return toast('Workspace bersama membutuhkan Firebase. Isi config.js terlebih dahulu.', 'neg'); wsNameForm(false); },
  'rename-ws': () => wsNameForm(true),
  'switch-ws': d => { ui.tripId = null; backend.switchTo(d.id); location.hash = '#dashboard'; },
  'accept-invite': async d => { const inv = backend.invitesIn.find(x => x.id === d.id); if (!inv) return;
    try { await backend.acceptInvite(inv); toast(`Bergabung ke ${inv.wsName}`); setTimeout(() => { if (backend.workspaces.some(w => w.id === inv.wsId)) backend.switchTo(inv.wsId); }, 800); }
    catch(e) { toast('Gagal menerima undangan: ' + (e.code || e.message), 'neg'); } },
  'decline-invite': async d => { const inv = backend.invitesIn.find(x => x.id === d.id); if (!inv) return; try { await backend.declineInvite(inv); toast('Undangan ditolak'); } catch(e) { toast('Gagal: ' + (e.code || e.message), 'neg'); } },
  'cancel-invite': async d => { try { await backend.cancelInvite(d.id); toast('Undangan dibatalkan'); } catch(e) { toast('Gagal: ' + (e.code || e.message), 'neg'); } },
  'remove-member': d => confirmBox('Keluarkan anggota?', `${esc(memberFull(d.id))} tidak akan bisa lagi membuka workspace ini. Data yang pernah dicatatnya tetap ada.`, 'Keluarkan', async () => {
    try { await backend.removeMember(d.id); logAct(`Mengeluarkan ${memberFull(d.id)} dari workspace`); toast('Anggota dikeluarkan'); } catch(e) { toast('Gagal: ' + (e.code || e.message), 'neg'); } }),
  'transfer-owner': d => confirmBox('Alihkan kepemilikan?', `${esc(memberFull(d.id))} akan menjadi pemilik workspace ini, dan peran Anda berubah menjadi Editor. Hanya pemilik baru yang bisa mengembalikannya.`, 'Alihkan', async () => {
    try { logAct(`Mengalihkan kepemilikan ke ${memberFull(d.id)}`); await backend.transfer(d.id); toast('Kepemilikan dialihkan'); } catch(e) { toast('Gagal: ' + (e.code || e.message), 'neg'); } }),
  'leave-ws': () => confirmBox('Keluar dari workspace?', 'Anda tidak bisa lagi membuka workspace ini sampai diundang kembali.', 'Keluar', async () => {
    try { logAct('Keluar dari workspace'); await backend.leave(); toast('Anda keluar dari workspace'); backend.switchTo('personal_' + me()); } catch(e) { toast('Gagal: ' + (e.code || e.message), 'neg'); } }),
  'delete-ws': () => { openModal('Hapus workspace?', `<div class="mb"><p>Workspace <b>${esc(WS().name)}</b> beserta seluruh datanya akan dihapus permanen untuk semua anggota.</p>
      <label class="f"><span>Ketik HAPUS untuk melanjutkan</span><input id="delConfirm" autocomplete="off"></label></div><footer><button class="btn" data-act="close-modal">Batal</button><button class="btn btn-danger solid" data-act="delete-ws-yes">Hapus workspace</button></footer>`); },
  'delete-ws-yes': async () => { if (($('#delConfirm').value || '').trim().toUpperCase() !== 'HAPUS') return toast('Ketik HAPUS untuk konfirmasi', 'neg');
    closeModal(); toast('Menghapus workspace…'); try { await backend.deleteWs(); toast('Workspace dihapus'); backend.switchTo('personal_' + me()); } catch(e) { toast('Gagal menghapus: ' + (e.code || e.message), 'neg'); } },
  // data
  'load-sample': () => { if (S.accounts.some(a => a.sample)) return toast('Data contoh sudah dimuat'); loadSample(); },
  'clear-sample': () => confirmBox('Hapus data contoh?', 'Semua data berlabel "Contoh" di workspace ini akan dihapus. Data Anda sendiri tidak terpengaruh.', 'Hapus data contoh', clearSample),
  'wipe': () => openModal('Hapus semua data?', `<div class="mb"><p>Seluruh data di workspace <b>${esc(WS().name)}</b> akan dihapus permanen${isShared() ? ' untuk semua anggota' : ''}. Ekspor cadangan dulu jika masih diperlukan.</p>
      <label class="f"><span>Ketik HAPUS untuk melanjutkan</span><input id="wipeConfirm" autocomplete="off"></label></div><footer><button class="btn" data-act="close-modal">Batal</button><button class="btn btn-danger solid" data-act="wipe-yes">Hapus semua data</button></footer>`),
  'wipe-yes': () => { if (($('#wipeConfirm').value || '').trim().toUpperCase() !== 'HAPUS') return toast('Ketik HAPUS untuk konfirmasi', 'neg'); closeModal(); logAct('Menghapus semua data workspace'); wipeAll(); },
  // notifications & search
  'toggle-notif': () => { ui.notifOpen = !ui.notifOpen; renderBell(); },
  'notif-read-all': () => { notifications().forEach(n => readSet.add(n.id)); saveRead(); renderBell(); },
  'notif-open': d => { readSet.add(d.id); saveRead(); ui.notifOpen = false; if (location.hash === d.href) render(); else location.hash = d.href; renderBell(); },
  'search-pick': d => { $('#gres').hidden = true; $('#gsearch').value = ''; const fn = A[d.target]; if (fn) fn({ id: d.id }); }
};

/* ---------- event wiring ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) {
    if (ui.notifOpen && !e.target.closest('.bell')) { ui.notifOpen = false; renderBell(); }
    if (!e.target.closest('.search')) { const r = $('#gres'); if (r) r.hidden = true; }
    if (e.target.matches('[data-overlay]')) closeModal();
    return;
  }
  const act = el.dataset.act, fn = A[act]; if (!fn) return;
  if (el.tagName === 'A' && act !== 'notif-open') return;
  e.preventDefault();
  if (!READ_ACTS.has(act) && !canWrite() && act !== 'quick-add') { toast('Anda hanya bisa melihat di workspace ini', 'neg'); return; }
  if (el.closest('.qa-list')) closeModal();
  fn(el.dataset, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#modalRoot').innerHTML) closeModal(); else if (ui.notifOpen) { ui.notifOpen = false; renderBell(); } closeMenu(); const r = $('#gres'); if (r) r.hidden = true; return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  if (!canWrite() && f.dataset.form !== 'noop') return toast('Anda hanya bisa melihat di workspace ini', 'neg');
  const fn = FORMS[f.dataset.form]; if (fn) fn(f);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('[data-money]') || (t.matches('[data-spv]') && t.placeholder === 'Rp')) {
    const digits = t.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15);
    t.value = digits ? Number(digits).toLocaleString('id-ID') : '';
  }
  if (t.matches('input[type=search][data-filter]')) { ui[t.dataset.filter] = t.value; ui.txPage = 1; render(); }
  const f = t.closest && t.closest('form[data-form="tx"]'); if (f) syncTxForm(f);
  if (t.id === 'gsearch') {
    const res = searchResults(t.value), box = $('#gres');
    box.hidden = t.value.trim().length < 2;
    box.innerHTML = res.length ? res.map(r => `<button data-act="search-pick" data-target="${r.act}" data-id="${r.id}"><span>${esc(r.l)}</span><span class="muted num" style="font-size:12px;white-space:nowrap">${esc(r.r)}</span></button>`).join('') : '<p class="muted" style="padding:8px 10px">Tidak ditemukan.</p>';
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'wsSelect') { ui.tripId = null; backend.switchTo(t.value); location.hash = '#dashboard'; closeMenu(); return; }
  if (t.id === 'importFile' && t.files && t.files[0]) {
    const file = t.files[0]; t.value = '';
    file.text().then(txt => { let obj = null; try { obj = JSON.parse(txt); } catch(x) {} if (!obj) return toast('File tidak bisa dibaca. Pilih file .json hasil ekspor Infina.', 'neg'); importData(obj); });
    return;
  }
  if (t.matches('[data-filter]') && !t.matches('input[type=search]')) { ui[t.dataset.filter] = t.type === 'checkbox' ? t.checked : t.value; ui.txPage = 1; render(); return; }
  if (!canWrite()) return;
  if (t.matches('[data-status]')) { setTaskStatus(t.dataset.status, t.value); return; }
  if (t.matches('[data-rsvp]')) { const g = findIn('guests', t.dataset.rsvp); if (g) { g.rsvp = t.value; persist('guests'); render(); } return; }
  if (t.matches('[data-role]')) { const id = t.dataset.role, role = t.value; backend.setRole(id, role).then(() => { logAct(`Mengubah peran ${memberFull(id)} menjadi ${ROLE[role]}`); toast('Peran diperbarui'); }).catch(err => toast('Gagal: ' + (err.code || err.message), 'neg')); return; }
  if (t.matches('[data-module]')) { let s = S.settings.find(x => x.id === 'settings'); if (!s) { s = { id:'settings', modules:{} }; S.settings.push(s); } s.modules = Object.assign({}, s.modules, { [t.dataset.module]: t.checked }); persist('settings'); render(); return; }
  const f = t.closest('form[data-form]'); if (!f) return;
  if (f.dataset.form === 'tx') syncTxForm(f, t.name === 'type' ? '' : undefined);
  if (f.dataset.form === 'rec' && t.name === 'type') syncRecForm(f);
  if (f.dataset.form === 'account' && t.name === 'type') { const cc = t.value === 'credit_card'; $('[data-cc="0"]', f).hidden = cc; $('[data-cc="1"]', f).hidden = !cc; }
});
let dragId = null;
document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('[data-task]'); if (c && canWrite()) { dragId = c.dataset.task; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch(x){} } });
document.addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('[data-col]'); if (col && dragId) { e.preventDefault(); $$('.col.over').forEach(c => c !== col && c.classList.remove('over')); col.classList.add('over'); } });
document.addEventListener('dragleave', e => { const col = e.target.closest && e.target.closest('[data-col]'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
document.addEventListener('drop', e => { const col = e.target.closest && e.target.closest('[data-col]'); if (col && dragId) { e.preventDefault(); const id = dragId; dragId = null; setTaskStatus(id, col.dataset.col); } });
document.addEventListener('dragend', () => { dragId = null; $$('.col.over').forEach(c => c.classList.remove('over')); });
window.addEventListener('hashchange', () => { closeMenu(); if (location.hash !== '#travel') ui.tripId = null; render(); window.scrollTo(0, 0); });
window.addEventListener('online', () => renderSide && shellMounted && renderSide());
window.addEventListener('offline', () => renderSide && shellMounted && renderSide());

let lastDay = todayISO();
setInterval(() => { if (!wsReady) return; const t = todayISO(); if (t !== lastDay) { lastDay = t; runRecurring(); render(); } }, 60000);

/* ---------- boot ---------- */
(function boot(){
  if (cloudConfigured && window.firebase && firebase.initializeApp) {
    try { backend = makeCloudBackend(); render(); backend.start(); return; }
    catch(e) { console.error(e); bootNote = 'Konfigurasi Firebase gagal dimuat (' + e.message + '). Berjalan dalam mode lokal.'; }
  } else if (cloudConfigured) {
    fatal = 'Infina tidak bisa terhubung ke Firebase. Periksa koneksi internet, lalu muat ulang halaman.';
    backend = { mode:'cloud', user:null, signIn(){ location.reload(); } }; render(); return;
  }
  backend = makeLocalBackend(); render(); backend.open();
})();
})();
