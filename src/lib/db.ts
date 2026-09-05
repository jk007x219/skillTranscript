import "dotenv/config";
import mysql from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

export const pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true,
    multipleStatements: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = pool;
}

pool.on("connection", (connection) => {
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});
