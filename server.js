const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const auth = require('./routes/auth');
app.use('/auth', auth);

const inventario = require('./routes/inventario');
app.use('/inventario', inventario);

const servicios = require('./routes/servicios');
app.use('/servicios', servicios);

const ordenes = require('./routes/ordenes');
app.use('/ordenes', ordenes);

const mensajes = require('./routes/mensajes');
app.use('/mensajes', mensajes);

const usuarios = require('./routes/usuarios');
app.use('/usuarios', usuarios);

const emailRoutes = require('./routes/email');
app.use('/email', emailRoutes);

app.listen(3000, () => {
    console.log("API NODOX corriendo en puerto 3000");
});
