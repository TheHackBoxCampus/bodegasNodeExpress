import { Router } from "express";
import { customAlphabet } from "nanoid";
import connection from "../config/database.js";

let router = Router();

// Get data from the Warehouses/bodegas table alphabetically
router.get("/bodegas", (req, res) => {
  let query = "SELECT * FROM bodegas ORDER BY nombre ASC";
  connection.query(query, (err, progress) => {
    err ? res.send(err) : res.json(progress);
  });
});

// Get data from the products in order specific for Store or WareHouse
router.get("/productos/orden", (req, res) => {
  let query = /* sql */ `
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
  connection.query(query, (err, progress) =>
    err ? res.send(err) : res.json(progress)
  );
});

// post data from inventory | patterns
router.post("/inventarios", (req, res) => {
  let data = req.body;
  let data_values = Object.values(data);
  let gettingPattern = /* sql */ `SELECT i.id_producto as producto, i.id_bodega as bodega FROM inventarios as i`;
  connection.query(gettingPattern, (err, progress) => {
    if (err) res.send(err);
    else {
      if (Object.entries(data).length <= 0 || data_values.length == 0) {
        res
          .status(500)
          .send({
            message: "El body no tiene información, por favor envie datos!!",
          });
      } else {
        if (data_values.length <= 2 || Object.entries(data).length <= 2) {
          res.status(500).send({ message: "La data esta incompleta" });
        } else {
          let typeofincorrect = false;
          for (let x = 0; x < data_values.length; x++) {
            if (typeof data_values[x] != "number") typeofincorrect = true;
          }
          if (typeofincorrect) {
            res
              .status(500)
              .send({ message: "Verifique el tipo de dato de los items" });
          } else {
            let exist = false;
            for (let property in progress) {
              if (
                progress[property].producto == data["producto"] &&
                progress[property].bodega == data["bodega"]
              ) {
                exist = !exist;
                break;
              }
            }
            if (exist) {
              if (data["id"]) {
                res
                  .status(500)
                  .send({
                    message:
                      "El patron existe, coloca el patron y la cantidad, sin la ID",
                  });
              } else {
                let updateCount = /* sql */ `UPDATE inventarios SET cantidad = cantidad + ? WHERE id_producto = ? && id_bodega = ?`;
                connection.query(
                  updateCount,
                  [data_values[2], data_values[0], data_values[1]],
                  (err, progress) => {
                    err
                      ? res.send(err)
                      : res.json({
                          status: 200,
                          message:
                            "Se actualizo la cantidad del patron seleccionado",
                        });
                  }
                );
              }
            } else {
              if (data["id"] != undefined) {
                let insertPattern = /* sql */ `INSERT INTO inventarios (id, id_producto, id_bodega, cantidad) VALUES (?, ?, ?, ?)`;
                connection.query(
                  insertPattern,
                  [...data_values],
                  (err, progress) => {
                    if (err) {
                      if (err.errno == 1062) {
                        res.json({
                          message:
                            "La id que envio ya existe ingrese una nueva!!",
                        });
                      }
                    } else {
                      res.json({
                        status: 200,
                        message: "Se inserto el nuevo patron",
                      });
                    }
                  }
                );
              } else
                res
                  .status(500)
                  .send({
                    message: "El patron no existe, coloca el ID del campo",
                  });
            }
          }
        }
      }
    }
  });
});

// post data from productos and values for default in inventarios

router.post("/productos", (req, res) => {
  let data = req.body;
  let data_values = Object.values(data);
  let insertProducts = /* sql */ `INSERT INTO productos (id, nombre, descripcion, estado, creado_por, actualizado_por, creado_en, actualizado_en, eliminado_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  if (Object.entries(data).length <= 0) {
    res
      .status(500)
      .json({
        message: "El body no tiene información, por favor envie datos!!",
      });
  } else {
    if (data["id"]) {
      if (
        data["id"] == data_values[0] &&
        Object.entries(data_values).length == 9
      ) {
        let non_compliant = false;
        if (
          typeof data["nombre"] != "string" ||
          typeof data["descripcion"] != "string" ||
          typeof data["estado"] != "number" ||
          typeof data["id"] != "number"
        ) {
          non_compliant = !non_compliant;
        }
        if (non_compliant) {
          res
            .status(500)
            .send({ message: "algunos campos no cumplen con el tipo de dato" });
        } else {
          let whatWareHouses = /* sql */ `SELECT b.id FROM bodegas AS b`;
          connection.query(insertProducts, data_values, (err, progress) => {
            if (err) {
              err.errno == 1062
                ? res
                    .status(500)
                    .send({ message: "La id esta duplicada, envia otra!!" })
                : res.send(err);
            } else {
              connection.query(whatWareHouses, (err, arr) => {
                if (err) res.send(err);
                else {
                  let amountInitial = Math.floor(Math.random() * 100);
                  let ids = Object.values(arr);
                  // select random warehouse
                  let randomIDWareHouse =
                    ids[Math.floor(Math.random() * ids.length)];
                  let convertId = parseInt(
                    JSON.stringify(randomIDWareHouse["id"])
                  );
                  // create Random Id
                  let randomIDI = "";
                  for (let i = 0; i < 5; i++) {
                    let charactersId = Math.floor(Math.random() * 10);
                    randomIDI += charactersId.toString();
                  }
                  let valuesDefault = [
                    parseInt(randomIDI),
                    convertId,
                    data_values[0],
                    amountInitial,
                  ];
                  let insertValueDefault = /* sql */ `INSERT INTO inventarios (id, id_bodega, id_producto, cantidad) VALUES (?, ?, ?, ?)`;
                  connection.query(
                    insertValueDefault,
                    valuesDefault,
                    (err, results) => {
                      if (err) res.send(err);
                      else {
                        res
                          .status(200)
                          .send({
                            message: "Los datos se enviaron correctamente",
                          });
                      }
                    }
                  );
                }
              });
            }
          });
        }
      } else if (Object.entries(data_values).length < 9)
        res
          .status(500)
          .send({ message: "La informacion que mando esta incompleta!" });
      else
        res
          .status(500)
          .send({
            message: "la id que esta enviando no esta en el lugar correcto",
          });
    } else
      res
        .status(500)
        .send({ message: "El registro no contiene una ID, envia una ID!!" });
  }
});

// post data in table productos for move of warehouse
router.post("/productos/move", (req, res) => {
  let data = req.body;
  let searchAmount = /* sql */ `
        SELECT b.id AS id, 
               i.id AS id_inventario,
               i.cantidad AS total, 
               p.nombre AS producto,
               p.id AS id_producto
        FROM inventarios AS i 
        INNER JOIN bodegas AS b ON i.id_bodega = b.id  
        INNER JOIN productos AS p ON i.id_producto = p.id 
        ORDER BY Total DESC
    `;

  if (Object.entries(data).length == 0) {
    res
      .status(500)
      .send({
        message: "El body no tiene información, por favor envie datos!!",
      });
  } else {
    if (data["producto"]) {
      res
        .status(500)
        .send({
          message: "la data debe contener la id del producto, no el nombre!!",
        });
    } else {
      if (Object.entries(data).length < 4)
        res.status(500).send({ message: "La data esta incompleta!" });
      else {
        connection.query(searchAmount, (err, results) => {
          let coincidenceWarehouseExist = false;
          let non_destinyWarehouseExist = false;
          let non_propertyWarehouseExist = false;
          let countElderJust = false;
          let productExistInWarehouse = false; 
          let historyIdInventory = Number(); 
          let options = ["id", "bodega_id", "destino_bodega_id", "cantidad"];

          for (let property in results) {
            for (let x = 0; x < options.length; x++) {
              let prop = options[x];
              if (data[prop] == undefined) {
                non_propertyWarehouseExist = true;
                break;
              }
            }
            if (
              data["bodega_id"] == results[property].id &&
              data["id"] == results[property].id_producto
            ) {
              coincidenceWarehouseExist = true;
              if (data["cantidad"] <= results[property].total)
                countElderJust = true;
            }

            if (
              results[property].id == data["destino_bodega_id"] &&
              results[property].id_producto == data["id"]
            ) {
              productExistInWarehouse = true
              historyIdInventory = results[property].id_inventario
            }

            if (data["destino_bodega_id"] == results[property].id) {
              non_destinyWarehouseExist = true;
            }
          }

          if (non_propertyWarehouseExist)
            res
              .status(500)
              .send({
                message:
                  "Lea la documentación para el nombre de las llaves de la data!",
              });
          else if (coincidenceWarehouseExist) {
            if (non_destinyWarehouseExist) {
              if (countElderJust) {
                if (productExistInWarehouse) {
                  let updaterDataProductStore = [
                    data["cantidad"],
                    data["id"],
                    data["bodega_id"],
                  ];
                  let updateRegisterProduct = /* sql */ `UPDATE inventarios SET cantidad = cantidad - ? WHERE id_producto = ? AND id_bodega = ?`;
                  connection.query(
                    updateRegisterProduct,
                    updaterDataProductStore,
                    (err, results) => {
                      if (err) res.status(500).send(err);
                      else {
                        let updaterDataWarehouse = [
                          data["cantidad"],
                          data["id"],
                          data["destino_bodega_id"],
                        ];
                        let updateWarehouse = /* sql */ `UPDATE inventarios SET cantidad = cantidad + ? WHERE id_producto = ? AND id_bodega = ?`;
                        connection.query(
                          updateWarehouse,
                          updaterDataWarehouse,
                          (err) => {
                            if (err) {
                              res
                                .status(500)
                                .send(err)
                            } else {
                               let generateId = customAlphabet('0123456789', 5); 
                               let randomIDHistory = generateId(); 
                               let insertHistory = /* sql */ `INSERT INTO historiales (id, cantidad, id_bodega_origen, id_bodega_destino, id_inventario) VALUES (?, ?, ?, ?, ?)`;
                               let insertDataHistory = [
                                  randomIDHistory, 
                                  data["cantidad"], 
                                  data["bodega_id"], 
                                  data["destino_bodega_id"], 
                                  historyIdInventory];
                               connection.query(
                                insertHistory, 
                                insertDataHistory, 
                                (err) => {
                                  err 
                                      ? res.status(500).send(err)
                                      : res
                                          .status(200)
                                          .send({
                                              message: "los datos se transladaron correctamente",
                                              status: 200,
                                      });
                                 })
                            }
                          }
                        );
                      }
                    }
                  );
                } else {
                    res 
                      .status(500)
                      .send({
                        message: "El producto que seleccionaste no existe dentro de esa bodega destino!"
                      })
                }
              
                 
              } else {
                res
                  .status(500)
                  .send({
                    message:
                      "La cantidad que se envio es mayor a la que se registro en la base de datos!",
                  });
              }
            } else {
              res
                .status(500)
                .send({
                  message:
                    "la bodega destino no tiene existencia!, ingresa una correcta",
                });
            }
          } else
            res
              .status(500)
              .send({
                message: "La bodega no existe, ingrese una bodega existente",
              });
        });
      }
    }
  }
});

// post data from the warehouses table
router.post("/bodegas", (req, res) => {
  let data = req.body;
  let data_values = Object.values(data);
  let query =
    "INSERT INTO bodegas (id, nombre, id_responsable, estado, creado_por, actualizado_por, creado_en, actualizado_en, eliminado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(query, data_values, (err) =>
    err ? res.send(err) : res.send({ status: 200, message: "Data saved" })
  );
});

export default router;
