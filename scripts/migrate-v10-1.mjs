import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function migrate() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected. Running V10.1 migration...");

  const stmts = [
    // 1. conduct_grades
    `CREATE TABLE IF NOT EXISTS conduct_grades (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      grade ENUM('grau_1_auto','grau_2_semi','grau_3_manual') NOT NULL,
      validationLevel ENUM('N1','N2','N3') NOT NULL,
      minScore INT NOT NULL,
      maxScore INT NOT NULL,
      description TEXT,
      autoGenerateRecipe BOOLEAN NOT NULL DEFAULT FALSE,
      autoDispatchPharmacy BOOLEAN NOT NULL DEFAULT FALSE,
      requiresConsultantClick BOOLEAN NOT NULL DEFAULT TRUE,
      requiresFullCascade BOOLEAN NOT NULL DEFAULT FALSE,
      color VARCHAR(20),
      sortOrder INT DEFAULT 0 NOT NULL,
      clinicId INT DEFAULT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 2. webhook_endpoints
    `CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      platform ENUM('manychat','typebot','botpress','n8n','zapier','make','custom') NOT NULL,
      secretToken VARCHAR(128) NOT NULL,
      targetAction ENUM('create_lead','start_quick_anamnesis','update_lead_status','trigger_prescription') NOT NULL,
      fieldMapping JSON,
      defaultChannelId INT DEFAULT NULL,
      defaultChannelType ENUM('trafego_pago','consultora','site','vendedor_externo','referral','whatsapp_bot'),
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      lastCalledAt TIMESTAMP NULL,
      callCount INT NOT NULL DEFAULT 0,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 3. recipe_delivery_config
    `CREATE TABLE IF NOT EXISTS recipe_delivery_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deliveryTarget ENUM('paciente','farmacia','ambos') NOT NULL DEFAULT 'ambos',
      defaultPharmacyId INT DEFAULT NULL,
      autoSelectPharmacy BOOLEAN NOT NULL DEFAULT FALSE,
      pharmacySelectionCriteria ENUM('mais_proxima','menor_preco','maior_comissao','rotativa','fixa') DEFAULT 'fixa',
      sendViaWhatsapp BOOLEAN NOT NULL DEFAULT FALSE,
      sendViaEmail BOOLEAN NOT NULL DEFAULT TRUE,
      clinicId INT DEFAULT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 4. quick_anamnesis_templates
    `CREATE TABLE IF NOT EXISTS quick_anamnesis_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      questionIds JSON NOT NULL,
      targetConductGrade ENUM('grau_1_auto','grau_2_semi'),
      autoPrescriptionTemplate JSON,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 5. Seed default conduct grades
    `INSERT INTO conduct_grades (name, grade, validationLevel, minScore, maxScore, description, autoGenerateRecipe, autoDispatchPharmacy, requiresConsultantClick, requiresFullCascade, color, sortOrder) VALUES
      ('Conduta Simples (Auto)', 'grau_1_auto', 'N1', 0, 30, 'Score baixo + item simples (CoQ10, vitaminas). IA valida automaticamente, gera receita e despacha para farmácia.', TRUE, TRUE, FALSE, FALSE, '#22c55e', 1),
      ('Conduta Intermediária (Semi)', 'grau_2_semi', 'N2', 31, 60, 'Score médio. IA pré-valida, mas precisa de 1 clique do consultor delegado para liberar.', TRUE, FALSE, TRUE, FALSE, '#f59e0b', 2),
      ('Conduta Complexa (Manual)', 'grau_3_manual', 'N3', 61, 100, 'Score alto ou item complexo. Cascata completa: enfermeira → médico delegado → preceptor CRM.', FALSE, FALSE, TRUE, TRUE, '#ef4444', 3)
    ON DUPLICATE KEY UPDATE name=name`,

    // 6. Seed default recipe delivery config
    `INSERT INTO recipe_delivery_config (deliveryTarget, sendViaEmail) VALUES ('ambos', TRUE)
    ON DUPLICATE KEY UPDATE deliveryTarget=deliveryTarget`,
  ];

  for (const sql of stmts) {
    try {
      await conn.execute(sql);
      const tableName = sql.match(/(?:CREATE TABLE IF NOT EXISTS|INSERT INTO|ALTER TABLE)\s+(\w+)/)?.[1] || "seed";
      console.log(`✅ ${tableName}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log(`⏭️  Already exists, skipping`);
      } else {
        console.error(`❌ Error:`, err.message);
      }
    }
  }

  await conn.end();
  console.log("V10.1 migration complete.");
}

migrate().catch(err => { console.error(err); process.exit(1); });
