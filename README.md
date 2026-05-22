<<<<<<< HEAD
# BAIANAr – Sistema de Gestão

Projeto Angular 17 com Firebase.

---

## 📁 Estrutura do Projeto

```
baianar/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # Protege rotas autenticadas
│   │   ├── pages/
│   │   │   └── login/
│   │   │       ├── login.component.ts
│   │   │       ├── login.component.html
│   │   │       └── login.component.scss
│   │   ├── services/
│   │   │   └── auth.service.ts        # Serviço de autenticação
│   │   ├── app.component.ts
│   │   ├── app.config.ts              # Configuração raiz (providers)
│   │   └── app.routes.ts              # Rotas
│   ├── assets/
│   │   └── images/
│   │       └── logo-baianar.png       # ← COLOQUE A LOGO AQUI
│   ├── environments/
│   │   ├── environment.ts             # Dev (preencha com suas credenciais Firebase)
│   │   └── environment.prod.ts        # Prod
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

---

## 🚀 Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Adicionar a logo

Coloque o arquivo `logo-baianar.png` em:
```
src/assets/images/logo-baianar.png
```

### 3. Configurar o Firebase

Edite `src/environments/environment.ts` com as credenciais do seu projeto Firebase:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  }
};
```

> As credenciais estão no Console Firebase → Configurações do projeto → Seus apps.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm start
# ou
ng serve
```

Acesse: `http://localhost:4200`

---

## 🔐 Login temporário

| Matrícula | Senha  |
|-----------|--------|
| ADM001    | 123456 |

> Para usar Firebase Authentication, edite `src/app/services/auth.service.ts`
> e descomente/implemente o método com `signInWithEmailAndPassword`.

---

## 🎨 Identidade Visual

| Elemento         | Valor     |
|-----------------|-----------|
| Fundo principal  | `#302C40` |
| Destaque (ouro)  | `#F29F05` |
| Destaque 2       | `#F28705` |
| Marrom           | `#734002` |
| Dourado suave    | `#D9A05B` |
| Títulos          | Cormorant Garamond Light 300 Italic |
| Textos           | Poppins ExtraLight 200 Italic       |

---

## 📦 Tecnologias

- **Angular 17** (standalone components, signals-ready)
- **Firebase 10** via `@angular/fire`
- **TypeScript 5.4**
- **SCSS** para estilos


