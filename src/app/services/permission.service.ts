import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Regras de permissão por cargo:
 *
 * Dono       → acesso total a todas as páginas, pode editar/excluir/adicionar em qualquer uma.
 * Gerente    → acesso a todas as páginas, mas só pode editar/excluir/adicionar em:
 *              Cardápio, Funcionários, Motoboys e Avaliações (responder).
 *              Nas demais páginas (Pedidos, Administradores, Estoque, Fornecedores)
 *              o acesso é somente leitura — ações de escrita ficam ocultas/desabilitadas.
 * Supervisor → só pode ACESSAR (navegar) as páginas: Cardápio, Funcionários,
 *              Motoboys e Avaliações. Não vê nem acessa as demais páginas do sistema.
 */

// Rotas que Gerente e Supervisor podem editar (mesmo conjunto para ambos)
const PAGINAS_EDITAVEIS = ['cardapio', 'funcionarios', 'motoboys', 'avaliacoes'];

// Rotas que o Supervisor pode acessar — Início + as 4 páginas liberadas.
const PAGINAS_SUPERVISOR = ['dashboard', 'cardapio', 'funcionarios', 'motoboys', 'avaliacoes'];

@Injectable({ providedIn: 'root' })
export class PermissionService {

  private auth = inject(AuthService);

  private cargoAtual(): string {
    return this.auth.getCurrentUser()?.cargo ?? '';
  }

  isDono(): boolean       { return this.cargoAtual() === 'Dono'; }
  isGerente(): boolean    { return this.cargoAtual() === 'Gerente'; }
  isSupervisor(): boolean { return this.cargoAtual() === 'Supervisor'; }

  /**
   * Pode ACESSAR (navegar até) a rota informada (ex: 'cardapio', 'estoque').
   * Dono e Gerente acessam tudo. Supervisor só acessa as páginas liberadas.
   */
  podeAcessarPagina(rota: string): boolean {
    if (this.isDono() || this.isGerente()) return true;
    if (this.isSupervisor()) return PAGINAS_SUPERVISOR.includes(rota);
    return false;
  }

  /**
   * Pode EDITAR/EXCLUIR/ADICIONAR dentro da página informada.
   * Dono pode em qualquer página. Gerente e Supervisor só nas páginas liberadas.
   */
  podeEditar(rota: string): boolean {
    if (this.isDono()) return true;
    if (this.isGerente() || this.isSupervisor()) return PAGINAS_EDITAVEIS.includes(rota);
    return false;
  }
}
