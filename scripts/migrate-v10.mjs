import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function migrate() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected. Running V10 migration...");

  // 1. Add entryChannel and entryLeadId to patients
  const stmts = [
    `ALTER TABLE patients ADD COLUMN entryChannel ENUM('trafego_pago','consultora','site','vendedor_externo','referral','whatsapp_bot','direto') DEFAULT 'direto'`,
    `ALTER TABLE patients ADD COLUMN entryLeadId INT DEFAULT NULL`,

    // 2. entry_channels
    `CREATE TABLE IF NOT EXISTS entry_channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type ENUM('trafego_pago','consultora','site','vendedor_externo','referral','whatsapp_bot') NOT NULL,
      description TEXT,
      utmSource VARCHAR(100),
      utmMedium VARCHAR(100),
      utmCampaign VARCHAR(100),
      linkTemplate TEXT,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 3. entry_leads
    `CREATE TABLE IF NOT EXISTS entry_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channelId INT DEFAULT NULL,
      channelType ENUM('trafego_pago','consultora','site','vendedor_externo','referral','whatsapp_bot') NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(320),
      cpf VARCHAR(14),
      utmSource VARCHAR(100),
      utmMedium VARCHAR(100),
      utmCampaign VARCHAR(100),
      utmTerm VARCHAR(100),
      utmContent VARCHAR(100),
      landingPage VARCHAR(500),
      referredByPatientId INT DEFAULT NULL,
      vendorId INT DEFAULT NULL,
      consultantId INT DEFAULT NULL,
      status ENUM('novo','contatado','agendado','anamnese_iniciada','anamnese_concluida','prescricao_gerada','convertido','perdido','reativado') NOT NULL DEFAULT 'novo',
      patientId INT DEFAULT NULL,
      clinicId INT DEFAULT NULL,
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 4. pharmacies
    `CREATE TABLE IF NOT EXISTS pharmacies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnpj VARCHAR(20),
      email VARCHAR(320),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(2),
      contactPerson VARCHAR(255),
      commissionPercent DECIMAL(5,2) NOT NULL DEFAULT 30.00,
      integrationModel ENUM('portal','marketplace','drive','manual') NOT NULL DEFAULT 'portal',
      capabilities JSON,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 5. prescription_dispatches
    `CREATE TABLE IF NOT EXISTS prescription_dispatches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      prescriptionId INT NOT NULL,
      patientId INT NOT NULL,
      pharmacyId INT NOT NULL,
      status ENUM('pendente','enviado','aceito','em_manipulacao','pronto','entregue','cancelado') NOT NULL DEFAULT 'pendente',
      totalValue DECIMAL(10,2),
      commissionValue DECIMAL(10,2),
      commissionPercent DECIMAL(5,2),
      sentAt TIMESTAMP NULL,
      acceptedAt TIMESTAMP NULL,
      readyAt TIMESTAMP NULL,
      deliveredAt TIMESTAMP NULL,
      cancelledAt TIMESTAMP NULL,
      cancelReason TEXT,
      notes TEXT,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 6. validation_cascade
    `CREATE TABLE IF NOT EXISTS validation_cascade (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entityType ENUM('prescricao','protocolo','anamnese','exame','formula','injetavel','implante') NOT NULL,
      entityId INT NOT NULL,
      patientId INT NOT NULL,
      step ENUM('triagem_enfermagem','validacao_medico','validacao_preceptor') NOT NULL,
      professionalId INT DEFAULT NULL,
      professionalName VARCHAR(255),
      professionalCRM VARCHAR(50),
      certificateDigital VARCHAR(255),
      status ENUM('aguardando','homologado','devolvido','vencido','dispensado') NOT NULL DEFAULT 'aguardando',
      observation TEXT,
      returnReason TEXT,
      deadline TIMESTAMP NULL,
      validatedAt TIMESTAMP NULL,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 7. professional_trust
    `CREATE TABLE IF NOT EXISTS professional_trust (
      id INT AUTO_INCREMENT PRIMARY KEY,
      professionalId INT NOT NULL,
      professionalName VARCHAR(255) NOT NULL,
      professionalCRM VARCHAR(50),
      professionalRole ENUM('medico_consultor','medico_assistente','enfermeiro','biomedico','nutricionista','psicologo') NOT NULL,
      delegatedById INT NOT NULL,
      delegatedByName VARCHAR(255),
      delegatedByCRM VARCHAR(50),
      trustLevel ENUM('total','parcial','supervisionado') NOT NULL DEFAULT 'supervisionado',
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      observation TEXT,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // 8. validation_config
    `CREATE TABLE IF NOT EXISTS validation_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemType VARCHAR(100) NOT NULL,
      itemName VARCHAR(255),
      requiresHumanValidation BOOLEAN NOT NULL DEFAULT TRUE,
      requiresCRM BOOLEAN NOT NULL DEFAULT TRUE,
      minimumTrustLevel ENUM('total','parcial','supervisionado') NOT NULL DEFAULT 'supervisionado',
      autoApproveBelow DECIMAL(10,2),
      notes TEXT,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of stmts) {
    try {
      await conn.execute(sql);
      const tableName = sql.match(/(?:CREATE TABLE IF NOT EXISTS|ALTER TABLE)\s+(\w+)/)?.[1] || "unknown";
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
  console.log("V10 migration complete.");
}

migrate().catch(err => { console.error(err); process.exit(1); });
