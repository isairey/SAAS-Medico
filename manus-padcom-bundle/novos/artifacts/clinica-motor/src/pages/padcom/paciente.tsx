import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Save, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "pawards:padcom:draft";

interface Pergunta {
  id: string;
  modulo: number;
  ordem: number;
  pergunta: string;
  descricao?: string;
  tipo: string;
  opcoes?: any;
  peso: number;
}

interface DraftState {
  sessaoId?: string;
  respostas: Record<string, number | string>;
  moduloAtual: number;
  perguntaAtual: number;
  timestamps: Record<string, number>;
}

const MODULOS = [
  { id: 1, nome: "Hábitos de Vida", icone: "🏃", cor: "from-emerald-500 to-teal-600" },
  { id: 2, nome: "Sintomas Gerais", icone: "🩺", cor: "from-blue-500 to-indigo-600" },
  { id: 3, nome: "Saúde Digestiva", icone: "🫁", cor: "from-amber-500 to-orange-600" },
  { id: 4, nome: "Saúde Mental e Sono", icone: "🧠", cor: "from-purple-500 to-violet-600" },
  { id: 5, nome: "Histórico e Medicamentos", icone: "💊", cor: "from-rose-500 to-pink-600" },
];

export default function PadcomPaciente() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Recuperar draft do localStorage (Kaizen — autosave)
  const [draft, setDraft] = useState<DraftState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { respostas: {}, moduloAtual: 1, perguntaAtual: 0, timestamps: {} };
  });

  // Autosave no localStorage a cada mudança
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  // Buscar perguntas
  const { data: perguntas = [], isLoading } = useQuery<Pergunta[]>({
    queryKey: ["padcom-questionarios"],
    queryFn: async () => {
      const r = await fetch("/api/padcom-questionarios?ativo=true");
      if (!r.ok) throw new Error("Falha ao carregar perguntas");
      return r.json();
    },
  });

  // Agrupar por módulo
  const perguntasPorModulo = useMemo(() => {
    const map: Record<number, Pergunta[]> = {};
    for (const p of perguntas) {
      if (!map[p.modulo]) map[p.modulo] = [];
      map[p.modulo].push(p);
    }
    return map;
  }, [perguntas]);

  const perguntasDoModulo = perguntasPorModulo[draft.moduloAtual] ?? [];
  const perguntaAtual = perguntasDoModulo[draft.perguntaAtual];
  const totalRespondidas = Object.keys(draft.respostas).length;
  const totalPerguntas = perguntas.length;
  const progresso = totalPerguntas > 0 ? (totalRespondidas / totalPerguntas) * 100 : 0;

  // Criar sessão
  const criarSessao = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch("/api/padcom-sessoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    onSuccess: (data) => {
      setDraft(prev => ({ ...prev, sessaoId: data.id }));
    },
  });

  // Salvar resposta no servidor
  const salvarResposta = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/padcom-sessoes/${draft.sessaoId}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return r.json();
    },
  });

  // Finalizar sessão
  const finalizarSessao = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/padcom-sessoes/${draft.sessaoId}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return r.json();
    },
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY);
      navigate("/padcom/concluido");
    },
  });

  // Iniciar sessão se não existe
  useEffect(() => {
    if (!draft.sessaoId && perguntas.length > 0) {
      const pacienteId = searchParams.get("pacienteId") ?? "anonimo";
      const clinicaId = searchParams.get("clinicaId");
      const canal = searchParams.get("canal") ?? "site";
      criarSessao.mutate({
        pacienteId,
        clinicaId,
        origemCanal: canal,
        dispositivoInfo: {
          userAgent: navigator.userAgent,
          tela: `${window.innerWidth}x${window.innerHeight}`,
          plataforma: navigator.platform,
        },
      });
    }
  }, [perguntas.length]);

  const handleResponder = useCallback((valor: number | string) => {
    if (!perguntaAtual) return;

    const inicio = draft.timestamps[perguntaAtual.id] ?? Date.now();
    const tempoMs = Date.now() - inicio;

    setDraft(prev => ({
      ...prev,
      respostas: { ...prev.respostas, [perguntaAtual.id]: valor },
      timestamps: { ...prev.timestamps, [perguntaAtual.id]: Date.now() },
    }));

    // Salvar no servidor
    if (draft.sessaoId) {
      salvarResposta.mutate({
        questionarioId: perguntaAtual.id,
        modulo: perguntaAtual.modulo,
        ordem: perguntaAtual.ordem,
        valorNumerico: typeof valor === "number" ? valor : undefined,
        valorTexto: typeof valor === "string" ? valor : undefined,
        tempoRespostaMs: tempoMs,
      });
    }
  }, [perguntaAtual, draft.sessaoId, draft.timestamps]);

  const handleProximo = useCallback(() => {
    if (draft.perguntaAtual < perguntasDoModulo.length - 1) {
      setDraft(prev => ({ ...prev, perguntaAtual: prev.perguntaAtual + 1 }));
    } else if (draft.moduloAtual < 5) {
      setDraft(prev => ({ ...prev, moduloAtual: prev.moduloAtual + 1, perguntaAtual: 0 }));
    } else {
      finalizarSessao.mutate();
    }
  }, [draft.perguntaAtual, draft.moduloAtual, perguntasDoModulo.length]);

  const handleAnterior = useCallback(() => {
    if (draft.perguntaAtual > 0) {
      setDraft(prev => ({ ...prev, perguntaAtual: prev.perguntaAtual - 1 }));
    } else if (draft.moduloAtual > 1) {
      const moduloAnterior = draft.moduloAtual - 1;
      const perguntasAnterior = perguntasPorModulo[moduloAnterior] ?? [];
      setDraft(prev => ({
        ...prev,
        moduloAtual: moduloAnterior,
        perguntaAtual: Math.max(0, perguntasAnterior.length - 1),
      }));
    }
  }, [draft.perguntaAtual, draft.moduloAtual, perguntasPorModulo]);

  // Marcar início do tempo quando pergunta muda
  useEffect(() => {
    if (perguntaAtual && !draft.timestamps[perguntaAtual.id]) {
      setDraft(prev => ({
        ...prev,
        timestamps: { ...prev.timestamps, [perguntaAtual.id]: Date.now() },
      }));
    }
  }, [perguntaAtual?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-lg">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  const moduloInfo = MODULOS.find(m => m.id === draft.moduloAtual);
  const respostaAtual = perguntaAtual ? draft.respostas[perguntaAtual.id] : undefined;
  const isUltima = draft.moduloAtual === 5 && draft.perguntaAtual === (perguntasDoModulo.length - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header com progresso */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              {totalRespondidas}/{totalPerguntas} perguntas
            </span>
            <span className="text-sm font-mono text-cyan-400">
              {Math.round(progresso)}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {/* Indicadores de módulo */}
          <div className="flex gap-1 mt-2">
            {MODULOS.map(m => (
              <div
                key={m.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  m.id < draft.moduloAtual ? "bg-emerald-400"
                  : m.id === draft.moduloAtual ? "bg-cyan-400"
                  : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Badge do módulo */}
        <motion.div
          key={draft.moduloAtual}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${moduloInfo?.cor} text-white text-sm font-medium shadow-lg`}>
            <span className="text-lg">{moduloInfo?.icone}</span>
            <span>Módulo {draft.moduloAtual} — {moduloInfo?.nome}</span>
          </div>
        </motion.div>

        {/* Pergunta com animação */}
        <AnimatePresence mode="wait">
          {perguntaAtual && (
            <motion.div
              key={perguntaAtual.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold leading-tight mb-2">
                  {perguntaAtual.pergunta}
                </h2>
                {perguntaAtual.descricao && (
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {perguntaAtual.descricao}
                  </p>
                )}
              </div>

              {/* Opções de resposta — Escala 0-10 */}
              {perguntaAtual.tipo === "escala" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500 px-1">
                    <span>Nenhum</span>
                    <span>Extremo</span>
                  </div>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handleResponder(i)}
                        className={`aspect-square rounded-lg text-sm font-bold transition-all duration-200 ${
                          respostaAtual === i
                            ? "bg-cyan-400 text-slate-900 scale-110 shadow-lg shadow-cyan-400/30"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:scale-105"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opções customizadas */}
              {perguntaAtual.tipo === "multipla_escolha" && perguntaAtual.opcoes && (
                <div className="space-y-2">
                  {(perguntaAtual.opcoes as any[]).map((opcao: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleResponder(opcao.valor)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                        respostaAtual === opcao.valor
                          ? "bg-cyan-400/20 border-2 border-cyan-400 text-white"
                          : "bg-slate-700/30 border-2 border-transparent text-slate-300 hover:bg-slate-700/50"
                      }`}
                    >
                      <span className="font-medium">{opcao.texto}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Texto livre */}
              {perguntaAtual.tipo === "texto_livre" && (
                <textarea
                  value={(respostaAtual as string) ?? ""}
                  onChange={(e) => handleResponder(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="w-full h-32 bg-slate-700/30 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none transition-colors"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={handleAnterior}
            disabled={draft.moduloAtual === 1 && draft.perguntaAtual === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={handleProximo}
            disabled={respostaAtual === undefined}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              respostaAtual !== undefined
                ? isUltima
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isUltima ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Finalizar
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Indicador de autosave */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-slate-500">
          <Save className="w-3 h-3" />
          <span>Suas respostas são salvas automaticamente</span>
        </div>
      </div>
    </div>
  );
}
