// Migration V6: Add clinicId to anamnesis_questions, prescriptions, daily_reports, alerts
import mysql from "mysql2/promise";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  const conn = await mysql.createConnection(url);
  console.log("Connected to database");

  const alterations = [
    { table: "anamnesis_questions", column: "clinicId", type: "int DEFAULT NULL" },
    { table: "prescriptions", column: "clinicId", type: "int DEFAULT NULL" },
    { table: "daily_reports", column: "clinicId", type: "int DEFAULT NULL" },
    { table: "alerts", column: "clinicId", type: "int DEFAULT NULL" },
  ];

  for (const alt of alterations) {
    try {
      await conn.execute(`ALTER TABLE ${alt.table} ADD COLUMN ${alt.column} ${alt.type}`);
      console.log(`✅ Added ${alt.column} to ${alt.table}`);
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log(`⏭️  ${alt.column} already exists in ${alt.table}`);
      } else {
        console.error(`❌ Error on ${alt.table}:`, e.message);
      }
    }
  }

  await conn.end();
  console.log("Migration V6 complete");
}

run().catch(e => { console.error(e); process.exit(1); });
