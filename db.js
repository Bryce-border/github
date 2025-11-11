const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456', // 请修改为你的MySQL密码
  database: 'travel_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 使用Promise包装
const promisePool = pool.promise();

module.exports = promisePool;