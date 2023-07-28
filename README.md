## inicialización del proyecto

  Para iniciar el proyecto necesitas clonar el repositorio.

```bash
git clone 'URL' 
cd proyect 
```

  Una vez clonado instala las dependencias.  

> - nanoID
> - Express
> - nodemon
> - dotenv

```bash
npm install
```

 Configuramos el nodemon en el package-json


 ```json
    "scripts": {
    "dev": "nodemon --quiet app.js"
  }
 ```


 ## Configurar Express y lanzar servidor

Para que los endpoints tengan funcionamiento con el `` Router ``  de express, primero tenemos que desplegar un servidor 
```js
import express from 'express';
let app = express();

let config = {
    hostname : "IP",
    port: "port"
};

app.listen(config, () => {
    console.log(`server lanzado en http://${config.hostname}:${config.port}`);
})
```
Configuramos los middleware para que acepte valores json y de texto
```javascript
import express from 'express';
let app = express(); 
// middleware
app.use(express.text())
app.use(express.json())
```
Con el ``Router`` de express en nuestro archivo app.js definimos la ruta principal llamada dbCampus
```javascript
// importamos las rutas de nuestro archivo routes, /* mas informacion mas adelante */
import express from 'express';
import router from './router/routes.js'
let app = express(); 

app.use("dbCampus", router); 
```


## Conexión con base de datos MYSQL

Para la conexion se utilizan variables de entorno para administrar credenciales

- El archivo .env cuenta con estos datos 
- Archivo de guia .env-example

Para su uso se configura el archivo .env

```markdown
SERVER={"hostname": "...", "port": "..."}

CONNECT={"host": "...", "user": "...", "password": "#", "database": "..."}
```
- Para que los puntos de acceso no tengan errores y pueda ejecutar las operaciones de forma correcta, debes quitarle el ``.example`` al ``.env`` es decir el archivo debe quedar en la raiz ``/`` de tu proyecto con el nombre ``.env``

```markdown
.env.example => X
.env => ✔ 
``` 
- En el archivo database importas la libreria `` dotevn `` para el reconocimiento de las variables definidas con anterioridad

- importas mysql para efectuar la conexión

- Ejecutas el metodo ``config()`` de la libreria ``dotenv``

- El process.env reconoce las variables de entorno, una vez ya ejecutado el metodo ``config()``, el process.env.config es el nombre del json definido en el archivo .env, en caso de cambiar el nombre deberas cambiarlo tambien en la variable

- En mysql con ``createConnection()`` lanzas la conexion, le pasas las variables previamente definidas ``createConnection(vars)`` y ejecutas un callback a la variables de conexion creada con el metodo ``connect()`` para retornar un valor en caso de que se conecte y de que NO se conecte.

- Exportas la conexion para ejecutarla en el router
```javascript
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config() // variables de entorno
let variables = process.env.config 

let connection = mysql.createConnection(variables); 
connection.connect((err) =>  err ? console.log(err) : console.log("connect!!!!!")); 

export default connection; 
```

## Enrutado con Router / Express 

### Consultas HTTP en Router / Express

Para ejecutar esta consultas:
- Importar el MODULO ``Router`` de express
- importar la conexión exportada con anterioridad

En mi caso utilice la libreria nanoID para ids aleatorias no repetibles, puedes utilizar mas metodos u otras librerias para hacer este paso (opcional).
- Importamos el modulo ``customAlphabet`` de nanoID
- definimos el  ``Router`` en una variable
- Efectuamos lógica para las consultas ``http``

```javascript
import { Router } from "express";
import { customAlphabet } from "nanoid";
import connection from "./config/database.js";

let router = Router(); 

// diferentes metodos get, post, put, delete
router.get(/*query*/, (req, res) => {
    err ? 
        res
          .send(err)
        :
         // logica de consulta
} )
```

Se hicieron diferentes endpoints para las tablas: 
- Bodegas
- Historiales
- Inventarios
- Productos
- Usuarios

Puntos a tener en consideración para la creación de cada Endpoint
```txt
1 Realizar un EndPolnt que permita listar todas las bodegas ordenadas alfabéticamente.

• Endpoint -> dbCampus/bodegas -> GET

2 Realizar un EndPolnt que permita crear una bodegas.(agregar en los
comentarios de la función los datos de entrada).

• Endpoint -> dbCampus/bodegas -> POST

3 Realizar un EndPoint que permita listar todos los productos en orden
descendente por el campo "Total".

• El campo "Total" es la cantidad de unidades que la empresa tiene
de este producto, considerando la unión de todas las bodegas, es
decir que el dato como tal no existe en la base de datos,sino se debe
calcular. Si la Bodega A tiene 1O unidades, la Bodega B tiene 5
unidades y la Bodega C tiene 3 unidades. Total= 18.

• Endpoint -> dbCampus/productos/orden -> GET

4 Realizar un EndPoint que permita insertar un productos y a su vez asigne
una cantidad inicial del mismo en la tabla inventarios en una de las bodegas
por default.

• Endpoint -> dbCampus/productos -> POST

5 Realizar un EndPoint que permita insertar registros en la tabla de
inventarios, los parámetros de entrada deben ser
(id_producto,id_bodega,cantidad).

• La tabla no puede repetir la combinación de Bodega I Producto Por lo
tanto será necesario validar si el ingreso que se está realizado ya
existe o es una combinación totalmente nueva.

• Si es una combinación totalmente nueva, se debe hacer un lnsert,
considerando los datos ingresados.

• Si es una combinación existente, entonces se debe hacer un Update
a este registro, considerando la suma de la cantidad existente con la
cantidad nueva.

• Endpoint -> dbCampus/inventarios -> POST

6 Realizar un EndPolnt que permita Trasladar un producto de una bodega a otra

• Se debe validar que la cantidad de unidades que se pretende sacar
de una Bodega, sea posible, ya que si tengo 1O unidades en la
Bodega A, no podré sacar de ella 20 unidades. Esta acción debe
generar una alerta e impedir el registro.

• Para la afectación de las tablas se debe considerar que del Origen debo
restar la cantidad,y al destino le debo sumar la cantidad.
Por ejemplo: Bodega A = 1O unidades. Bodega B = 1O unidades. Haré
el traslado de 5 unidades desde la Bodega A para la Bodega B, Por lo cual el resultado será hacer Updated a los dos registros en inventarios:
Bodega A = 5 unidades. Bodega B = 15 unidades. Además hacer un lnsert con toda la información en la tabla de historiales.

• Endpoint dbCampus/productos/move -> POST
```
Se dejaron claros los parametros que cada endpoint debe tener a consideración.

## Funcionamiento de los endpoints 

> - ``dbCampus/bodegas -> GET``

En este caso solo retorna las bodegas ordenadas de forma alfabetica, No es necesario enviar data ya que hace una consulta de tipo GET


> - ``dbCampus/bodegas -> POST``

Para la inserción de datos en el endpoints , la data debe cumplir con los siguientes items

``` json
{
    "id": 1,
    "nombre": "...",
    "id_responsable": 2,
    "estado": 1,
    "creado_por": "person",
    "actualizado_por": "person",
	"creado_en": "timestamp",
    "actualizado_en": "timestamp",
    "eliminado_por": "timestamp"
}
```

- Es necesario enviar los parametros tal cual.

- SI no cumple los parámetros, la inserción no sera efectuada

> - ``dbCampus/producto/orden -> GET``

En este caso el endpoint solo ejecuta un inner join el cual reune la informacion y suma la cantidad de productos que hay por Bodega

- No es necesario enviar data

> - ```dbCampus/productos -> POST``

Para la inserción de datos en el endpoint, la data debe cumplir unos requisitos en los items:

```json
{
    "id": 1,
    "nombre": "...",
    "descripcion": "...",
    "estado": 1,
    "creado_por": "...",
    "actualiado_por": "...",
    "creado_en": "timestamp",
    "actualizado_en": "timestamp",
    "eliminado_por": "timestamp"
}
```

- La id no debe estar duplicada
- tipo de datos correctos
- valores nulos a parametros principales denegados
- Longitud de parametros necesaria

Después de cumplir los requisitos:

- Se hara la inserción 

- Se crearan valores por defecto 

  

> - ``dbCampus/inventarios -> POST``

En el siguiente endpoint hay 2 posibilidades de envió de data:

- Inserciones 

  Para este caso los datos deben ir distribuidos de la siguiente manera

```json
{
    "id": 1,
    "producto": 12,
    "bodega": 3,
    "cantidad": 133
}
```

​		- Punto a tener en cuenta:

​				- El producto o la id del producto debe tener existencia

​				- La id de bodega debe tener existencia

​				- Si detecta que el patron ya existe pasa al segundo caso, de lo contrario hace la inserción

- Actualizaciones

​		Para este caso los datos deben ir distribuidos de la siguiente manera: 

```json
{
    "producto": 12,
    "bodega": 3,
    "cantidad": 133
}
```

- La data no necesita la id, ya que el patron existe
- Si el patron no existe, pasas al primero caso
- Si los parámetros son correctos se actualizara el registro y sumara la cantidad

> - ``dbCampus/productos/move -> POST``

Los parámetros de entrada deben ir ordenados de la siguiente forma:

```json
{
    "id": 1,
    "bodega_id": 12,
    "destino_bodega_id": 122,
    "cantidad": 100
}
```

Los datos son proporcionados para trasladar productos de una tabla a otra:

- id = la id del producto
- bodega_id = la id de la bodega origen
- destino_bodega_id = la id de la bodega destino
- cantidad = la cantidad que se desea transladar

Cosas a tener en cuenta:

- Aquí se maneja el stock quiere decir que valida si la cantidad del producto origen es menor o igual a lo que hay de lo contrario no será posible trasladar el producto

- Todos los campos de id deben tener una existencia dentro de la base de datos de lo contrario la consulta falla

- Si el producto no existe en las bodegas reportara que se debe colocar campos que tenga correlación con la tabla 

