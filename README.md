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
- **Firebase (Firestore)** — banco de dados em tempo real, responsável por persistir pedidos, cardápio, estoque, funcionários, administradores, fornecedores, motoboys e avaliações

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
│   │   │   ├── motoboy-data.service.ts      # Cadastro e métricas dos motoboys (Firestore)
│   │   │   ├── pedido.service.ts            # Pedidos em tempo real (Firestore)
│   │   │   ├── carrinho.service.ts          # Carrinho de compras do cliente
│   │   │   ├── admin-data.service.ts        # Cardápio, estoque, funcionários, admins e fornecedores (Firestore)
│   │   │   ├── estoque.service.ts           # Sincronização de status do estoque (KDS ↔ Admin)
│   │   │   ├── cardapio-status.service.ts   # Sincronização de disponibilidade de pratos (KDS ↔ Admin ↔ Mobile)
│   │   │   ├── avaliacao.service.ts         # Avaliações dos clientes (Firestore)
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
│   │   ├── app.config.ts               # Configuração raiz (providers do Firebase, rotas)
│   │   └── app.routes.ts               # Definição de todas as rotas da aplicação
│   │
│   ├── assets/
│   │   └── images/                     # Imagens dos pratos e logo do restaurante
│   │
│   ├── environments/
│   │   ├── environment.ts              # Configuração do Firebase (desenvolvimento)
│   │   └── environment.prod.ts         # Configuração do Firebase (produção)
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

Todas as informações são sincronizadas via Firebase Firestore, garantindo que qualquer atualização feita em uma tela reflita instantaneamente nas demais, mesmo após o recarregamento da página.
