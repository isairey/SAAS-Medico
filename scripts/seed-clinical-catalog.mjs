import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

// Seed polypharmacy rules
const polyRules = [
  { name: "Warfarina + AINEs", medicationA: "Warfarina", medicationB: "AINEs (Ibuprofeno, Naproxeno)", interactionType: "contraindicacao", description: "Risco aumentado de sangramento gastrointestinal e hemorragia. AINEs potencializam o efeito anticoagulante da Warfarina.", threshold: null },
  { name: "Metformina + Contraste Iodado", medicationA: "Metformina", medicationB: "Contraste Iodado", interactionType: "precaucao", description: "Suspender Metformina 48h antes e após exame com contraste. Risco de acidose lática.", threshold: null },
  { name: "IECA + Espironolactona", medicationA: "IECA (Enalapril, Captopril)", medicationB: "Espironolactona", interactionType: "monitorar", description: "Risco de hipercalemia. Monitorar potássio sérico regularmente.", threshold: null },
  { name: "Sinvastatina + Amiodarona", medicationA: "Sinvastatina", medicationB: "Amiodarona", interactionType: "precaucao", description: "Amiodarona aumenta níveis de sinvastatina. Dose máxima de sinvastatina: 20mg/dia.", threshold: null },
  { name: "Metformina + Álcool", medicationA: "Metformina", medicationB: "Álcool", interactionType: "precaucao", description: "Consumo excessivo de álcool aumenta risco de acidose lática com Metformina.", threshold: null },
  { name: "Levotiroxina + Cálcio/Ferro", medicationA: "Levotiroxina", medicationB: "Suplementos de Cálcio ou Ferro", interactionType: "monitorar", description: "Cálcio e Ferro reduzem absorção de Levotiroxina. Administrar com intervalo mínimo de 4 horas.", threshold: null },
  { name: "Limiar Polifarmácia Moderada", medicationA: "QUALQUER", medicationB: null, interactionType: "limiar_polifarmacia", description: "Paciente utiliza 5 ou mais medicamentos simultaneamente. Avaliar necessidade de cada medicação e possibilidade de desprescrição.", threshold: 5 },
  { name: "Limiar Polifarmácia Grave", medicationA: "QUALQUER", medicationB: null, interactionType: "limiar_polifarmacia", description: "Paciente utiliza 10 ou mais medicamentos. Alto risco de interações adversas. Revisão farmacêutica obrigatória.", threshold: 10 },
];

for (const rule of polyRules) {
  await conn.execute(
    `INSERT INTO polypharmacy_rules (name, medicationA, medicationB, interactionType, description, threshold, isActive) VALUES (?, ?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE description=VALUES(description)`,
    [rule.name, rule.medicationA, rule.medicationB, rule.interactionType, rule.description, rule.threshold]
  );
}
console.log(`✅ ${polyRules.length} regras de polifarmácia semeadas`);

// Seed flow config defaults
const flowConfigs = [
  { configKey: "auto_route_urgente_supervisor", configValue: "true", description: "Roteamento automático: itens urgentes vão para supervisor" },
  { configKey: "auto_route_alta_medico", configValue: "true", description: "Roteamento automático: itens de alta prioridade vão para médico assistente" },
  { configKey: "bloquear_protocolo_flag_pendente", configValue: "true", description: "Bloquear envio de protocolo se houver flag clínica pendente" },
  { configKey: "notificar_polifarmacia", configValue: "true", description: "Notificar quando limiar de polifarmácia é atingido" },
];

for (const fc of flowConfigs) {
  await conn.execute(
    `INSERT INTO flow_config (configKey, configValue, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description)`,
    [fc.configKey, fc.configValue, fc.description]
  );
}
console.log(`✅ ${flowConfigs.length} configs de fluxo adicionais semeadas`);

await conn.end();
console.log("✅ Seed de catálogo clínico concluído");
