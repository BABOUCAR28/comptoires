// Sauvegarde des données (produits, demandes, réglages) en JSON : node scripts/backup.js [dossier]
// Les photos restent dans Supabase Storage. Le fichier contient des données clients : gardez-le privé.
const fs=require('fs'),path=require('path');
try{for(const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split('\n')){const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2]}}catch{}
const SB=(process.env.SUPABASE_URL||'').replace(/\/$/,''),KEY=process.env.SUPABASE_SERVICE_KEY||'';
if(!SB||!KEY){console.error('SUPABASE_URL et SUPABASE_SERVICE_KEY requis.');process.exit(1)}
const get=async t=>{const r=await fetch(`${SB}/rest/v1/${t}?select=*&order=${t==='settings'?'k':'id'}.asc`,{headers:{apikey:KEY,...(KEY.startsWith('eyJ')?{Authorization:'Bearer '+KEY}:{})}});if(!r.ok)throw new Error(t+' '+r.status);return r.json()};
(async()=>{const dir=path.resolve(process.argv[2]||'sauvegardes');fs.mkdirSync(dir,{recursive:true});
  const f=path.join(dir,'sauvegarde-'+new Date().toISOString().slice(0,10)+'.json');
  fs.writeFileSync(f,JSON.stringify({date:new Date().toISOString(),products:await get('products'),orders:await get('orders'),settings:await get('settings')},null,1));console.log('Sauvegarde créée :',f)})().catch(e=>{console.error('ÉCHEC :',e.message);process.exit(1)});
