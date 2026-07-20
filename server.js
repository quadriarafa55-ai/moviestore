// Moviewstore secure AI image endpoint
// Run with: HF_TOKEN=your_token node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8787;
const MODEL = process.env.HF_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';
const token = process.env.HF_TOKEN;
const appDir = __dirname;
function json(res, code, data){res.writeHead(code, {'content-type':'application/json'});res.end(JSON.stringify(data));}
const server=http.createServer(async (req,res)=>{
  if(req.url==='/' || req.url==='/index.html'){res.writeHead(200,{'content-type':'text/html'});return res.end(fs.readFileSync(path.join(appDir,'index.html')))}
  if(req.url==='/api/generate' && req.method==='POST'){
    if(!token)return json(res,503,{error:'AI engine is not configured on the server yet.'});
    let body=''; req.on('data',c=>body+=c); req.on('end',async()=>{
      try { const {prompt}=JSON.parse(body); if(!prompt||prompt.length>1200)return json(res,400,{error:'Enter a valid prompt.'});
        const r=await fetch(`https://api-inference.huggingface.co/models/${MODEL}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({inputs:prompt})});
        if(!r.ok){const t=await r.text();return json(res,r.status,{error:'The AI engine could not generate this request.',detail:t.slice(0,300)})}
        const b=Buffer.from(await r.arrayBuffer()); res.writeHead(200,{'content-type':'image/png','cache-control':'no-store'});res.end(b);
      } catch(e){json(res,500,{error:'Generation failed. Please try again.'})}
    }); return;
  }
  res.writeHead(404);res.end('Not found');
});
// Render requires the service to bind on all interfaces and its assigned PORT.
server.listen(Number(PORT), '0.0.0.0', ()=>console.log(`Moviewstore server listening on ${PORT}`));
