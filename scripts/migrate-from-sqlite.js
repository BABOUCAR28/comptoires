// Migre l'ancienne base locale (data/site.db + data/uploads) vers Supabase.
// À lancer UNE FOIS, depuis votre ordinateur, AVANT le premier démarrage en ligne :
//   node --experimental-sqlite --no-warnings scripts/migrate-from-sqlite.js [dossier-data] [--dry]
const fs=require('fs'),path=require('path');
try{for(const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2]}}catch{}
const args=process.argv.slice(2),DRY=args.includes('--dry'),D=path.resolve(args.find(a=>!a.startsWith('--'))||path.join(__dirname,'..','data'));
const SB=(process.env.SUPABASE_URL||'').replace(/\/$/,''),KEY=process.env.SUPABASE_SERVICE_KEY||'';
if(!DRY&&(!SB||!KEY)){console.error('SUPABASE_URL et SUPABASE_SERVICE_KEY requis (fichier .env).');process.exit(1)}
let DatabaseSync;try{({DatabaseSync}=require('node:sqlite'))}catch{console.error('Lancez avec : node --experimental-sqlite scripts/migrate-from-sqlite.js');process.exit(1)}
const hdr=x=>({apikey:KEY,...(KEY.startsWith('eyJ')?{Authorization:'Bearer '+KEY}:{}),...x});
async function rest(method,p,body,prefer){const r=await fetch(SB+'/rest/v1/'+p,{method,headers:hdr({'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})}),body:body===undefined?undefined:JSON.stringify(body)});const t=await r.text();if(!r.ok)throw new Error(`${method} ${p} → ${r.status} ${t.slice(0,200)}`);return t?JSON.parse(t):null}
(async()=>{
  const db=new DatabaseSync(path.join(D,'site.db'),{readOnly:true});
  const products=db.prepare('SELECT * FROM products ORDER BY id').all(),orders=db.prepare('SELECT * FROM orders ORDER BY id').all(),settings=db.prepare('SELECT * FROM settings').all();
  const files=fs.existsSync(path.join(D,'uploads'))?fs.readdirSync(path.join(D,'uploads')):[];
  console.log(`Trouvé : ${products.length} produits, ${orders.length} demandes, ${settings.length} réglages, ${files.length} photos.`);
  if(DRY){console.log('(--dry : rien n’a été envoyé)');return}
  for(const t of['products','orders']){if((await rest('GET',t+'?select=id&limit=1')).length){console.error(`La table « ${t} » de Supabase n’est pas vide : migration annulée pour éviter les doublons. Videz-la (SQL Editor : truncate table ${t} restart identity;) puis relancez.`);process.exit(1)}}
  const map={},type={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
  for(const f of files){const ct=type[path.extname(f).toLowerCase()];if(!ct)continue;
    const r=await fetch(SB+'/storage/v1/object/uploads/'+f,{method:'POST',headers:hdr({'Content-Type':ct,'x-upsert':'true'}),body:fs.readFileSync(path.join(D,'uploads',f))});
    if(!r.ok)throw new Error('Photo '+f+' → '+r.status+' '+(await r.text()).slice(0,160)+' (bucket « uploads » créé ? schema.sql exécuté ?)');
    map['/uploads/'+f]=SB+'/storage/v1/object/public/uploads/'+f;console.log('Photo envoyée :',f)}
  const fix=v=>map[v]||v;
  await rest('POST','settings?on_conflict=k',settings.map(s=>({k:s.k,v:fix(s.v)})),'resolution=merge-duplicates,return=minimal');
  await rest('POST','products',products.map(p=>({id:p.id,cat:p.cat,name:p.name,descr:p.descr,price:p.price,unit:p.unit,minq:p.minq,delay:p.delay,garniture:p.garniture,img:p.img?fix(p.img):null,published:!!p.published})),'return=minimal');
  for(let i=0;i<orders.length;i+=50)await rest('POST','orders',orders.slice(i,i+50).map(o=>({id:o.id,created:o.created,kind:o.kind,status:o.status,data:JSON.parse(o.data)})),'return=minimal');
  try{await rest('POST','rpc/fix_sequences',{})}catch(e){console.warn('⚠ fix_sequences a échoué ('+e.message+'). Exécutez dans le SQL Editor : select fix_sequences();')}
  console.log('Migration terminée. Réglages (dont le mot de passe admin) conservés.');
})().catch(e=>{console.error('ÉCHEC :',e.message);process.exit(1)});
