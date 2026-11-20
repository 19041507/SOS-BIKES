import type { ChamadoCompleto, MecanicoDisponivel } from "@/lib/chamados";
import type { DadosDoPainel } from "@/lib/dashboard-mecanico";
import type { Perfil } from "@/lib/supabase/database.types";
import type { MecanicoFavorito } from "@/lib/favoritos";

export function dadosDaPrevia() {
  const agora = Date.now();
  const horario = (minutos: number) => new Date(agora - minutos * 60_000).toISOString();
  const ciclista: Perfil = {
    id: "previa-ciclista", tipo: "ciclista", nome: "Ana Souza", telefone: null,
    oficina: null, disponivel: false, criado_em: horario(43_200),
  };
  const mecanico: Perfil = {
    id: "previa-mecanico", tipo: "mecanico", nome: "Lucas Ferreira", telefone: null,
    oficina: "Oficina BikeFast", disponivel: true, criado_em: horario(43_200),
  };
  const chamado: ChamadoCompleto = {
    id: "previa-atendimento", ciclista_id: ciclista.id, mecanico_id: mecanico.id,
    categoria: "pneu", detalhes: "Pneu traseiro furou na ciclofaixa.",
    endereco: "R. da Aurora, 300 — Boa Vista, Recife", status: "concluido",
    estimativa: 25, tempo_chegada_min: 6, valor_final: 30, comissao: 3,
    motivo_variacao: "Foi necessário trocar a câmara de ar.", motivo_cancelamento: null,
    criado_em: horario(90), aceito_em: horario(89), confirmado_em: horario(88),
    chegada_em: horario(82), concluido_em: horario(60), encerrado_em: null,
    ciclista, mecanico,
    avaliacao_ciclista: null,
    avaliacao: { chamado_id: "previa-atendimento", nota: 5, comentario: "Chegou rápido e resolveu na hora!", gorjeta: 5, criado_em: horario(58) },
  };
  const historico: ChamadoCompleto[] = [
    chamado,
    { ...chamado, id: "previa-corrente", categoria: "corrente", estimativa: 40, valor_final: 40, comissao: 4, motivo_variacao: null, criado_em: horario(2880), concluido_em: horario(2820) },
    { ...chamado, id: "previa-cancelado", categoria: "freio", status: "cancelado", estimativa: null, valor_final: null, comissao: null, criado_em: horario(4320), aceito_em: null, confirmado_em: null, chegada_em: null, concluido_em: null, encerrado_em: horario(4319), motivo_cancelamento: "Consegui ajuda de outra forma.", avaliacao: null },
  ];
  const mechanics: MecanicoDisponivel[] = [
    { id: mecanico.id, nome: mecanico.nome, oficina: mecanico.oficina, telefone: null, media: 4.9, avaliacoes: 38, atendimentos: 62 },
    { id: "previa-julia", nome: "Júlia Santos", oficina: "Pedal Oficina", telefone: null, media: 4.8, avaliacoes: 24, atendimentos: 41 },
    { id: "previa-pedro", nome: "Pedro Lima", oficina: null, telefone: null, media: 4.7, avaliacoes: 16, atendimentos: 29 },
  ];
  const painel: DadosDoPainel = {
    hoje: { atendimentos: 3, liquido: 126 }, semana: 468, semanaAnterior: 396,
    mes: { atendimentos: 24, liquido: 1080 },
    grafico: [54, 81, 36, 72, 45, 54, 126].map((liquido, i) => ({ dia: new Date(agora - (6 - i) * 86_400_000), liquido })),
    aceite: { aceitos: 24, recebidos: 27 },
    tempos: { resposta: 0.6, chegada: 7, chegadaEstimada: 8, atendimento: 18 },
    gorjetas: { total: 65, quantidade: 9 },
    recentes: historico.filter(c => c.status === "concluido").map(c => ({ id: c.id, categoria: c.categoria, ciclista: ciclista.nome, liquido: c.valor_final! - c.comissao!, concluidoEm: c.concluido_em! })),
    avaliacoes: [{ id: chamado.id, nota: 5, comentario: chamado.avaliacao!.comentario, ciclista: ciclista.nome }],
    media: 4.9, totalDeAvaliacoes: 38,
  };
  const resumo = {
    ultimo: { id: chamado.id, categoria: chamado.categoria, valor_final: chamado.valor_final, concluido_em: chamado.concluido_em, mecanico: { nome: mecanico.nome, oficina: mecanico.oficina }, avaliacao: { nota: 5 } },
    chamadosNoMes: 2, gastoNoMes: 70,
  };
  const catalogoFavoritos: MecanicoFavorito[] = [
    ...mechanics.map(m => ({ ...m, disponivel: true })),
    { id: "previa-marina", nome: "Marina Costa", oficina: "Oficina Boa Viagem", disponivel: false, media: 4.9, avaliacoes: 18, atendimentos: 30 },
  ];
  const favoritos = [catalogoFavoritos[1], catalogoFavoritos[3]];
  return { ciclista, mecanico, chamado, historico, mechanics, painel, resumo, agora, favoritos, catalogoFavoritos };
}
