'use strict';
// Le Comptoir des Belles Saveurs — serveur Node sans dépendance (Node >= 18).
// Base de données et photos : Supabase (Postgres + Storage) via l'API REST. Voir README.md.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
try{for(const l of fs.readFileSync(path.join(__dirname,'.env'),'utf8').split('\n')){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2]}}catch{}
const E=process.env,PROD=E.NODE_ENV==='production',PORT=+E.PORT||3000;
const SB=(E.SUPABASE_URL||'').replace(/\/$/,''),SKEY=E.SUPABASE_SERVICE_KEY||'';
if(!SB||!SKEY){console.error('Configuration manquante : SUPABASE_URL (https://xxxx.supabase.co) et SUPABASE_SERVICE_KEY — voir .env.example');if(require.main===module)process.exit(1)}
const SECRET=E.SESSION_SECRET||crypto.randomBytes(32).toString('hex');
if(!E.SESSION_SECRET&&require.main===module)console.warn('SESSION_SECRET absent : les connexions admin seront perdues à chaque redémarrage.');
// --- Supabase (PostgREST + Storage). La clé « service » reste côté serveur, jamais dans le navigateur.
const hdr=x=>({apikey:SKEY,...(SKEY.startsWith('eyJ')?{Authorization:'Bearer '+SKEY}:{}),...x});
async function q(method,table,o={}){
  if(typeof o==='string')o={query:o};const{query='',body,prefer}=o;
  const r=await fetch(`${SB}/rest/v1/${table}${query}`,{method,headers:hdr({'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})}),body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  const t=await r.text();if(!r.ok)throw new Error(`Supabase ${method} ${table} ${r.status} ${t.slice(0,160)}`);return t?JSON.parse(t):null}
let sc=null,sct=0,pc=null,pct=0;
const allS=async()=>{if(sc&&Date.now()-sct<30000)return sc;sc=Object.fromEntries((await q('GET','settings','?select=k,v')).map(r=>[r.k,r.v]));sct=Date.now();return sc};
const setMany=async o=>{const rows=Object.entries(o).map(([k,v])=>({k,v:String(v)}));if(rows.length)await q('POST','settings',{query:'?on_conflict=k',body:rows,prefer:'resolution=merge-duplicates,return=minimal'});sc=null;pc=null};
const hash=(p,salt=crypto.randomBytes(16).toString('hex'))=>salt+'$'+crypto.scryptSync(p,salt,64).toString('hex');
const verify=(p,h)=>{const[s,x]=(h||'$').split('$');if(!x)return false;const a=Buffer.from(hash(p,s).split('$')[1],'hex'),b=Buffer.from(x,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)};

const SEED=[
    ['sucres','Beignet sucré nature','Beignet classique, moelleux et légèrement sucré, préparé à la commande.','pièce',null],
    ['sucres','Beignets sucrés — autres variétés','Plusieurs variétés disponibles selon la saison et les disponibilités.','pièce',null],
    ['sales','Beignet salé nature','Beignet salé classique, croustillant à l\'extérieur et moelleux à l\'intérieur.','pièce',null],
    ['sales','Beignet salé garni','Beignet salé avec garniture — viande, légumes ou autres selon disponibilité.','pièce',null],
    ['sales','Beignet salé aux légumes','Beignet salé garni de légumes frais, une option savoureuse et végétarienne.','pièce','légumes'],
    ['fatayas','Fataya au poulet','Chausson croustillant garni de poulet préparé avec des épices sénégalaises.','pièce','poulet'],
    ['fatayas','Fataya au poisson','Chausson garni de poisson assaisonné, une spécialité sénégalaise incontournable.','pièce','poisson'],
    ['fatayas','Fataya aux légumes','Chausson garni de légumes frais, une option savoureuse et végétarienne.','pièce','légumes'],
    ['fatayas','Fataya à la viande','Chausson garni de viande hachée épicée, généreux et savoureux.','pièce','viande hachée'],
    ['fatayas','Fataya mixte','Chausson garni d\'une combinaison de garnitures selon disponibilité.','pièce','mixte'],
    ['jus','Jus de bissap','Jus d\'hibiscus rouge, légèrement acidulé et rafraîchissant.','330 ml / 1,5 L',null],
    ['jus','Jus de bouye','Jus de pain de singe (baobab), crémeux et légèrement acidulé.','330 ml / 1,5 L',null],
    ['jus','Jus de gingembre','Jus piquant et tonique, idéal pour se rafraîchir et se revitaliser.','330 ml / 1,5 L',null],
    ['jus','Jus d\'ananas','Jus doux et sucré, au goût tropical et rafraîchissant.','330 ml / 1,5 L',null],
    ['jus','Jus de mangue','Jus onctueux et fruité, préparé avec des mangues bien mûres.','330 ml / 1,5 L',null],
    ['jus','Jus d\'orange','Jus d\'orange pressé, frais et vitaminé.','330 ml / 1,5 L',null],
    ['jus','Jus de pastèque','Jus léger et très désaltérant, à base de pastèque fraîche.','330 ml / 1,5 L',null],
    ['jus','Jus de citron','Jus acidulé et rafraîchissant, parfait pour se désaltérer.','330 ml / 1,5 L',null],
    ['jus','Jus de papaye','Jus doux et parfumé, riche en vitamines.','330 ml / 1,5 L',null],
    ['jus','Jus de goyave','Jus savoureux à base de goyave fraîche, légèrement acidulé.','330 ml / 1,5 L',null],
    ['jus','Jus de ditakh','Jus traditionnel à base de ditakh (Detarium senegalense), acidulé et aromatique.','330 ml / 1,5 L',null],
    ['jus','Jus de tamarin','Jus acidulé et fruité à base de tamarin, très apprécié au Sénégal.','330 ml / 1,5 L',null],
    ['jus','Jus de madd','Jus à base de madd (Saba senegalensis), fruit tropical aux saveurs intenses.','330 ml / 1,5 L',null],
];

const KEYS=['wa','tel','mail','ville','retrait','horaires','livraison','frais','facebook','instagram','tiktok','logo','hero','slogan','hero_texte','annonce','paiement','livraison_info','conditions','a_presentation','a_histoire','a_activite','a_valeurs','a_demarche','a_engagement','legal_nom','legal_resp','legal_adresse','legal_id','hebergeur','conservation'];
const IMG=['logo','hero'],URLS=['facebook','instagram','tiktok'],LONG=['paiement','livraison_info','conditions','conservation','a_presentation','a_histoire','a_activite','a_valeurs','a_demarche','a_engagement','hero_texte','annonce'];

const cfg=async()=>{const s=await allS();return Object.fromEntries(KEYS.map(k=>[k,s[k]||'']))};
const pub=r=>({id:String(r.id),cat:r.cat,name:r.name,desc:r.descr,price:r.price,unit:r.unit||'pièce',min:r.minq,delay:r.delay,garniture:r.garniture,img:r.img,published:!!r.published});
const pubProducts=async()=>{if(pc&&Date.now()-pct<30000)return pc;pc=(await q('GET','products','?select=*&published=eq.true&order=id.asc')).map(pub);pct=Date.now();return pc};
let ready=null;
const ensure=()=>ready||(ready=(async()=>{const s=await allS();
  if(!s.admin_hash){let pw=E.ADMIN_PASSWORD;if(!pw||pw.length<10){pw=crypto.randomBytes(9).toString('base64url');console.log('\n>>> Mot de passe administrateur généré (à noter, affiché une seule fois) :',pw,'\n')}
    await setMany({admin_user:E.ADMIN_USER||'admin',admin_hash:hash(pw)})}
  if(!(await q('GET','products','?select=id&limit=1')).length)await q('POST','products',{body:SEED.map(([cat,name,descr,unit,garniture])=>({cat,name,descr,unit,garniture:garniture||null})),prefer:'return=minimal'});
})().catch(e=>{ready=null;console.error('Initialisation Supabase impossible (tables créées ? exécutez supabase/schema.sql) :',e.message);throw e}));
const IMGP=SB+'/storage/v1/object/public/uploads/',okImg=v=>typeof v==='string'&&v.startsWith(IMGP)&&/^[\w./:-]+$/.test(v);
// --- utilitaires
const hits=new Map();
const limited=(k,max,ms)=>{const n=Date.now(),a=(hits.get(k)||[]).filter(t=>n-t<ms);a.push(n);hits.set(k,a);return a.length>max};
const ip=r=>(E.TRUST_PROXY==='1'&&r.headers['x-forwarded-for']?.split(',')[0].trim())||r.socket.remoteAddress;
const clean=(x,n)=>String(x??'').replace(/[\u0000-\u0008\u000b-\u001f]/g,'').trim().slice(0,n);
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const body=(req,max=65536)=>new Promise((ok,ko)=>{try{if(req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body))return ok(req.body)}catch{return ko(new Error('json'))}
  let n=0,b=[];req.on('data',d=>{n+=d.length;if(n>max){ko(new Error('big'));req.destroy()}else b.push(d)});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(b).toString()||'{}'))}catch{ko(new Error('json'))}})});

const fp=s=>crypto.createHash('sha256').update(s.admin_hash||'').digest('hex').slice(0,10);
const mac=pl=>crypto.createHmac('sha256',SECRET).update(pl).digest('base64url');
const mk=async()=>{const pl=(Date.now()+8*36e5)+'.'+fp(await allS());return pl+'.'+mac(pl)};
const auth=async req=>{const m=/(?:^|; )sid=([\w.-]+)/.exec(req.headers.cookie||'');if(!m)return false;const t=m[1].split('.');if(t.length!==3)return false;
  const a=Buffer.from(mac(t[0]+'.'+t[1])),b=Buffer.from(t[2]);if(a.length!==b.length||!crypto.timingSafeEqual(a,b)||+t[0]<Date.now())return false;return t[1]===fp(await allS())};
const cookie=(t,age)=>`sid=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${PROD?'; Secure':''}`;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain','.ico':'image/x-icon'};
const PAGES=['/sucres','/sales','/fatayas','/jus','/evenements','/apropos','/contact','/legal'];
const PAGE_FILES={'/':'index.html','/sucres':'sucres.html','/sales':'sales.html','/fatayas':'fatayas.html','/jus':'jus.html','/evenements':'evenements.html','/apropos':'apropos.html','/contact':'contact.html','/legal':'legal.html'};
const HDR={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; img-src 'self' data: "+SB+"; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; form-action 'self'"};
if(PROD)HDR['Strict-Transport-Security']='max-age=31536000';
function serveFile(res,f,extra={}){fs.readFile(f,(e,d)=>{if(e){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Introuvable')}res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream',...extra});res.end(d)})}
const notify=(id,o,kind)=>{if(!E.NOTIFY_URL)return Promise.resolve();return fetch(E.NOTIFY_URL,{method:'POST',headers:{Title:'Nouvelle demande CBS-'+id,'Content-Type':'text/plain; charset=utf-8'},body:`${kind==='evenement'?'Devis evenement':'Commande'} CBS-${id}\n${o.nom} - ${o.tel}\nDate : ${o.date}\n`+o.lines.map(l=>`- ${l.name} x${l.qty}`).join('\n')+(o.extra?'\n+ '+o.extra:''),signal:AbortSignal.timeout(3000)}).catch(()=>{})};
const META={'/':['Le Comptoir des Belles Saveurs — Beignets, fatayas sur commande','Beignets sucrés, beignets salés et fatayas préparés exclusivement sur commande. Prix en FCFA, commande par WhatsApp ou formulaire.'],
'/sucres':['Beignets sucrés sur commande — Le Comptoir des Belles Saveurs','Nos beignets sucrés avec prix unitaires en FCFA, préparés exclusivement sur commande.'],
'/sales':['Beignets salés sur commande — Le Comptoir des Belles Saveurs','Nos beignets salés avec prix unitaires en FCFA, préparés exclusivement sur commande.'],
'/fatayas':['Fatayas sur commande — Le Comptoir des Belles Saveurs','Nos fatayas avec prix unitaires en FCFA, préparés exclusivement sur commande.'],
'/jus':['Jus naturels sur commande — Le Comptoir des Belles Saveurs','Jus de bissap, bouye, gingembre, mangue, ananas et plus encore — en 330 ml et 1,5 L, préparés sur commande.'],
'/evenements':['Commandes pour événements — Le Comptoir des Belles Saveurs','Anniversaires, mariages, baptêmes, cérémonies, réunions : demandez un devis pour vos grandes quantités.'],
'/apropos':['À propos — Le Comptoir des Belles Saveurs','Découvrez Le Comptoir des Belles Saveurs, ses spécialités, ses valeurs et sa démarche de préparation.'],
'/contact':['Contact et commande — Le Comptoir des Belles Saveurs','Passez votre demande de commande par formulaire ou WhatsApp. Confirmation, prix final et délais par l’entreprise.'],
'/legal':['Mentions légales et confidentialité — Le Comptoir des Belles Saveurs','Mentions légales et politique de confidentialité du site.']};
function servePage(res,p,site){const fname=PAGE_FILES[p]||'index.html';fs.readFile(path.join(__dirname,'public',fname),'utf8',(e,h)=>{if(e){res.writeHead(500);return res.end('Erreur')}const[t,d]=META[p]||META['/'];
  h=h.replace(/<title>.*?<\/title>/,()=>'<title>'+t+'</title>').replace(/(<meta name="description" content=")[^"]*/,(m,a)=>a+d).replace(/(<meta property="og:title" content=")[^"]*/,(m,a)=>a+t).replace(/(<meta property="og:description" content=")[^"]*/,(m,a)=>a+d).replace(/<link rel="canonical" href="[^"]*">/,()=>`<link rel="canonical" href="${site}${p}"><meta property="og:url" content="${site}${p}">`);
  if(!h.includes('favicon'))h=h.replace('</head>','<link rel="icon" href="/favicon.svg" type="image/svg+xml"></head>');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(h)})}
// --- API
async function api(req,res,u){const m=req.method,p=u.pathname;await ensure();
  if(m==='GET'&&p==='/api/public'){const[c,pr]=await Promise.all([cfg(),pubProducts()]);return send(res,200,{cfg:{...c,livraison:c.livraison==='1'},products:pr})}
  if(m!=='GET'&&!/^application\/json/.test(req.headers['content-type']||''))return send(res,415,{error:'JSON requis'});
  if(m==='POST'&&p==='/api/orders'){
    if(limited('o'+ip(req),10,600000))return send(res,429,{error:'Trop de demandes. Réessayez dans quelques minutes.'});
    const b=await body(req);if(b.website)return send(res,200,{ok:true,ref:'CBS-0'});
    const o={nom:clean(b.nom,100),tel:clean(b.tel,25),mail:clean(b.mail,120),extra:clean(b.extra,600),date:clean(b.date,10),heure:clean(b.heure,5),type:clean(b.type,40),nb:clean(b.nb,6),budget:clean(b.budget,60),mode:clean(b.mode,20),adr:clean(b.adr,300),msg:clean(b.msg,1000),lines:[]};
    if(o.nom.length<2)return send(res,400,{error:'Nom requis.'});
    if(!/^\+?[\d\s().-]{8,16}$/.test(o.tel))return send(res,400,{error:'Téléphone invalide.'});
    if(o.mail&&!/^\S+@\S+\.\S+$/.test(o.mail))return send(res,400,{error:'E-mail invalide.'});
    if(!/^\d{4}-\d\d-\d\d$/.test(o.date)||o.date<new Date().toISOString().slice(0,10))return send(res,400,{error:'Date invalide.'});
    const kind=b.kind==='evenement'?'evenement':'commande';if(kind==='evenement'&&!o.type)return send(res,400,{error:'Type d’événement requis.'});
    const ls=(Array.isArray(b.lines)?b.lines:[]).slice(0,40),ids=[...new Set(ls.map(l=>Math.floor(+l.id)))];
    if(ids.some(i=>!(i>0&&i<1e12)))return send(res,400,{error:'Produit ou quantité invalide.'});
    const prods=ids.length?await q('GET','products',{query:`?select=*&published=eq.true&id=in.(${ids.join(',')})`}):[],byId=new Map(prods.map(r=>[r.id,r]));
    for(const l of ls){const r=byId.get(Math.floor(+l.id)),qn=Math.floor(+l.qty);
      if(!r||!(qn>=1&&qn<=100000))return send(res,400,{error:'Produit ou quantité invalide.'});if(r.minq&&qn<r.minq)return send(res,400,{error:`Quantité minimale pour ${r.name} : ${r.minq}.`});
      o.lines.push({name:r.name,qty:qn,price:r.price,unit:r.unit})}
    if(!o.lines.length&&!o.extra)return send(res,400,{error:'Indiquez au moins un produit.'});
    const id=(await q('POST','orders',{body:{kind,data:o},prefer:'return=representation'}))[0].id;
    await notify(id,o,kind);return send(res,200,{ok:true,ref:'CBS-'+id})}
  if(m==='POST'&&p==='/api/login'){
    if(limited('l'+ip(req),8,900000))return send(res,429,{error:'Trop de tentatives. Patientez 15 minutes.'});
    const b=await body(req),s=await allS();if(clean(b.user,60)===s.admin_user&&verify(String(b.password||''),s.admin_hash)){res.setHeader('Set-Cookie',cookie(await mk(),28800));return send(res,200,{ok:true})}
    return send(res,401,{error:'Identifiants incorrects.'})}
  if(!p.startsWith('/api/admin/'))return send(res,404,{error:'Introuvable'});
  if(!(await auth(req)))return send(res,401,{error:'Connexion requise.'});
  if(m==='GET'&&p==='/api/admin/data'){const[c,pr,or]=await Promise.all([cfg(),q('GET','products','?select=*&order=id.asc'),q('GET','orders','?select=*&order=id.desc&limit=500')]);
    return send(res,200,{cfg:c,products:pr.map(pub),orders:or.map(r=>({id:r.id,created:r.created,kind:r.kind,status:r.status,...r.data}))})}
  if(m==='GET'&&p==='/api/admin/backup'){const[c,pr,or]=await Promise.all([cfg(),q('GET','products','?select=*&order=id.asc'),q('GET','orders','?select=*&order=id.asc')]);
    res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename="sauvegarde-'+new Date().toISOString().slice(0,10)+'.json"','Cache-Control':'no-store'});return res.end(JSON.stringify({settings:c,products:pr,orders:or},null,1))}
  if(m==='POST'&&p==='/api/admin/logout'){res.setHeader('Set-Cookie',cookie('',0));return send(res,200,{ok:true})}
  const b=await body(req,p.endsWith('upload')?4.2e6:65536);
  if(p==='/api/admin/product'){const cat=['sucres','sales','fatayas','jus'].includes(b.cat)?b.cat:null,name=clean(b.name,120);if(!cat||!name)return send(res,400,{error:'Catégorie et nom requis.'});
    const price=b.price===''||b.price==null?null:Math.round(+b.price),minq=b.min===''||b.min==null?null:Math.round(+b.min);
    if((price!==null&&!(price>=0))||(minq!==null&&!(minq>=1)))return send(res,400,{error:'Prix ou minimum invalide.'});
    const row={cat,name,descr:clean(b.desc,600),price,unit:clean(b.unit,30)||'pièce',minq,delay:clean(b.delay,60)||null,img:okImg(b.img)?b.img:null,published:!!b.published,garniture:clean(b.garniture,200)||null};
    if(b.id)await q('PATCH','products',{query:'?id=eq.'+Math.floor(+b.id),body:row,prefer:'return=minimal'});else await q('POST','products',{body:row,prefer:'return=minimal'});
    pc=null;return send(res,200,{ok:true})}
  if(p==='/api/admin/product-delete'){await q('DELETE','products',{query:'?id=eq.'+Math.floor(+b.id)});pc=null;return send(res,200,{ok:true})}
  if(p==='/api/admin/order-status'){if(!['recue','en_cours','confirmee','refusee'].includes(b.status))return send(res,400,{error:'Statut invalide.'});await q('PATCH','orders',{query:'?id=eq.'+Math.floor(+b.id),body:{status:b.status},prefer:'return=minimal'});return send(res,200,{ok:true})}
  if(p==='/api/admin/settings'){const out={};for(const k of KEYS){if(!(k in b))continue;let v=b[k];
    if(k==='livraison')v=v?'1':'0';
    else if(k==='wa'){v=String(v).replace(/\D/g,'');if(v&&!/^\d{8,15}$/.test(v))return send(res,400,{error:'Numéro WhatsApp invalide.'})}
    else if(k==='frais'){v=String(v??'').trim();if(v&&!(+v>=0))return send(res,400,{error:'Frais de livraison invalides.'})}
    else if(IMG.includes(k)){v=okImg(v)?v:''}
    else if(URLS.includes(k)){v=clean(v,200);if(v&&!/^https?:\/\/[^\s"'<>]+$/.test(v))return send(res,400,{error:'Lien invalide (https://…).'})}
    else v=clean(v,LONG.includes(k)?3000:200);
    out[k]=v}
    await setMany(out);return send(res,200,{ok:true})}
  if(p==='/api/admin/password'){const s=await allS();if(!verify(String(b.old||''),s.admin_hash))return send(res,400,{error:'Ancien mot de passe incorrect.'});if(String(b.new||'').length<10)return send(res,400,{error:'10 caractères minimum.'});
    await setMany({admin_hash:hash(String(b.new))});res.setHeader('Set-Cookie',cookie(await mk(),28800));return send(res,200,{ok:true})}
  if(p==='/api/admin/upload'){const mm=/^data:image\/(png|jpeg|webp);base64,([\w+/=]+)$/.exec(b.data||'');if(!mm)return send(res,400,{error:'Image PNG, JPEG ou WebP requise.'});
    const buf=Buffer.from(mm[2],'base64');if(buf.length>3e6)return send(res,400,{error:'Image trop lourde (3 Mo max).'});
    const f=crypto.randomBytes(8).toString('hex')+{png:'.png',jpeg:'.jpg',webp:'.webp'}[mm[1]];
    const r=await fetch(SB+'/storage/v1/object/uploads/'+f,{method:'POST',headers:hdr({'Content-Type':'image/'+mm[1],'x-upsert':'false'}),body:buf,signal:AbortSignal.timeout(20000)});
    if(!r.ok){console.error('Supabase Storage',r.status,(await r.text()).slice(0,160));return send(res,502,{error:'Téléversement impossible (bucket « uploads » créé ?).'})}
    return send(res,200,{url:IMGP+f})}
  send(res,404,{error:'Introuvable'})}
const server=http.createServer(async(req,res)=>{
  for(const k in HDR)res.setHeader(k,HDR[k]);
  try{const u=new URL(req.url,'http://x'),p=decodeURIComponent(u.pathname);
    if(p.startsWith('/api/'))return await api(req,res,u);
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
    const site=(E.SITE_URL||'').replace(/\/$/,'');
    if(p==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok')}
    if(p==='/'||PAGES.includes(p))return servePage(res,p,site);
    if(p==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end(`User-agent: *\nDisallow: /admin\nDisallow: /api/\n${site?'Sitemap: '+site+'/sitemap.xml\n':''}`)}
    if(p==='/sitemap.xml'){res.writeHead(200,{'Content-Type':'application/xml'});return res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...PAGES].map(x=>`<url><loc>${site}${x}</loc></url>`).join('')}</urlset>`)}
    if(p==='/admin')return serveFile(res,path.join(__dirname,'public/admin.html'),{'Cache-Control':'no-store'});
    const base=path.join(__dirname,'public'),f=path.join(base,p);
    if(!f.startsWith(base+path.sep)||p==='/index.html'){
      fs.readFile(path.join(__dirname,'public/404.html'),(e,d)=>{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(d||'Introuvable')});return}
    serveFile(res,f,{'Cache-Control':'public, max-age=86400'})
  }catch(e){if(!res.headersSent)send(res,e.message==='big'?413:e.message==='json'?400:500,{error:e.message==='big'?'Contenu trop volumineux.':e.message==='json'?'JSON invalide.':'Erreur serveur.'});if(!['big','json'].includes(e.message))console.error('Erreur:',e.message)}});
if(require.main===module)server.listen(PORT,()=>console.log('Site sur http://localhost:'+PORT));
module.exports=server;

