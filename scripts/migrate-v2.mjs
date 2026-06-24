import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

const statements = [
  // New tables
  `CREATE TABLE IF NOT EXISTS clinical_flags (
    id int AUTO_INCREMENT NOT NULL,
    patientId int NOT NULL,
    flagType enum('validation','warning','info') NOT NULL,
    code varchar(50) NOT NULL,
    description text NOT NULL,
    source varchar(100),
    sourceId int,
    status enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
    validatedById int,
    validatedAt timestamp NULL,
    notes text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clinical_flags_id PRIMARY KEY(id)
  )`,
  `CREATE TABLE IF NOT EXISTS flow_config (
    id int AUTO_INCREMENT NOT NULL,
    configKey varchar(100) NOT NULL,
    configValue varchar(50) NOT NULL,
    showToggle boolean NOT NULL DEFAULT true,
    description text,
    ifOn text,
    ifOff text,
    defaultProfile varchar(50),
    notes text,
    CONSTRAINT flow_config_id PRIMARY KEY(id),
    CONSTRAINT flow_config_configKey_unique UNIQUE(configKey)
  )`,
  `CREATE TABLE IF NOT EXISTS funnel_status (
    id int AUTO_INCREMENT NOT NULL,
    patientId int NOT NULL,
    stage enum('iniciou_e_parou','concluiu_clinico','concluiu_financeiro','alto_interesse','convertido') NOT NULL,
    scoreBand varchar(50),
    score int,
    stoppedAtStep int,
    stoppedAtModule varchar(50),
    notes text,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT funnel_status_id PRIMARY KEY(id)
  )`,
  `CREATE TABLE IF NOT EXISTS medications (
    id int AUTO_INCREMENT NOT NULL,
    patientId int NOT NULL,
    name varchar(255) NOT NULL,
    dosageUnit varchar(50),
    dosageValue decimal(10,2),
    associatedDisease varchar(100),
    morningQty int NOT NULL DEFAULT 0,
    afternoonQty int NOT NULL DEFAULT 0,
    nightQty int NOT NULL DEFAULT 0,
    totalDaily int NOT NULL DEFAULT 0,
    isActive boolean NOT NULL DEFAULT true,
    notes text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT medications_id PRIMARY KEY(id)
  )`,
  `CREATE TABLE IF NOT EXISTS motor_actions (
    id int AUTO_INCREMENT NOT NULL,
    triggerCode varchar(50) NOT NULL,
    triggerCondition varchar(100) NOT NULL,
    actionType enum('formula','exame','encaminhamento','alerta','painel') NOT NULL,
    actionValue text NOT NULL,
    priority int NOT NULL DEFAULT 0,
    isActive boolean NOT NULL DEFAULT true,
    CONSTRAINT motor_actions_id PRIMARY KEY(id)
  )`,
  `CREATE TABLE IF NOT EXISTS scoring_bands (
    id int AUTO_INCREMENT NOT NULL,
    name varchar(50) NOT NULL,
    minScore int NOT NULL,
    maxScore int NOT NULL,
    description text,
    color varchar(20),
    actions json,
    sortOrder int NOT NULL DEFAULT 0,
    CONSTRAINT scoring_bands_id PRIMARY KEY(id)
  )`,
  `CREATE TABLE IF NOT EXISTS scoring_weights (
    id int AUTO_INCREMENT NOT NULL,
    questionCode varchar(50) NOT NULL,
    axis varchar(50) NOT NULL,
    weight decimal(5,2) NOT NULL,
    maxRawPoints int NOT NULL DEFAULT 10,
    isActive boolean NOT NULL DEFAULT true,
    CONSTRAINT scoring_weights_id PRIMARY KEY(id)
  )`,
  // ALTER anamnesis_questions - add new columns (ignore if exist)
  `ALTER TABLE anamnesis_questions MODIFY COLUMN category enum('integrativa','estetica','relato_diario') NOT NULL`,
];

const alterColumns = [
  { col: "code", def: "varchar(50)" },
  { col: "block", def: "varchar(50)" },
  { col: "step", def: "int" },
  { col: "clinicalGoal", def: "text" },
  { col: "commercialGoal", def: "text" },
  { col: "helper", def: "text" },
  { col: "technicalName", def: "varchar(255)" },
  { col: "weight", def: "decimal(5,2)" },
  { col: "videoUrl", def: "varchar(500)" },
];

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("OK:", stmt.substring(0, 60) + "...");
  } catch (e) {
    console.log("SKIP:", e.message.substring(0, 80));
  }
}

for (const { col, def } of alterColumns) {
  try {
    await conn.execute(`ALTER TABLE anamnesis_questions ADD ${col} ${def}`);
    console.log(`OK: Added column ${col}`);
  } catch (e) {
    if (e.message.includes("Duplicate column")) {
      console.log(`SKIP: Column ${col} already exists`);
    } else {
      console.log(`ERROR adding ${col}:`, e.message.substring(0, 80));
    }
  }
}

// Seed scoring bands
const [bands] = await conn.execute("SELECT COUNT(*) as c FROM scoring_bands");
if (bands[0].c === 0) {
  await conn.execute(`INSERT INTO scoring_bands (name, minScore, maxScore, description, color, actions, sortOrder) VALUES
    ('Basico', 0, 20, 'Paciente com baixa complexidade clinica. Protocolo minimo com acompanhamento leve.', '#22c55e', '["Painel cardiometabolico basico","Hemograma","Vitamina D"]', 1),
    ('Intermediario', 21, 50, 'Complexidade moderada. Protocolo com formulas personalizadas e exames direcionados.', '#eab308', '["Painel hormonal","Painel hepatico","Perfil lipidico","Formula magistral base"]', 2),
    ('Avancado', 51, 80, 'Alta complexidade. Protocolo completo com multiplas formulas e acompanhamento intensivo.', '#f97316', '["Painel completo","Genetica","Microbioma","Formulas IM/EV","Acompanhamento 30d"]', 3),
    ('Full', 81, 100, 'Complexidade maxima. Protocolo integral com todas as camadas terapeuticas.', '#ef4444', '["Protocolo integral","Implantes","Terapia IV","Acompanhamento semanal","Equipe multidisciplinar"]', 4)
  `);
  console.log("OK: Seeded 4 scoring bands");
}

// Seed flow config defaults
const [configs] = await conn.execute("SELECT COUNT(*) as c FROM flow_config");
if (configs[0].c === 0) {
  await conn.execute(`INSERT INTO flow_config (configKey, configValue, showToggle, description, ifOn, ifOff, defaultProfile) VALUES
    ('PRE_TRIAGEM_ENFERMAGEM', 'ON', true, 'Exige conferencia inicial de dados', 'Envia para fila enfermagem', 'Pula etapa', 'enfermagem'),
    ('VALIDACAO_MEDICO_ASSISTENTE', 'ON', true, 'Exige revisao medica intermediaria', 'Envia para fila medico assistente', 'Pula etapa', 'medico_assistente'),
    ('VALIDACAO_HUMANA_OBRIGATORIA', 'OFF', true, 'Trava fechamento automatico', 'Todo caso precisa de humano', 'Casos baixo risco podem andar', 'supervisor'),
    ('EXIGIR_VALIDACAO_FINAL', 'ON', true, 'Trava liberacao final', 'So fecha com supervisor', 'Pode fechar por regra', 'supervisor'),
    ('LIBERAR_SUGESTAO_AUTOMATICA', 'ON', true, 'Mostra preview e sugestoes', 'Exibe preview', 'Nao exibe preview', 'sistema'),
    ('PREVER_COBRANCA', 'ON', true, 'Calcula camada comercial', 'Exibe previsao comercial', 'Nao calcula', 'gestao'),
    ('AUTO_ENCAMINHAR_BAIXO_RISCO', 'OFF', true, 'Rota curta para casos simples', 'Casos score baixo pulam etapas', 'Mantem etapas', 'sistema'),
    ('TRAVAR_ONCOLOGIA', 'ON', true, 'Trava casos oncologicos para revisao', 'Sobe para supervisor', 'Nao trava', 'supervisor'),
    ('TRAVAR_GESTANTE', 'ON', true, 'Trava casos gestante', 'Sobe para revisao', 'Nao trava', 'supervisor'),
    ('TRAVAR_POLIFARMACIA', 'ON', true, 'Trava quando ha muitas medicacoes', 'Sobe para revisao', 'Nao trava', 'medico_assistente')
  `);
  console.log("OK: Seeded 10 flow config defaults");
}

// Mark migration as applied in drizzle journal
try {
  await conn.execute(`INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0002_wakeful_tempest', ${Date.now()}) ON DUPLICATE KEY UPDATE hash=hash`);
} catch (e) { /* ignore */ }

await conn.end();
console.log("\nMigration V2 complete!");
