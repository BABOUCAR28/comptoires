// Vérifie l'adaptateur Vercel, y compris quand Vercel fournit déjà req.body : node tests/vercel.js
const http=require('http'),mockSB=require('./mock-supabase.js');
mockSB.start('k').then(sb=>{Object.assign(process.env,{SUPABASE_URL:sb.url,SUPABASE_SERVICE_KEY:'k',SESSION_SECRET:'s',ADMIN_PASSWORD:'motdepasse-test-123'});
 const h=require('../api/index.js');let ok=0,ko=0;const t=(n,c)=>{c?ok++:ko++;console.log((c?'OK   ':'ECHEC ')+n)};
 const srv=http.createServer((req,res)=>{ // simule les "helpers" Vercel : req.body analysé, flux déjà consommé
  if(req.method==='POST'){let b='';req.on('data',d=>b+=d);req.on('end',()=>{try{req.body=JSON.parse(b||'{}')}catch{req.body={}};req.removeAllListeners('data');req.removeAllListeners('end');h(req,res)})}else h(req,res)});
 srv.listen(0,async()=>{const B='http://localhost:'+srv.address().port,J={'Content-Type':'application/json'};
  t('page d’accueil via adaptateur',(await fetch(B+'/')).status===200);t('/sucres',(await fetch(B+'/sucres')).status===200);
  const pub=await (await fetch(B+'/api/public')).json();t('catalogue via adaptateur',pub.products.length>0);
  const r=await fetch(B+'/api/orders',{method:'POST',headers:J,body:JSON.stringify({kind:'commande',nom:'Awa Diop',tel:'+221770000000',date:'2099-01-01',lines:[{id:pub.products[0].id,qty:2}]})});
  t('commande avec req.body fourni par Vercel',(await r.json()).ok===true&&sb.T.orders.length===1);
  const l=await fetch(B+'/api/login',{method:'POST',headers:J,body:JSON.stringify({user:'admin',password:'motdepasse-test-123'})});t('connexion admin',l.status===200);
  console.log(`\n${ok} réussis, ${ko} échecs`);process.exit(ko?1:0)})});
