import mysql from 'mysql'; 
import dotenv from 'dotenv'; 
// use globals variables
dotenv.config(); 
let vars = JSON.parse(process.env.config); 

// connection from database
let connection = mysql.createConnection(vars); 
connection.connect((err) => err ? console.log("el error: es \n\n" + err) : console.log('connect!!!')); 

export default connection; 