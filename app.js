import express from 'express';
import routes from './router/routes.js';
// app instanceof express
const app = express(); 

let configServer = {
    hostname: "127.221.06",
    port: 5501
}
// middleware
app.use(express.json()); 
app.use(express.text()); 

// use routes
app.use('/dbCampus', routes); 

// server listen
app.listen(configServer, () => {
    console.log("Server corriendo!! en: http://" + configServer.hostname+":"+configServer.port); 
})