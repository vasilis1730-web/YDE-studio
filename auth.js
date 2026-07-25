/* ============================================================
   ΥΔΕ Studio — στρώμα ταυτότητας & πρόσβασης (Supabase Auth)
   ============================================================ */
(function(){
  const CFG=window.YDE_CONFIG;
  const sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  window.SB=sb;
  const ROLE_L={admin:'Διαχειριστής',engineer:'Μηχανικός',viewer:'Προβολή μόνο'};
  const escA=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const grA=d=>d?new Date(d).toLocaleString('el-GR',{dateStyle:'short',timeStyle:'short'}):'—';

  let started=false, idleT=null;

  /* ---------- οθόνη εισόδου ---------- */
  function gate(){return document.getElementById('gate');}
  function showLogin(msg,kind){
    started=false;
    gate().style.display='flex';
    document.getElementById('app').innerHTML='';
    gate().innerHTML=`
     <div class="lg-card">
       <div class="lg-brand"><span class="lg-mark"></span><div><b>ΥΔΕ Studio</b><span>Υπεύθυνες δηλώσεις · μονογραμμικά · ΔΕΔΔΗΕ</span></div></div>
       ${msg?`<div class="lg-msg ${kind||''}">${escA(msg)}</div>`:''}
       <form id="lgform" autocomplete="on">
        <label>E-mail</label>
        <input id="lg-email" type="email" required autocomplete="username" placeholder="name@rhodes.gr">
        <label>Κωδικός</label>
        <input id="lg-pass" type="password" required autocomplete="current-password" placeholder="••••••••">
        <button class="lg-btn" type="submit">Είσοδος</button>
       </form>
       <button class="lg-link" id="lg-forgot">Ξέχασα τον κωδικό μου</button>
       <div class="lg-foot">Η πρόσβαση παρέχεται από τον διαχειριστή. Οι λογαριασμοί δεν δημιουργούνται με ελεύθερη εγγραφή.</div>
     </div>`;
    document.getElementById('lgform').addEventListener('submit',doLogin);
    document.getElementById('lg-forgot').addEventListener('click',doForgot);
    document.getElementById('lg-email').focus();
  }
  function setBusy(b,txt){
    const btn=document.querySelector('.lg-btn');if(btn){btn.disabled=b;btn.textContent=b?(txt||'Σύνδεση…'):'Είσοδος';}
  }
  async function doLogin(e){
    e.preventDefault();
    const email=document.getElementById('lg-email').value.trim();
    const password=document.getElementById('lg-pass').value;
    setBusy(true);
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){setBusy(false);
      const m=/Invalid login/.test(error.message)?'Λάθος e-mail ή κωδικός.':error.message;
      return showLoginError(m);}
    await afterAuth();
  }
  function showLoginError(m){
    const box=document.querySelector('.lg-msg');
    if(box){box.textContent=m;box.className='lg-msg bad';}
    else{const f=document.getElementById('lgform');const d=document.createElement('div');d.className='lg-msg bad';d.textContent=m;f.parentNode.insertBefore(d,f);}
  }
  async function doForgot(){
    const email=document.getElementById('lg-email').value.trim();
    if(!email)return showLoginError('Γράψε πρώτα το e-mail σου και μετά πάτησε «Ξέχασα τον κωδικό μου».');
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]});
    if(error)return showLoginError(error.message);
    const box=document.querySelector('.lg-msg')||(()=>{const d=document.createElement('div');document.getElementById('lgform').parentNode.insertBefore(d,document.getElementById('lgform'));return d;})();
    box.className='lg-msg ok';box.textContent='Αν το e-mail αντιστοιχεί σε λογαριασμό, στάλθηκε σύνδεσμος επαναφοράς. (Χρειάζεται ρυθμισμένο SMTP στο Supabase.)';
  }

  /* ---------- μετά την ταυτοποίηση: έλεγχος μέλους/κατάστασης ---------- */
  async function afterAuth(){
    const {data:prof,error}=await sb.rpc('yde_touch_login');
    const p=Array.isArray(prof)?prof[0]:prof;
    if(error){await sb.auth.signOut();return showLogin('Σφάλμα σύνδεσης: '+error.message,'bad');}
    if(!p){await sb.auth.signOut();return showLogin('Ο λογαριασμός σου δεν έχει πρόσβαση στην εφαρμογή ΥΔΕ. Ζήτησε από τον διαχειριστή να σε προσθέσει.','bad');}
    if(p.status!=='active'){await sb.auth.signOut();return showLogin(p.status==='pending'?'Ο λογαριασμός σου αναμένει έγκριση από τον διαχειριστή.':'Ο λογαριασμός σου είναι απενεργοποιημένος. Επικοινώνησε με τον διαχειριστή.','bad');}
    const {data:u}=await sb.auth.getUser();
    window.YDE_USER={id:p.id,email:p.email||(u&&u.user&&u.user.email),name:p.full_name,role:p.role,last:p.last_sign_in};
    window.YDE_READONLY=(p.role==='viewer');
    document.body.classList.toggle('role-viewer',window.YDE_READONLY);
    gate().style.display='none';gate().innerHTML='';
    if(!started){started=true; if(typeof startApp==='function') startApp(); }
    armIdle();
  }

  /* ---------- αδράνεια ---------- */
  function armIdle(){
    const mins=(CFG.IDLE_MINUTES||15);
    const reset=()=>{clearTimeout(idleT);idleT=setTimeout(idleOut,mins*60*1000);};
    ['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(ev=>
      document.addEventListener(ev,reset,{passive:true}));
    reset();
  }
  async function idleOut(){
    if(!window.YDE_USER)return;
    window.YDE_USER=null;await sb.auth.signOut();
    showLogin('Αποσυνδεθήκατε αυτόματα λόγω αδράνειας ('+(CFG.IDLE_MINUTES||15)+' λεπτά). Συνδεθείτε ξανά.','warn');
  }

  /* ---------- έξοδος ---------- */
  window.ydeLogout=async function(){
    window.YDE_USER=null;clearTimeout(idleT);
    await sb.auth.signOut();
    showLogin('Αποσυνδεθήκατε.','ok');
  };

  /* ---------- αλλαγή δικού μου κωδικού ---------- */
  window.ydeChangePass=function(){
    modal('Αλλαγή κωδικού',
     `<div class="f"><label>Νέος κωδικός (≥ 6 χαρακτήρες)</label><input id="cp1" type="password"></div>
      <div class="f" style="margin-top:8px"><label>Επανάληψη</label><input id="cp2" type="password"></div>
      <div id="cpmsg"></div>`,
     `<button class="btn ghost" data-act="closemodal">Άκυρο</button><button class="btn" id="cpok">Αποθήκευση</button>`);
    setTimeout(()=>{const b=document.getElementById('cpok');if(b)b.onclick=async()=>{
      const a=document.getElementById('cp1').value,c=document.getElementById('cp2').value;
      const m=document.getElementById('cpmsg');
      if(a.length<6){m.innerHTML='<div class="note bad" style="margin:8px 0 0">Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες.</div>';return;}
      if(a!==c){m.innerHTML='<div class="note bad" style="margin:8px 0 0">Οι δύο κωδικοί δεν ταιριάζουν.</div>';return;}
      b.disabled=true;
      const {error}=await sb.auth.updateUser({password:a});
      if(error){m.innerHTML='<div class="note bad" style="margin:8px 0 0">'+escA(error.message)+'</div>';b.disabled=false;return;}
      closeModal();
    };},30);
  };

  /* ---------- πάνελ διαχείρισης χρηστών ---------- */
  async function callAdmin(payload){
    const {data,error}=await sb.functions.invoke(CFG.ADMIN_FN,{body:payload});
    if(error){
      let d='';try{d=(await error.context.json()).error;}catch(e){}
      throw new Error(d||error.message);
    }
    if(data&&data.error)throw new Error(data.error);
    return data;
  }
  window.ydeAdminPanel=async function(){
    if(!window.YDE_USER||window.YDE_USER.role!=='admin')return;
    modal('Διαχείριση χρηστών','<div id="usrbody" class="muted">Φόρτωση…</div>',
      `<button class="btn ghost" data-act="closemodal">Κλείσιμο</button>`);
    await renderUsers();
  };
  async function renderUsers(){
    const box=document.getElementById('usrbody');if(!box)return;
    const {data:list,error}=await sb.from('yde_profiles').select('*').order('created_at');
    if(error){box.innerHTML='<div class="note bad">'+escA(error.message)+'</div>';return;}
    const me=window.YDE_USER.id;
    box.innerHTML=`
     <div class="row" style="margin-bottom:12px">
       <button class="btn sm" id="usr-add">+ Νέος χρήστης</button>
       <span class="muted" style="font-size:12px">Οι χρήστες ΥΔΕ είναι ανεξάρτητοι από την εφαρμογή Προμηθειών.</span>
     </div>
     <div id="usr-form"></div>
     <div class="scroll"><table class="t"><thead><tr>
       <th>Χρήστης</th><th>Ρόλος</th><th>Κατάσταση</th><th>Τελευταία σύνδεση</th><th></th></tr></thead><tbody>
       ${list.map(u=>`<tr>
         <td><b>${escA(u.full_name||'—')}</b><div class="muted" style="font-size:11px">${escA(u.email||'')}</div></td>
         <td><select data-urole="${u.id}" ${u.id===me?'disabled':''}>
           ${['admin','engineer','viewer'].map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLE_L[r]}</option>`).join('')}</select></td>
         <td>${u.status==='active'?'<span class="pill ok">ενεργός</span>':(u.status==='pending'?'<span class="pill warn">αναμονή</span>':'<span class="pill bad">ανενεργός</span>')}</td>
         <td class="muted" style="font-size:12px">${grA(u.last_sign_in)}</td>
         <td><div class="row" style="gap:5px;flex-wrap:nowrap">
           ${u.id===me?'<span class="muted" style="font-size:11px">εσύ</span>':`
             ${u.status==='active'?`<button class="btn sm ghost" data-udis="${u.id}">Απενεργοποίηση</button>`:`<button class="btn sm" data-uen="${u.id}">Ενεργοποίηση</button>`}
             <button class="btn sm ghost" data-upass="${u.id}">Κωδικός</button>
             <button class="btn sm danger" data-urem="${u.id}">✕</button>`}
         </div></td></tr>`).join('')}
     </tbody></table></div>`;
    document.getElementById('usr-add').onclick=addUserForm;
    box.querySelectorAll('[data-urole]').forEach(s=>s.onchange=async()=>{
      try{await callAdmin({action:'set_role',id:s.dataset.urole,role:s.value});await renderUsers();}
      catch(e){alert(e.message);}});
    box.querySelectorAll('[data-udis]').forEach(b=>b.onclick=()=>guard(b,()=>callAdmin({action:'set_status',id:b.dataset.udis,status:'disabled'})));
    box.querySelectorAll('[data-uen]').forEach(b=>b.onclick=()=>guard(b,()=>callAdmin({action:'set_status',id:b.dataset.uen,status:'active'})));
    box.querySelectorAll('[data-upass]').forEach(b=>b.onclick=()=>resetPassForm(b.dataset.upass));
    box.querySelectorAll('[data-urem]').forEach(b=>b.onclick=()=>{
      if(confirm('Αφαίρεση πρόσβασης ΥΔΕ για αυτόν τον χρήστη;'))guard(b,()=>callAdmin({action:'remove',id:b.dataset.urem}));});
  }
  async function guard(btn,fn){try{btn.disabled=true;await fn();await renderUsers();}catch(e){alert(e.message);btn.disabled=false;}}
  function addUserForm(){
    const f=document.getElementById('usr-form');
    f.innerHTML=`<div class="card" style="margin-bottom:12px"><div class="body">
      <div class="grid g2">
        <div class="f"><label>Ονοματεπώνυμο</label><input id="nu-name" placeholder="π.χ. Μιχάλης Διακολιός"></div>
        <div class="f"><label>E-mail</label><input id="nu-email" type="email" placeholder="name@rhodes.gr"></div>
        <div class="f"><label>Προσωρινός κωδικός (≥ 6)</label><input id="nu-pass" placeholder="τον αλλάζει ο χρήστης μετά"></div>
        <div class="f"><label>Ρόλος</label><select id="nu-role">
          <option value="engineer">Μηχανικός</option><option value="viewer">Προβολή μόνο</option><option value="admin">Διαχειριστής</option></select></div>
      </div>
      <div id="nu-msg"></div>
      <div class="row end" style="margin-top:10px">
        <button class="btn ghost sm" id="nu-cancel">Άκυρο</button>
        <button class="btn sm" id="nu-save">Δημιουργία</button></div>
    </div></div>`;
    document.getElementById('nu-cancel').onclick=()=>f.innerHTML='';
    document.getElementById('nu-name').focus();
    document.getElementById('nu-save').onclick=async()=>{
      const email=document.getElementById('nu-email').value.trim();
      const password=document.getElementById('nu-pass').value;
      const full_name=document.getElementById('nu-name').value.trim();
      const role=document.getElementById('nu-role').value;
      const msg=document.getElementById('nu-msg');
      if(!email||password.length<6){msg.innerHTML='<div class="note bad" style="margin:8px 0 0">Χρειάζεται e-mail και κωδικός ≥ 6 χαρακτήρων.</div>';return;}
      const btn=document.getElementById('nu-save');btn.disabled=true;btn.textContent='Δημιουργία…';
      try{const r=await callAdmin({action:'create',email,password,full_name,role});
        f.innerHTML='';await renderUsers();
      }catch(e){msg.innerHTML='<div class="note bad" style="margin:8px 0 0">'+escA(e.message)+'</div>';btn.disabled=false;btn.textContent='Δημιουργία';}
    };
  }
  function resetPassForm(id){
    const np=prompt('Νέος προσωρινός κωδικός (≥ 6 χαρακτήρες):');
    if(np==null)return;
    if(np.length<6){alert('Πολύ σύντομος κωδικός.');return;}
    callAdmin({action:'reset_password',id,password:np}).then(()=>alert('Ο κωδικός άλλαξε.')).catch(e=>alert(e.message));
  }

  /* ---------- εκκίνηση ---------- */
  sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT'&&started){/* handled elsewhere */} });
  (async function init(){
    const {data}=await sb.auth.getSession();
    if(data&&data.session){await afterAuth();}
    else{showLogin();}
  })();
})();
