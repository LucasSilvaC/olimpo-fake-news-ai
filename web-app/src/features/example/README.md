# Camada Features — Padrão FSD + MVVM

Uma **Feature** representa uma **ação do usuário com valor de negócio** (um fluxo que altera estado, submete formulários ou executa mutações).

## Estrutura Padrão de um Slice de Feature

```text
features/<nome-da-feature>/
├── actions/                  # Server Actions ou integrações de API da feature
│   └── <acao>.action.ts
├── schemas/                  # Validações Zod e schemas de entrada
│   └── <acao>-schema.ts
├── model/                    # Estado e lógica de apresentação (MVVM)
│   └── use-<feature>-view-model.ts
├── components/ ou ui/        # Componentes visuais puros (View <= 150 linhas)
│   └── <feature>-form.tsx
├── README.md                 # Contexto e documentação da feature
└── index.ts                  # Public API exclusiva do slice
```

## Regras de MVVM

1. **View (`components/` ou `ui/`)**: É responsável exclusivamente por renderizar JSX. Não deve conter chamadas diretas de fetch, lógica de transformação de dados ou múltiplos `useState`.
2. **ViewModel (`model/use-*-view-model.ts`)**: É um custom hook que encapsula o estado (`useState`, `useActionState`), efeitos e chamada a Server Actions/APIs, retornando dados prontos e manipuladores para a View.
3. **Public API (`index.ts`)**: Sempre importe elementos da feature através de `@/features/<nome-da-feature>` em vez de caminhos internos profundos.
