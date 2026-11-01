// Faux Supabase local (PostgREST + Storage minimal) pour tester sans réseau. Ne remplace PAS un test réel.
const http=require('http');
exports.start=(key)=>new Promise(ok=>{
  const T={products:[],orders:[],settings:[]},seq={products:0,orders:0},files=new Map(),log=[];
  const DEF={products:r=>({unit:'pièce',published:true,price:null,minq:null,delay:null,img:null,garniture:null,descr:null,...r}),orders:r=>({created:new Date().toISOString(),status:'recue',...r}),settings:r=>r};
  const REQ={products:['cat','name'],orders:['kind','data'],settings:['k']};
  const match=(row,sp)=>{for(const[k,v]of sp){if(['select','order','limit','on_conflict'].includes(k))continue;
    if(v.startsWith('eq.')){if(String(row[k])!==v.slice(3))return false}else if(v.startsWith('in.(')){if(!v.slice(4,-1).split(',').includes(String(row[k])))return false}else return false}return true};
  const srv=http.createServer((req,res)=>{const u=new URL(req.url,'http://x'),ch=[];req.on('data',d=>ch.push(d));req.on('end',()=>{const raw=Buffer.concat(ch);
    const send=(c,o,h={})=>{res.writeHead(c,{'Content-Type':'application/json',...h});res.end(o===undefined?'':JSON.stringify(o))};
    log.push(req.method+' '+u.pathname+u.search);
    if(u.pathname.startsWith('/storage/v1/object/public/uploads/')){const f=files.get(u.pathname.split('/').pop());if(!f){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':f.type});return res.end(f.buf)}
    if(req.headers.apikey!==key)return send(401,{message:'Invalid API key'});
    if(u.pathname.startsWith('/storage/v1/object/uploads/')){files.set(u.pathname.split('/').pop(),{buf:raw,type:req.headers['content-type']});return send(200,{Key:'uploads/x'})}
    if(u.pathname==='/rest/v1/rpc/fix_sequences')return send(200,null);const m=/^\/rest\/v1\/(\w+)$/.exec(u.pathname);if(!m||!T[m[1]])return send(404,{message:'relation does not exist'});const tb=m[1],pf=req.headers.prefer||'',sp=[...u.searchParams];
    if(req.method==='GET'){let r=T[tb].filter(x=>match(x,sp));const o=u.searchParams.get('order');if(o){const[c,d]=o.split('.');r.sort((a,b)=>(a[c]>b[c]?1:-1)*(d==='desc'?-1:1))}const l=+u.searchParams.get('limit');if(l)r=r.slice(0,l);return send(200,r)}
    if(req.method==='POST'){const b=JSON.parse(raw||'null'),rows=Array.isArray(b)?b:[b],out=[];
      for(const x of rows){const row=DEF[tb](x);for(const c of REQ[tb])if(row[c]==null)return send(400,{code:'23502',message:'null value in column '+c});
        if(tb==='settings'){const i=T.settings.findIndex(s=>s.k===row.k);if(i>=0){if(!pf.includes('merge-duplicates'))return send(409,{code:'23505'});T.settings[i]=row}else T.settings.push(row)}else{row.id=++seq[tb];T[tb].push(row)}out.push(row)}
      return pf.includes('return=representation')?send(201,out):send(201)}
    if(req.method==='PATCH'){const b=JSON.parse(raw);T[tb].filter(x=>match(x,sp)).forEach(x=>Object.assign(x,b));return send(204)}
    if(req.method==='DELETE'){T[tb]=T[tb].filter(x=>!match(x,sp));return send(204)}
    send(405,{})})});
  srv.listen(0,()=>ok({url:'http://127.0.0.1:'+srv.address().port,T,log,close:()=>srv.close()}))});
