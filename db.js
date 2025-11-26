const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',     
  database: 'sorteio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exporta versão com promise para usar async/await
const db = pool.promise();

module.exports = db;