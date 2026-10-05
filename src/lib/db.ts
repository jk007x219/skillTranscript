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

    // สำคัญมาก:
    // MySQL DATETIME/TIMESTAMP/DATE/TIME ไม่มี timezone
    // ต้องคืนค่าเป็น string ตรง ๆ
    // ไม่ให้ mysql2 แปลงเป็น JavaScript Date
    //
    // หมายเหตุ:
    // - ถ้าใช้ array เช่น ["DATETIME"] บาง environment/version
    //   การ match type อาจไม่ทำงาน แล้วค่ากลับเป็น Date
    // - ใช้ true เพื่อบังคับทุก type ให้ปลอดภัยที่สุด
    dateStrings: true,

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