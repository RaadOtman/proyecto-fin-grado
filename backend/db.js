const mysql = require("mysql2/promise");

// dotenv ya se carga en index.js antes de importar este módulo,
// así que aquí ya tenemos disponibles las variables de entorno

// Creamos un pool de conexiones a MySQL
// El pool reutiliza conexiones en vez de abrir una nueva cada vez,
// lo cual es más eficiente cuando hay varias peticiones a la vez
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // máximo de conexiones simultáneas
  queueLimit: 0,       // sin límite en la cola de espera
});

module.exports = pool;
