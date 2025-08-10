const mysql = require('mysql2');

require('dotenv').config();

const conexao = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testa a conexão
conexao.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados com sucesso!');
    connection.release();
  }
});

module.exports = conexao;
