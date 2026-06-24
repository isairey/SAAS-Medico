import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function migrate() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected. Running V10.2 migration...");

  // 1. Create table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS regulatory_competence (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemName VARCHAR(255) NOT NULL,
      itemCategory ENUM('medicamento','suplemento','formula_magistral','procedimento','exame','protocolo','conduta_clinica','dispositivo') NOT NULL,
      administrationRoute ENUM('oral','injetavel_iv','injetavel_im','injetavel_sc','topico','implante','inalatorio','sublingual','retal','oftalmico','nasal','transdermico','procedimento_invasivo','procedimento_nao_invasivo','nenhuma') NOT NULL,
      regulatoryScore INT NOT NULL,
      canMedico BOOLEAN NOT NULL DEFAULT TRUE,
      canEnfermeiro BOOLEAN NOT NULL DEFAULT FALSE,
      canFarmaceutico BOOLEAN NOT NULL DEFAULT FALSE,
      canBiomedico BOOLEAN NOT NULL DEFAULT FALSE,
      canNutricionista BOOLEAN NOT NULL DEFAULT FALSE,
      canPsicologo BOOLEAN NOT NULL DEFAULT FALSE,
      requiresCRM BOOLEAN NOT NULL DEFAULT TRUE,
      requiresSpecialPrescription BOOLEAN NOT NULL DEFAULT FALSE,
      prescriptionType ENUM('simples','comum','controle_especial','antimicrobiano','retencao','notificacao_a','nenhuma') NOT NULL DEFAULT 'simples',
      autoValidationLevel ENUM('N1','N2','N3') NOT NULL,
      regulatoryNotes TEXT,
      legalBasis VARCHAR(500),
      exampleDosage VARCHAR(255),
      therapeuticGroup VARCHAR(255),
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      clinicId INT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ regulatory_competence table created");

  // 2. Seed com dados iniciais de condutas comuns
  const seeds = [
    // ═══ SUPLEMENTOS ORAIS (Score 10-20, N1, farmacêutico/enfermeiro/médico podem) ═══
    ["Coenzima Q10 100mg", "suplemento", "oral", 10, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral, não requer receita médica. Farmacêutico e enfermeiro podem prescrever.", "RDC 243/2018 - Suplementos alimentares", "100mg 1x/dia", "Antioxidantes"],
    ["Vitamina D3 10.000UI", "suplemento", "oral", 15, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral. Doses altas recomenda-se acompanhamento.", "RDC 243/2018", "10.000UI 1x/semana", "Vitaminas"],
    ["Vitamina C 1000mg", "suplemento", "oral", 8, 1,1,1,0,1,0, 0,0, "nenhuma", "N1", "Suplemento oral de venda livre.", "RDC 243/2018", "1000mg 1x/dia", "Vitaminas"],
    ["Ômega 3 EPA/DHA 1000mg", "suplemento", "oral", 10, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral.", "RDC 243/2018", "1000mg 2x/dia", "Ácidos Graxos"],
    ["Magnésio Dimalato 300mg", "suplemento", "oral", 10, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral.", "RDC 243/2018", "300mg 1x/dia", "Minerais"],
    ["Zinco Quelato 30mg", "suplemento", "oral", 10, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral.", "RDC 243/2018", "30mg 1x/dia", "Minerais"],
    ["Probiótico Multi-cepas", "suplemento", "oral", 10, 1,1,1,0,1,0, 0,0, "simples", "N1", "Suplemento oral.", "RDC 243/2018", "1 cápsula/dia", "Probióticos"],
    ["Melatonina 3mg", "suplemento", "oral", 15, 1,1,1,0,0,0, 0,0, "simples", "N1", "Suplemento oral regulamentado.", "RDC 441/2020", "3mg antes de dormir", "Reguladores do Sono"],

    // ═══ MEDICAMENTOS ORAIS (Score 35-50, N2, médico + enfermeiro com supervisão) ═══
    ["Metformina 500mg", "medicamento", "oral", 40, 1,0,0,0,0,0, 1,0, "comum", "N2", "Medicamento oral. Requer receita médica com CRM.", "Lei 5991/73", "500mg 2x/dia", "Antidiabéticos"],
    ["Levotiroxina 50mcg", "medicamento", "oral", 40, 1,0,0,0,0,0, 1,0, "comum", "N2", "Medicamento oral. Requer receita médica.", "Lei 5991/73", "50mcg 1x/dia em jejum", "Hormônios Tireoidianos"],
    ["Sinvastatina 20mg", "medicamento", "oral", 40, 1,0,0,0,0,0, 1,0, "comum", "N2", "Medicamento oral. Requer receita médica.", "Lei 5991/73", "20mg 1x/dia à noite", "Estatinas"],
    ["Losartana 50mg", "medicamento", "oral", 40, 1,0,0,0,0,0, 1,0, "comum", "N2", "Anti-hipertensivo oral. Requer CRM.", "Lei 5991/73", "50mg 1x/dia", "Anti-hipertensivos"],
    ["Amoxicilina 500mg", "medicamento", "oral", 50, 1,0,0,0,0,0, 1,0, "antimicrobiano", "N2", "Antibiótico oral. Receita de antimicrobiano com retenção.", "RDC 20/2011", "500mg 8/8h por 7 dias", "Antibióticos"],

    // ═══ FÓRMULAS MAGISTRAIS ORAIS (Score 30-45, N2) ═══
    ["Fórmula Magistral Manipulada (oral)", "formula_magistral", "oral", 35, 1,0,1,0,0,0, 1,0, "comum", "N2", "Fórmula manipulada oral. Farmacêutico pode manipular com receita médica.", "RDC 67/2007", "Conforme prescrição", "Manipulados"],

    // ═══ INJETÁVEIS (Score 65-90, N3, SOMENTE MÉDICO) ═══
    ["Coenzima Q10 Injetável", "medicamento", "injetavel_iv", 80, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Via injetável IV requer prescrição médica e aplicação por profissional habilitado.", "CFM 1999/2012", "200mg IV lenta", "Antioxidantes Injetáveis"],
    ["Vitamina C Injetável 10g", "medicamento", "injetavel_iv", 75, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Megadose IV.", "CFM 1999/2012", "10g em SF 250ml IV lenta", "Vitaminas Injetáveis"],
    ["Glutationa Injetável 600mg", "medicamento", "injetavel_iv", 80, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Antioxidante IV.", "CFM 1999/2012", "600mg IV push", "Antioxidantes Injetáveis"],
    ["Complexo B Injetável", "medicamento", "injetavel_im", 65, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO prescreve. Enfermeiro pode aplicar IM com prescrição.", "CFM 1999/2012", "1 ampola IM", "Vitaminas Injetáveis"],
    ["Soro de Myers (Coquetel IV)", "procedimento", "injetavel_iv", 85, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Protocolo de soroterapia IV.", "CFM 1999/2012", "Protocolo completo IV", "Soroterapia"],
    ["Ozonioterapia IV", "procedimento", "injetavel_iv", 90, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Procedimento invasivo regulamentado.", "CFM 2181/2018", "Conforme protocolo", "Ozonioterapia"],

    // ═══ IMPLANTES (Score 85-95, N3, SOMENTE MÉDICO) ═══
    ["Implante Hormonal (Gestrinona)", "dispositivo", "implante", 90, 1,0,0,0,0,0, 1,1, "controle_especial", "N3", "SOMENTE MÉDICO. Implante subcutâneo hormonal. Controle especial.", "CFM + ANVISA", "Conforme protocolo", "Implantes Hormonais"],
    ["Chip da Beleza (Implante)", "dispositivo", "implante", 85, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Implante subcutâneo.", "CFM", "Conforme protocolo", "Implantes"],

    // ═══ PROCEDIMENTOS NÃO INVASIVOS (Score 25-45, N1/N2) ═══
    ["Bioimpedância", "exame", "procedimento_nao_invasivo", 15, 1,1,0,1,1,0, 0,0, "nenhuma", "N1", "Exame não invasivo. Qualquer profissional de saúde pode realizar.", "Não regulamentado", "Avaliação corporal", "Avaliação Física"],
    ["Aplicação de Laser de Baixa Potência", "procedimento", "procedimento_nao_invasivo", 30, 1,1,0,1,0,0, 0,0, "nenhuma", "N2", "Procedimento não invasivo. Enfermeiro e biomédico podem aplicar.", "COREN/CRBM", "Conforme protocolo", "Fisioterapia"],

    // ═══ PROCEDIMENTOS INVASIVOS (Score 70-95, N3) ═══
    ["Aplicação de Toxina Botulínica", "procedimento", "procedimento_invasivo", 75, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Procedimento invasivo estético/terapêutico.", "CFM 2162/2017", "Conforme avaliação", "Estética Médica"],
    ["Preenchimento com Ácido Hialurônico", "procedimento", "procedimento_invasivo", 80, 1,0,0,0,0,0, 1,0, "comum", "N3", "SOMENTE MÉDICO. Procedimento invasivo.", "CFM", "Conforme avaliação", "Estética Médica"],

    // ═══ CONDUTAS CLÍNICAS (Score variável) ═══
    ["Orientação Nutricional", "conduta_clinica", "nenhuma", 10, 1,1,0,0,1,0, 0,0, "nenhuma", "N1", "Nutricionista, enfermeiro e médico podem orientar.", "CFN/COREN/CFM", "Plano alimentar", "Nutrição"],
    ["Prescrição de Fitoterápicos", "medicamento", "oral", 25, 1,1,1,0,1,0, 0,0, "simples", "N1", "Fitoterápicos tradicionais. Diversos profissionais podem prescrever.", "RDC 26/2014", "Conforme indicação", "Fitoterapia"],
    ["Avaliação Psicológica", "conduta_clinica", "nenhuma", 20, 1,0,0,0,0,1, 0,0, "nenhuma", "N1", "Exclusivo do psicólogo ou médico.", "CFP/CFM", "Sessão avaliativa", "Saúde Mental"],
  ];

  const insertSQL = `INSERT INTO regulatory_competence 
    (itemName, itemCategory, administrationRoute, regulatoryScore, 
     canMedico, canEnfermeiro, canFarmaceutico, canBiomedico, canNutricionista, canPsicologo,
     requiresCRM, requiresSpecialPrescription, prescriptionType, autoValidationLevel,
     regulatoryNotes, legalBasis, exampleDosage, therapeuticGroup)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE itemName=itemName`;

  for (const seed of seeds) {
    try {
      await conn.execute(insertSQL, seed);
      console.log(`  ✅ ${seed[0]}`);
    } catch (err) {
      console.error(`  ❌ ${seed[0]}: ${err.message}`);
    }
  }

  console.log(`\n✅ V10.2 migration complete. ${seeds.length} items seeded.`);
  await conn.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
