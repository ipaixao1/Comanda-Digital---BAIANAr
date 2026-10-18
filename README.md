# BAIANAr — Comanda Digital

## Sobre o projeto

O **BAIANAr** é uma comanda digital desenvolvida como trabalho acadêmico por estudantes do **3º semestre do curso de Análise e Desenvolvimento de Sistemas**. O sistema simula a operação completa de um restaurante de comida baiana, integrando em um único ecossistema: o cardápio digital para o cliente, o painel administrativo do restaurante, a tela de produção da cozinha (KDS) e o aplicativo do motoboy responsável pelas entregas.

A proposta do projeto é demonstrar, na prática, conceitos de desenvolvimennto web moderno, persistência de dados em tempo real, controle de permissões por perfil de usuário e integração entre múltiplas interfaces (cliente, administração, cozinha e entrega) dentro de uma única aplicação.

---

## Tecnologias utilizadas

O BAIANAr foi desenvolvido com:

- **Angular** — framework principal da aplicação, utilizando componentes standalone, Signals e roteamento por lazy loading
- **TypeScript** — linguagem de programação utilizada em toda a lógica da aplicação
- **HTML** — estruturação dos templates de cada componente
- **SCSS** — estilização visual de todas as telas do sistema

> ⚠️ **Sprint atual (Back-end Java):** o Firebase/Firestore foi totalmente removido do front. Ver seção [Migração: saída do Firebase](#migração-saída-do-firebase) abaixo para detalhes de como cada tela persiste dados agora.

---

## Credenciais de acesso

### 🖥️ Dashboard (Administrativo) — rota `/login`

| Matrícula | Senha    | Nome              | Cargo       |
|-----------|----------|-------------------|-------------|
| ADM001    | 123456   | Eliacira Santos   | Dono        |
| ADM002    | 12345    | Isabel Paixão     | Gerente     |
| ADM003    | 1234     | Eliza Moreira     | Gerente     |
| ADM004    | 123      | Evellyn Reis      | Gerente     |
| ADM005    | 12       | Lucas Oliveira    | Supervisor  |

**Regras de permissão por cargo:**
- **Dono** — acesso total ao sistema; pode visualizar e editar/excluir/adicionar em todas as páginas.
- **Gerente** — acesso de visualização a todas as páginas, mas só pode editar/excluir/adicionar em **Cardápio**, **Funcionários**, **Motoboys** e **Avaliações**. Nas demais páginas (Pedidos, Administradores, Estoque, Fornecedores) o acesso é somente leitura.
- **Supervisor** — acesso restrito apenas a **Início (Dashboard)**, **Cardápio**, **Funcionários**, **Motoboys** e **Avaliações**, com permissão de edição completa nessas páginas. Não consegue acessar nem visualizar as demais páginas do sistema.

### 👨‍🍳 KDS (Cozinha) — rota `/login`

| Matrícula | Senha   | Nome     |
|-----------|---------|----------|
| KDS001    | 123456  | Cozinha  |

Após o login, usuários com este perfil são redirecionados automaticamente para a tela do KDS (`/kds`), onde acompanham os pedidos recebidos, controlam o estoque por categoria e habilitam/desabilitam pratos do cardápio.

### 🛵 Motoboy — rota `/motoboy/login`

| Matrícula | Senha | Nome             | Veículo              |
|-----------|-------|------------------|----------------------|
| MB001     | 1234  | Carlos Souza     | Moto Honda CG 160    |
| MB002     | 1234  | Rafael Lima      | Moto Yamaha Factor   |
| MB003     | 1234  | Diego Ferreira   | Moto Biz 125         |

### 📱 Cliente (Mobile)

O fluxo do cliente não exige login para navegar pelo cardápio. O cadastro/login só é solicitado ao acompanhar pedidos ou finalizar uma compra, e é feito diretamente pela interface mobile (rota `/mobile/cardapio`, que é a página inicial do sistema).

---

## Paleta de cores

| Cor                | Hex        | Uso principal                                  |
|---------------------|-----------|-------------------------------------------------|
| 🟧 Dourado (Accent)  | `#F29F05` | Cor de destaque — botões, ícones, títulos, bordas |
| 🟧 Dourado escuro    | `#F28705` | Hover de botões e variações do dourado principal |
| 🟤 Marrom            | `#734002` | Fundos de cards de destaque (KPIs, badges)       |
| 🟣 Fundo (admin)     | `#302C40` | Plano de fundo das páginas administrativas        |
| 🟣 Fundo (mobile)    | `#2D2B3D` | Plano de fundo do app mobile do cliente            |
| 🟪 Card (admin)      | `#3A3550` | Fundo dos cards e tabelas no painel administrativo |
| 🟪 Superfície (mobile)| `#383650` | Fundo dos cards e seções no app mobile           |
| ⚪ Branco             | `#FFFFFF` | Textos principais e títulos                       |
| ⚪ Texto secundário   | `#9B93B0` | Textos auxiliares e descrições no mobile           |
| 🟢 Sucesso           | `#2ECC71` | Status "Normal", "Disponível", "Entregue"          |
| 🔴 Erro/Crítico      | `#E74C3C` | Status "Crítico", exclusões, alertas               |

**Tipografia:**
- **Cormorant Garamond** (itálico) — títulos e elementos de destaque, transmitindo a identidade elegante do restaurante
- **Poppins** — corpo de texto, rótulos, formulários e conteúdo geral

---

## Estrutura do projeto

```
baianar/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts            # Protege rotas da Dashboard e do KDS
│   │   │   ├── motoboy.guard.ts         # Protege rotas do app do motoboy
│   │   │   └── page-access.guard.ts     # Controla acesso por cargo (Dono/Gerente/Supervisor)
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts              # Autenticação da Dashboard/KDS
│   │   │   ├── permission.service.ts        # Regras de permissão por cargo
│   │   │   ├── cliente-auth.service.ts      # Autenticação do cliente (mobile)
│   │   │   ├── motoboy-auth.service.ts      # Autenticação do motoboy
│   │   │   ├── motoboy-data.service.ts      # Cadastro e métricas dos motoboys (localStorage)
│   │   │   ├── pedido.service.ts            # Pedidos (localStorage — candidato a religar à API real)
│   │   │   ├── carrinho.service.ts          # Carrinho de compras do cliente
│   │   │   ├── admin-data.service.ts        # Cardápio, estoque, funcionários, admins e fornecedores (localStorage)
│   │   │   ├── estoque.service.ts           # Sincronização de status do estoque (KDS ↔ Admin) (localStorage)
│   │   │   ├── cardapio-status.service.ts   # Sincronização de disponibilidade de pratos (KDS ↔ Admin ↔ Mobile) (localStorage)
│   │   │   ├── avaliacao.service.ts         # Avaliações dos clientes (localStorage)
│   │   │   ├── local-store.util.ts          # Helper de persistência local (substitui o Firestore)
│   │   │   └── entregas.service.ts          # Apoio às entregas do motoboy
│   │   │
│   │   ├── pages/
│   │   │   ├── login/                  # Login da Dashboard/KDS
│   │   │   ├── dashboard/              # Painel inicial com indicadores (Início)
│   │   │   ├── cardapio/               # Gestão do cardápio (admin)
│   │   │   ├── pedidos/                # Gestão de pedidos (admin)
│   │   │   ├── funcionarios/           # Gestão de funcionários
│   │   │   ├── administradores/        # Gestão de administradores
│   │   │   ├── estoque/                # Controle de estoque
│   │   │   ├── fornecedores/           # Cadastro de fornecedores
│   │   │   ├── motoboys-admin/         # Gestão de motoboys (admin)
│   │   │   ├── avaliacoes/             # Avaliações dos clientes e respostas do restaurante
│   │   │   ├── perfil/                 # Perfil do administrador logado
│   │   │   ├── kds/                    # Tela de produção da cozinha
│   │   │   │
│   │   │   ├── mobile/                 # Todo o fluxo do cliente (página inicial do sistema)
│   │   │   │   ├── cardapio/           # Cardápio do cliente
│   │   │   │   ├── buscar/             # Busca de produtos
│   │   │   │   ├── descricao/          # Detalhes do produto
│   │   │   │   ├── carrinho/           # Carrinho de compras
│   │   │   │   ├── finalizar-pedido/   # Checkout, pagamento (Pix/Cartão/Dinheiro)
│   │   │   │   ├── status-pedido/      # Acompanhamento do pedido em tempo real
│   │   │   │   ├── pedidos/            # Histórico de pedidos do cliente
│   │   │   │   ├── avaliacao/          # Avaliação do pedido entregue
│   │   │   │   ├── perfil/             # Perfil do cliente
│   │   │   │   ├── enderecos/          # Endereços salvos
│   │   │   │   ├── favoritos/          # Produtos favoritos
│   │   │   │   └── configuracao/       # Configurações da conta
│   │   │   │
│   │   │   └── motoboy/                # Todo o fluxo do entregador
│   │   │       ├── login/              # Login do motoboy
│   │   │       ├── entregas/           # Lista de entregas disponíveis/em andamento
│   │   │       └── entrega-detalhe/    # Detalhes e ações de uma entrega
│   │   │
│   │   ├── shared/
│   │   │   └── components/
│   │   │       └── shell/              # Layout da Dashboard (sidebar + navegação)
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts               # Configuração raiz (HttpClient, rotas) — sem Firebase
│   │   └── app.routes.ts               # Definição de todas as rotas da aplicação
│   │
│   ├── assets/
│   │   └── images/                     # Imagens dos pratos e logo do restaurante
│   │
│   ├── environments/
│   │   ├── environment.ts              # apiUrl do backend (desenvolvimento) — ex.: http://localhost:8080/api
│   │   └── environment.prod.ts         # apiUrl do backend (produção)
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

---

## Como rodar o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Rodar em ambiente de desenvolvimento

```bash
npm start
```

A aplicação abrirá automaticamente no fluxo do cliente (mobile), que é a porta de entrada padrão do sistema. Para acessar a Dashboard administrativa ou o KDS, navegue manualmente até `/login`. Para acessar o app do motoboy, navegue até `/motoboy/login`.

---

## Fluxo geral do sistema

1. **Cliente (mobile)** — navega pelo cardápio, monta o carrinho, finaliza o pedido escolhendo a forma de pagamento (Pix, Cartão ou Dinheiro) e acompanha o status em tempo real.
2. **Cozinha (KDS)** — recebe o pedido instantaneamente, avança o status conforme o preparo (Recebido → Em preparo → Pronto → Enviado) e controla a disponibilidade de ingredientes e pratos.
3. **Administração (Dashboard)** — acompanha todos os pedidos, gerencia cardápio, estoque, funcionários, fornecedores, motoboys e responde às avaliações dos clientes, com permissões diferentes de acordo com o cargo de cada administrador.
4. **Motoboy** — recebe a notificação de novo pedido pronto para entrega, aceita a corrida e confirma a entrega, atualizando o status para o cliente e para a administração em tempo real.

---

## Migração: saída do Firebase

Nesta sprint o back-end passou a ser um serviço próprio em **Java Spring Boot + MySQL** (ver `../backend`), então toda conexão com o Firebase/Firestore foi removida do front, conforme exigido pelo enunciado do projeto. Como nem toda tela do front tem um endpoint equivalente no novo backend (algumas — como Funcionários e Administradores por cargo — não fazem parte do escopo do SRS v3.2), a migração seguiu duas estratégias, tela por tela:

### 1. Dados sem equivalente no backend → localStorage (mock local)
Os serviços abaixo tinham `@angular/fire/firestore` (`onSnapshot`, `addDoc`, `updateDoc`, `deleteDoc`, `setDoc`) e foram reescritos para usar `signal()` + `localStorage`, através do helper `services/local-store.util.ts`. **A interface pública (tipos exportados e assinaturas dos métodos) foi mantida exatamente igual**, então nenhum componente que consome esses serviços precisou ser alterado:

- `admin-data.service.ts` (Cardápio, Estoque/produtos, Funcionários, Administradores, Fornecedores)
- `pedido.service.ts` (Pedidos)
- `estoque.service.ts` (status de estoque KDS ↔ Admin)
- `cardapio-status.service.ts` (disponibilidade de pratos KDS ↔ Admin ↔ Mobile)
- `avaliacao.service.ts` (avaliações dos clientes)
- `motoboy-data.service.ts` (cadastro de motoboys)

Isso quer dizer que, por enquanto, esses dados vivem **somente no navegador de cada usuário** (sem sincronização em tempo real entre dispositivos diferentes, como existia com o Firestore) — suficiente para demonstrar o fluxo da aplicação, mas não para produção.

### 2. Jornada do cliente → API real (Spring Boot)
As telas do cliente (`/mobile/*`) falam com o backend via `HttpClient` (`environment.apiUrl`). O código fica em `src/app/services/api/`:

| Arquivo | Função |
|---|---|
| `auth.interceptor.ts` | anexa `Authorization: Bearer <JWT>` nas chamadas à API; em caso de 401 limpa a sessão |
| `auth-token.ts` | guarda o JWT no `localStorage` |
| `api-types.ts` | tipos que espelham os DTOs do backend |
| `cardapio-api.service.ts` | `GET /api/cardapio` e `GET /api/cardapio/{id}` (RF-001, RF-002) |
| `pedido-api.service.ts` | `POST /api/pedidos`, `GET /api/pedidos/meus`, `GET /api/pedidos/{id}/status` (RF-006, RF-007, RF-008) |
| `pedido-status.util.ts` | timeline `RECEBIDO > CONFIRMADO > EM_PREPARO > PRONTO > SAIU_ENTREGA` |
| `../cliente-auth.service.ts` | `POST /api/auth/register` e `/login` (RF-004, RF-005) |

Fluxo (SRS §8.1): cardápio público → detalhe do prato (quantidade + observação) → carrinho (observação por item, local) →
**Continuar para pagamento**: se não estiver logado vai para login/cadastro e volta ao checkout → **Confirmar** cria o pedido
(`RECEBIDO`) → status com atualização automática a cada 5 s → histórico em **Pedidos** (atualiza a cada 10 s).
O pagamento (Pix/cartão/dinheiro) é simulado, como pede o SRS.

Para testar: `cliente@email.com` / `senha123` (seed do backend) ou crie uma conta nova.

### 3. O que ainda NÃO está ligado à API (próximos passos da dupla)
- **KDS, painel admin (Pedidos, Cardápio, Estoque, Fornecedores…) e Motoboy** continuam lendo o `localStorage`
  (`pedido.service.ts` etc.). Por isso **pedidos feitos pelo cliente via API ainda não aparecem no KDS/painel do front** —
  eles já existem no backend (`/api/admin/**`, perfis ADMIN/GERENTE/COZINHEIRO) e precisam ser religados por quem ficou com o painel.
- Telas sem requisito no SRS (Favoritos, Endereços salvos, Configurações, Avaliações, Funcionários, Motoboys) seguem locais.

### Checklist
- [x] Removido `@angular/fire` e `firebase` do `package.json`
- [x] `environment.ts` / `environment.prod.ts` expõem `apiUrl` (sem config do Firebase)
- [x] `angular.json` — `fileReplacements` da build de produção corrigido
- [x] `app.config.ts` — sem providers do Firebase; `provideHttpClient(withInterceptors([authInterceptor]))`
- [x] Serviços que usavam Firestore reescritos para `localStorage`, preservando a API pública
- [x] Cadastro/login do cliente, cardápio, detalhe, carrinho, checkout, histórico e acompanhamento de status ligados à API
- [ ] Trocar o `apiUrl` de `environment.prod.ts` pela URL do backend no Railway antes do deploy no Vercel
- [ ] Religar KDS/painel admin à API
