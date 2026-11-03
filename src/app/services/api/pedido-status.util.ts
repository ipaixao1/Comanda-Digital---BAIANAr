import { StatusPedidoApi } from './api-types';

/** Linha do tempo exigida pelo SRS (RF-007): RECEBIDO > CONFIRMADO > EM_PREPARO > PRONTO > SAIU_ENTREGA. */
export type IconeEtapa = 'check' | 'chef' | 'box' | 'bike' | 'done';
export type EstadoEtapa = 'concluido' | 'atual' | 'pendente';

export interface EtapaTimeline {
  status: StatusPedidoApi;
  titulo: string;
  icone: IconeEtapa;
  estado: EstadoEtapa;
}

const ETAPAS: { status: StatusPedidoApi; titulo: string; icone: IconeEtapa }[] = [
  { status: 'RECEBIDO',     titulo: 'Pedido recebido',   icone: 'check' },
  { status: 'CONFIRMADO',   titulo: 'Pedido confirmado', icone: 'done'  },
  { status: 'EM_PREPARO',   titulo: 'Em preparo',        icone: 'chef'  },
  { status: 'PRONTO',       titulo: 'Pronto',            icone: 'box'   },
  { status: 'SAIU_ENTREGA', titulo: 'Saiu para entrega', icone: 'bike'  },
];

export function isFinal(status: StatusPedidoApi): boolean {
  return status === 'FINALIZADO' || status === 'CANCELADO';
}

export function calcularTimeline(status: StatusPedidoApi): EtapaTimeline[] {
  const idxAtual = ETAPAS.findIndex(e => e.status === status);

  return ETAPAS.map((e, i) => {
    let estado: EstadoEtapa;
    if (status === 'FINALIZADO') {
      estado = 'concluido';            // entregue: todas as etapas concluídas
    } else if (status === 'CANCELADO') {
      estado = 'pendente';
    } else if (i < idxAtual) {
      estado = 'concluido';
    } else if (i === idxAtual) {
      estado = 'atual';
    } else {
      estado = 'pendente';
    }
    return { ...e, estado };
  });
}

export function labelStatus(status: StatusPedidoApi): string {
  const map: Record<StatusPedidoApi, string> = {
    RECEBIDO:     'Recebido',
    CONFIRMADO:   'Confirmado',
    EM_PREPARO:   'Em preparo',
    PRONTO:       'Pronto',
    SAIU_ENTREGA: 'Saiu para entrega',
    FINALIZADO:   'Entregue',
    CANCELADO:    'Cancelado',
  };
  return map[status] ?? status;
}

/** Estimativa de tempo do pedido (calculada pelo backend), já com a data convertida para ISO com "Z". */
export interface EstimativaTempo {
  preparoMin: number;
  entregaMin: number;
  totalMin: number;
  /** Momento previsto de chegada, ISO (UTC). */
  previsaoEntregaEm: string | null;
}

/** O backend devolve LocalDateTime em UTC sem sufixo; acrescenta "Z" para o navegador converter ao fuso local. */
export function isoUtc(utc: string): string {
  return /Z$|[+-]\d{2}:\d{2}$/.test(utc) ? utc : `${utc}Z`;
}

export function paraEstimativa(r: {
  tempoPreparoMin: number; tempoEntregaMin: number; tempoTotalMin: number; previsaoEntregaEm: string | null;
}): EstimativaTempo {
  return {
    preparoMin: r.tempoPreparoMin,
    entregaMin: r.tempoEntregaMin,
    totalMin: r.tempoTotalMin,
    previsaoEntregaEm: r.previsaoEntregaEm ? isoUtc(r.previsaoEntregaEm) : null,
  };
}

/** Minutos que faltam até a previsão de chegada (0 se já passou ou se não há previsão). */
export function minutosRestantes(est: EstimativaTempo | null, agora: number): number {
  if (!est?.previsaoEntregaEm) return 0;
  const ms = new Date(est.previsaoEntregaEm).getTime() - agora;
  return Math.max(0, Math.ceil(ms / 60000));
}

/** "HH:mm" no fuso do navegador. */
export function horaPrevista(est: EstimativaTempo | null): string {
  if (!est?.previsaoEntregaEm) return '';
  return new Date(est.previsaoEntregaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** "45 min" ou "1 h 05 min". */
export function formatarMinutos(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')} min`;
}
