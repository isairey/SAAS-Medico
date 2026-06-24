/**
 * Migration V11 — Appointments, Internal Notifications, Trello Cards/Config, PWA Sync Queue
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const statements = [
  // Appointments
  `CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT NOT NULL,
    patientName VARCHAR(255),
    professionalId INT,
    professionalName VARCHAR(255),
    type ENUM('consulta_integrativa','consulta_estetica','retorno','anamnese','procedimento','exame','acompanhamento') NOT NULL DEFAULT 'consulta_integrativa',
    status ENUM('agendado','confirmado','em_atendimento','concluido','cancelado','no_show','reagendado') NOT NULL DEFAULT 'agendado',
    scheduledAt TIMESTAMP NOT NULL,
    durationMinutes INT DEFAULT 30,
    location VARCHAR(500),
    notes TEXT,
    externalCalendarId VARCHAR(255),
    externalCalendarProvider ENUM('google','outlook','ical','manual') DEFAULT 'manual',
    reminderSentAt TIMESTAMP NULL,
    reminderType ENUM('email','whatsapp','sms','push','nenhum') DEFAULT 'nenhum',
    isRecurring BOOLEAN DEFAULT FALSE,
    recurrenceRule VARCHAR(255),
    parentAppointmentId INT,
    clinicId INT,
    entryLeadId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Internal Notifications
  `CREATE TABLE IF NOT EXISTS internal_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipientId INT NOT NULL,
    recipientType ENUM('admin','medico','enfermeiro','consultora','paciente') NOT NULL DEFAULT 'admin',
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type ENUM('alerta_clinico','prescricao_pendente','validacao_pendente','despacho_atualizado','agendamento','lead_novo','sistema','lembrete','resultado_exame') NOT NULL DEFAULT 'sistema',
    priority ENUM('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal',
    entityType VARCHAR(100),
    entityId INT,
    isRead BOOLEAN NOT NULL DEFAULT FALSE,
    readAt TIMESTAMP NULL,
    channel ENUM('interno','email','whatsapp','push') NOT NULL DEFAULT 'interno',
    sentAt TIMESTAMP NULL,
    clinicId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Trello Cards
  `CREATE TABLE IF NOT EXISTS trello_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entityType ENUM('alerta','prescricao','validacao','lead','agendamento','despacho') NOT NULL,
    entityId INT NOT NULL,
    trelloCardId VARCHAR(100),
    trelloBoardId VARCHAR(100),
    trelloListId VARCHAR(100),
    trelloUrl VARCHAR(500),
    cardTitle VARCHAR(500) NOT NULL,
    cardDescription TEXT,
    labels TEXT,
    dueDate TIMESTAMP NULL,
    syncStatus ENUM('pendente','sincronizado','erro','arquivado') NOT NULL DEFAULT 'pendente',
    lastSyncAt TIMESTAMP NULL,
    syncError TEXT,
    clinicId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Trello Config
  `CREATE TABLE IF NOT EXISTS trello_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apiKey VARCHAR(255),
    apiToken VARCHAR(500),
    defaultBoardId VARCHAR(100),
    listMappings TEXT,
    isActive BOOLEAN NOT NULL DEFAULT FALSE,
    clinicId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // PWA Sync Queue
  `CREATE TABLE IF NOT EXISTS pwa_sync_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    patientId INT,
    operationType ENUM('relato_diario','resposta_anamnese','agendamento','atualizacao_dados') NOT NULL,
    payload TEXT NOT NULL,
    status ENUM('pendente','sincronizando','sincronizado','erro','conflito') NOT NULL DEFAULT 'pendente',
    deviceId VARCHAR(255),
    offlineCreatedAt TIMESTAMP NULL,
    syncAttempts INT DEFAULT 0,
    lastSyncError TEXT,
    resolvedAt TIMESTAMP NULL,
    clinicId INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patientId)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduledAt)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinicId)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON internal_notifications(recipientId)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_read ON internal_notifications(isRead)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_clinic ON internal_notifications(clinicId)`,
  `CREATE INDEX IF NOT EXISTS idx_trello_entity ON trello_cards(entityType, entityId)`,
  `CREATE INDEX IF NOT EXISTS idx_trello_sync ON trello_cards(syncStatus)`,
  `CREATE INDEX IF NOT EXISTS idx_pwa_sync_status ON pwa_sync_queue(status)`,
  `CREATE INDEX IF NOT EXISTS idx_pwa_sync_patient ON pwa_sync_queue(patientId)`,
];

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  for (const sql of statements) {
    try {
      await conn.execute(sql);
      const name = sql.match(/(?:CREATE TABLE|CREATE INDEX).*?(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1];
      console.log(`✓ ${name || 'statement'}`);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.message?.includes('Duplicate')) {
        console.log(`⊘ Skipped (already exists)`);
      } else {
        console.error(`✗ Error:`, e.message);
      }
    }
  }
  await conn.end();
  console.log("\n✅ Migration V11 complete");
}

run().catch(e => { console.error(e); process.exit(1); });
