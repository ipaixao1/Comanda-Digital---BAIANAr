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
