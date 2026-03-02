
const mysql = require('mysql2');

const connection = mysql.createPool({
    host: 'localhost',       
    user: 'root',           
    password: 'nanco123',     
    database: 'nodox_db',     
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


connection.getConnection((err, conn) => {
    if (err) {
        console.error(" Error conectando a MySQL (Servidor):", err);
    } else {
        console.log(" Servidor conectado a MySQL (Pool OK)");
        conn.release();
    }
});

module.exports = connection;
