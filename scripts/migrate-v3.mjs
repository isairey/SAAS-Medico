import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await mysql.createConnection(url);

const tables = [
  `CREATE TABLE IF NOT EXISTS clinical_systems (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    patientId int NOT NULL,
    \`system\` enum('cardiovascular','metabolico','endocrino','digestivo','neuro_humor','sono','atividade_fisica') NOT NULL,
    conditionCode varchar(50) NOT NULL,
    conditionName varchar(255) NOT NULL,
    status enum('diagnosticado','potencial','descartado','em_investigacao') NOT NULL DEFAULT 'potencial',
    severity enum('leve','moderado','grave') DEFAULT 'leve',
    notes text,
    diagnosedAt varchar(10),
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sleep_details (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    dailyReportId int NOT NULL,
    patientId int NOT NULL,
    fallingAsleep decimal(4,1),
    waking decimal(4,1),
    fragmented decimal(4,1),
    daytimeSleepiness decimal(4,1),
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS physical_activity_details (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    dailyReportId int NOT NULL,
    patientId int NOT NULL,
    activityType varchar(100) NOT NULL,
    frequencyPerWeek int,
    period enum('manha','tarde','noite'),
    intensity enum('leve','moderada','intensa'),
    durationMinutes int,
    notes text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS polypharmacy_rules (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name varchar(255) NOT NULL,
    medicationA varchar(255) NOT NULL,
    medicationB varchar(255),
    interactionType enum('contraindicacao','precaucao','monitorar','limiar_polifarmacia') NOT NULL,
    description text NOT NULL,
    threshold int,
    isActive boolean NOT NULL DEFAULT true,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS team_queue (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    patientId int NOT NULL,
    assignedProfile enum('enfermagem','medico_assistente','supervisor','nao_atribuido') NOT NULL DEFAULT 'nao_atribuido',
    assignedToId int,
    priority enum('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal',
    reason varchar(255) NOT NULL,
    source varchar(100),
    status enum('pendente','em_atendimento','concluido') NOT NULL DEFAULT 'pendente',
    notes text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS protocol_documents (
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    patientId int NOT NULL,
    sessionId int,
    documentType enum('protocolo','anamnese','relatorio') NOT NULL DEFAULT 'protocolo',
    title varchar(255) NOT NULL,
    fileUrl text,
    fileKey varchar(255),
    scoreBand varchar(50),
    score int,
    signedByName varchar(255),
    signedByCRM varchar(50),
    signedAt timestamp NULL,
    sentVia enum('whatsapp','email','nenhum') DEFAULT 'nenhum',
    sentAt timestamp NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

// Seed polypharmacy rules
const seeds = [
  `INSERT IGNORE INTO polypharmacy_rules (name, medicationA, medicationB, interactionType, description, threshold) VALUES
    ('Limiar Polifarmácia 5+', '*', NULL, 'limiar_polifarmacia', 'Paciente com 5 ou mais medicamentos ativos requer revisão farmacêutica', 5),
    ('Limiar Polifarmácia 10+', '*', NULL, 'limiar_polifarmacia', 'Polifarmácia grave: 10+ medicamentos. Encaminhar para supervisor', 10),
    ('Warfarina + AINEs', 'Warfarina', 'Ibuprofeno', 'contraindicacao', 'Risco aumentado de sangramento gastrointestinal', NULL),
    ('Warfarina + AINEs', 'Warfarina', 'Diclofenaco', 'contraindicacao', 'Risco aumentado de sangramento gastrointestinal', NULL),
    ('Metformina + Contraste', 'Metformina', 'Contraste iodado', 'precaucao', 'Suspender metformina 48h antes de exame com contraste', NULL),
    ('IECA + Espironolactona', 'Enalapril', 'Espironolactona', 'monitorar', 'Risco de hipercalemia. Monitorar potássio sérico', NULL),
    ('Lítio + Diuréticos', 'Lítio', 'Hidroclorotiazida', 'monitorar', 'Diuréticos podem aumentar níveis de lítio', NULL),
    ('Sinvastatina + Amiodarona', 'Sinvastatina', 'Amiodarona', 'precaucao', 'Limitar dose de sinvastatina a 20mg/dia', NULL)`
];

console.log('Applying V3 migration...');
for (const sql of tables) {
  const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
  const name = match ? match[1] : 'unknown';
  try {
    await conn.execute(sql);
    console.log(`  ✓ Table ${name} created`);
  } catch (e) {
    console.log(`  ⚠ Table ${name}: ${e.message}`);
  }
}

for (const sql of seeds) {
  try {
    const [result] = await conn.execute(sql);
    console.log(`  ✓ Seeded polypharmacy rules: ${result.affectedRows} rows`);
  } catch (e) {
    console.log(`  ⚠ Seed: ${e.message}`);
  }
}

await conn.end();
console.log('V3 migration complete!');
