// Point d'entrée Vercel : toutes les requêtes passent par le serveur de server.js.
const server=require('../server.js');
module.exports=(req,res)=>server.emit('request',req,res);
