import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Phone, FileText, ArrowRight } from "lucide-react";

export default function PadcomConcluido() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Ícone de sucesso animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>

        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold"
          >
            Questionário Concluído!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-slate-400 text-lg leading-relaxed"
          >
            Suas respostas foram registradas com sucesso. Agora nossa equipe médica vai analisar seu perfil clínico.
          </motion.p>
        </div>

        {/* Próximos passos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Próximos Passos
          </h3>

          <div className="space-y-2">
            {[
              {
                icone: <FileText className="w-5 h-5 text-cyan-400" />,
                titulo: "Análise do Motor Clínico",
                desc: "Seu score será calculado e classificado automaticamente",
              },
              {
                icone: <Clock className="w-5 h-5 text-amber-400" />,
                titulo: "Validação Médica",
                desc: "Um profissional de saúde revisará suas respostas em até 24h",
              },
              {
                icone: <Phone className="w-5 h-5 text-emerald-400" />,
                titulo: "Contato da Equipe",
                desc: "Você receberá orientações personalizadas por WhatsApp ou e-mail",
              },
            ].map((passo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + idx * 0.15 }}
                className="flex items-start gap-3 bg-slate-800/50 rounded-xl px-4 py-3 text-left border border-slate-700/50"
              >
                <div className="mt-0.5">{passo.icone}</div>
                <div>
                  <p className="font-medium text-sm text-white">{passo.titulo}</p>
                  <p className="text-xs text-slate-400">{passo.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Aviso importante */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300"
        >
          <strong>Importante:</strong> Este questionário é uma triagem inicial e não substitui uma consulta médica presencial. Em caso de urgência, procure atendimento imediato.
        </motion.div>

        {/* Botão de voltar */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
        >
          Voltar ao início
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
