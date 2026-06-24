import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sqls = [
  // Add clinicId to patients (nullable for backward compatibility)
  `ALTER TABLE patients ADD COLUMN clinicId int DEFAULT NULL`,
  // Add clinicId to consultants
  `ALTER TABLE consultants ADD COLUMN clinicId int DEFAULT NULL`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 80));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("SKIP (already exists):", sql.substring(0, 80));
    } else {
      console.error("ERR:", e.message);
    }
  }
}

await conn.end();
console.log("Migration V5 done.");
