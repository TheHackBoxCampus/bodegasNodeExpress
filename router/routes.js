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
    GROUP BY Producto
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
            let exist = false; 
            for(let property in progress) {
                if(progress[property].producto == data_values[0] && progress[property].bodega == data_values[1]){
                    exist = !exist
                    break; 
                }
            }
            if(exist) {
                let updateCount = /* sql */ `UPDATE inventarios SET cantidad = cantidad + ? WHERE id_producto = ? && id_bodega = ?`;
                connection.query(updateCount, [data_values[2], data_values[0], data_values[1]], (err, progress) => {
                    err ? res.send(err) : res.json({"status": 200, "message": "Se actualizo la cantidad del patron seleccionado"})
                });
            }else {
                let insertPattern = /* sql */ `INSERT INTO inventarios (id_producto, id_bodega, cantidad) VALUES (?, ?, ?)`;
                connection.query(insertPattern, [...data_values], (err, progress) => {
                    err ? res.send(err) : res.json({"status": 200, "message": "Se inserto el nuevo patron"}); 
                })
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