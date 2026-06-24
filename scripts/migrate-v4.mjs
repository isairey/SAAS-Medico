import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sqls = [
  `CREATE TABLE IF NOT EXISTS clinics (
    id int AUTO_INCREMENT NOT NULL,
    slug varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    logoUrl text,
    primaryColor varchar(20) DEFAULT '#10553C',
    secondaryColor varchar(20) DEFAULT '#D4AF37',
    phone varchar(20),
    email varchar(320),
    address text,
    cnpj varchar(20),
    ownerUserId int NOT NULL,
    isActive boolean NOT NULL DEFAULT true,
    plan enum('starter','pro','enterprise') NOT NULL DEFAULT 'starter',
    maxPatients int DEFAULT 50,
    maxConsultants int DEFAULT 3,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT clinics_id PRIMARY KEY(id),
    CONSTRAINT clinics_slug_unique UNIQUE(slug)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 60) + "...");
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_FIELDNAME") {
      console.log("SKIP (already exists):", sql.substring(0, 60));
    } else {
      console.error("ERR:", e.message);
    }
  }
}

await conn.end();
console.log("Migration V4 done.");
