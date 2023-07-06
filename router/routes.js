import {Router} from 'express'; 
import connection from '../config/database.js';

let router = Router(); 

// Get data from the Warehouses/bodegas table alphabetically
router.get('/bodegas', (req, res) => {
    let query = 'SELECT * FROM bodegas ORDER BY nombre ASC'; 
    connection.query(query, (err, progress) => {
        err ? res.send(err) : res.json(progress); 
    }) 
})

// Get data from the products in order specific for Store or WareHouse
router.get('/productosOrden', (req, res) => {
    let query = /* sql */`
    SELECT p.nombre AS Producto,
            (
             SELECT SUM(i.cantidad) 
             FROM inventarios AS i 
             WHERE p.id = i.id_producto
            ) AS Total,
            (
             SELECT b.nombre 
             FROM bodegas AS b 
             WHERE b.id = (
                 SELECT i.id_bodega 
                 FROM inventarios AS i 
                 WHERE i.id_producto = p.id 
                 LIMIT 1
             )
         ) AS Bodega
    FROM productos AS p
    HAVING Total IS NOT NULL 
    ORDER BY Total DESC`;
    connection.query(query, (err, progress) => err ? res.send(err) : res.json(progress));
})

// post data from inventory | patterns 
router.post('/inventarios', (req, res) => {
    let data = req.body; 
    let data_values = Object.values(data); 
    let gettingPattern = /* sql */ `SELECT i.id_producto as producto, i.id_bodega as bodega FROM inventarios as i`;    
    connection.query(gettingPattern, (err, progress) => {
        if(err) res.send(err)
        else {
            if(Object.entries(data).length <= 0 || data_values.length == 0) {
                res.status(500).send({"message": "Por favor envie data"});
            }else {
                if(data_values.length <= 2 || Object.entries(data).length <= 2){
                    res.status(500).send({"message": "La data esta incompleta"})
                }else {
                    let typeofincorrect = false;
                    for(let x = 0; x < data_values.length; x++){
                        if(typeof data_values[x] != "number") typeofincorrect = true;
                    }
                    if(typeofincorrect) {
                        res.status(500).send({"message": "Verifique el tipo de dato de los items"}); 
                    }else {
                        let exist = false; 
                        for(let property in progress) {
                            if(progress[property].producto == data["producto"] && progress[property].bodega == data["bodega"]){
                                exist = !exist
                                break; 
                            }
                        }
                        if(exist) {
                            if(data["id"]){
                                res.status(500).send({"message": "El patron existe, coloca el patron y la cantidad, sin la ID"});
                            }else {
                                let updateCount = /* sql */ `UPDATE inventarios SET cantidad = cantidad + ? WHERE id_producto = ? && id_bodega = ?`;
                                connection.query(updateCount, [data_values[2], data_values[0], data_values[1]], (err, progress) => {
                                    err ? res.send(err) : res.json({"status": 200, "message": "Se actualizo la cantidad del patron seleccionado"})
                                });
                            }
                        }else {
                            if(data["id"] != undefined){
                                let insertPattern = /* sql */ `INSERT INTO inventarios (id, id_producto, id_bodega, cantidad) VALUES (?, ?, ?, ?)`;
                                connection.query(insertPattern, [...data_values], (err, progress) => {
                                if(err){
                                    if(err.errno == 1062) {
                                        res.json({"message": "La id que envio ya existe ingrese una nueva!!"})
                                    }
                                }else {
                                    res.json({"status": 200, "message": "Se inserto el nuevo patron"})
                                }
                                }); 
                            }else res.status(500).send({"message": "El patron no existe, coloca el ID del campo"}); 
                        }
                    }
                }
            }
        }
    })
})



// post data from the warehouses table 
router.post('/bodegas', (req, res) => {
    let data = req.body; 
    let data_values = Object.values(data);
    let query = 'INSERT INTO bodegas (id, nombre, id_responsable, estado, creado_por, actualizado_por, creado_en, actualizado_en, eliminado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'; 
    connection.query(query, data_values, (err) => err ? res.send(err) : res.send({'status': 200, 'message': 'Data saved'})); 
})


export default router; 