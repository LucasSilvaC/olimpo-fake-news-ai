# Olimpo — Fake News AI (Kahoot de Combate à Desinformação)

> **Status do Projeto**: Em desenvolvimento ativo.  
> **Fase Atual**: Motor de Ingestão e Extração de Notícias implementado e validado + Base arquitetural Next.js 16 com Clean Architecture.  
> **Próxima Fase**: Implementação da interface do jogo (modos multiplayer e solo) com salas, dinâmica de perguntas e ranking.
> **Parcerias**: Pucc + Instituto de pesquisas Eldorado

---

## 📌 1. Visão Geral do Projeto: O que é o Olimpo?

O **Olimpo** é uma plataforma gamificada, educativa e colaborativa desenhada para conscientizar e treinar cidadãos, estudantes e equipes no reconhecimento de notícias falsas (_fake news_) e na identificação de fatos jornalísticos verídicos.

Inspirado na dinâmica competitiva do Kahoot, o Olimpo coloca jogadores em salas multiplayer ou solo onde todos enfrentam rodadas cronometradas com manchetes reais e desafiadoras.

### 🎮 Dinâmica e Mecânicas de Jogo

- **Salas Multiplayer e Solo**: Os participantes podem jogar individualmente ou ingressar em partidas coletivas através de código PIN ou link de convite.
- **Rodadas sob Pressão com Tempo Limite**: A cada rodada, o participante analisa a manchete, fonte sugerida, recorte de texto e imagem antes do cronômetro zerar, decidindo entre:
  - ✖ **É FAKE NEWS** (Boato / Desinformação)
  - ✔ **É FATO REAL** (Notícia Verídica / Jornalismo Investigativo)
  - ❓ **TENHO DÚVIDA** (Necessidade de checagem mais aprofundada)
- **Mecânica de Blefe Colaborativo (User-Generated Challenges)**: Além das notícias de curadoria do sistema, os participantes podem submeter seus próprios desafios autorais. Caso o autor cadastre uma notícia falsa convincente e outros jogadores votem como fato verídico, o autor recebe pontuação bônus de blefe por cada participante induzido ao erro.
- **Feedback Educativo Instantâneo**: Ao encerramento de cada rodada, o sistema revela o gabarito real, exibe a distribuição percentual dos votos da sala e apresenta uma justificativa pedagógica com critérios de fact-checking jornalístico.
- **Ranking Gamificado e Conquistas**: Pódio visual com pontuação acumulada (combinando acertos, rapidez nas respostas e blefes bem-sucedidos) e conquistas/badges temáticas desbloqueáveis ao longo da partida.

## 🛠️ 2. Stack de Tecnologias

A aplicação web foi construída sobre uma base técnica moderna e escalável:

### Core & Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components e Route Handlers).
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode ativo).
- **Biblioteca de Interface**: [React 19](https://react.dev/).
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com PostCSS.
- **Ícones & Primitivas**: [Lucide React](https://lucide.dev/), `class-variance-authority` (`cva`), `clsx`, `tailwind-merge`.
- **Temas**: `next-themes` (suporte a Dark / Light Mode).

### Engine de Ingestão e Parsing (Backend)

- **Motor DOM**: [JSDOM](https://github.com/jsdom/jsdom) (sem execução de scripts por segurança).
- **Heurística de Conteúdo**: [@mozilla/readability](https://github.com/mozilla/readability).
- **Cliente HTTP Seguro**: [Undici](https://github.com/nodejs/undici) com dispatcher customizado e DNS pinning para neutralizar DNS rebinding.
- **Validação de Redes/IPs**: [ipaddr.js](https://github.com/whitequark/ipaddr.js) para validação exata de IPv4/IPv6 privados e reservados.
- **Fallback Externo**: [Jina Reader API](https://jina.ai/reader/) (operação em modo JSON puro).
- **Validação de Esquemas**: [Zod v4](https://zod.dev/).

### Machine Learning e Análise de Dados (Pipeline Complementar)

- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" width="28" height="28" valign="middle"> **Python**: linguagem para experimentos, preparação de dados e pipelines de classificação.
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" alt="scikit-learn" width="28" height="28" valign="middle"> **[scikit-learn](https://scikit-learn.org/)**: treinamento, avaliação e prototipação dos modelos de aprendizado de máquina.

### Persistência & Arquitetura de Software

- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) com Drizzle Kit (migrações prontas para schema relacional).
- **Driver de Banco**: [postgres.js](https://github.com/porsager/postgres) (preparado para PostgreSQL).
- **Padrão de Camadas**: **Clean Architecture** na pasta `src/server/` (`domain`, `application`, `infrastructure`, `presentation`, `composition-root.ts`) e **Atomic/Feature-Sliced** no frontend (`src/views`, `src/widgets`, `src/features`, `src/entities`, `src/components`).

### Qualidade e Testes

- **Testes Unitários & Integração**: [Vitest](https://vitest.dev/) v4 com cobertura v8.
- **Testes End-to-End**: [Playwright](https://playwright.dev/).
- **Linters e Formatadores**: ESLint 9, Prettier, TypeScript-ESLint.
- **Git Hooks**: Husky e Commitlint (Conventional Commits).

---

## 🚀 3. Como Executar o Projeto Localmente

### Pré-requisitos

- **Node.js**: `24.15` ou superior (compatível com Node 22.22.2+).
- **Gerenciador de Pacotes**: `pnpm` (versão 11+ recomendada) ou `npm`.

### Passos de Instalação e Execução

```powershell
# 1. Navegar até o diretório da aplicação
Set-Location -LiteralPath 'C:\Users\CUL7CA\Desktop\ElDorado\app\web-app'

# 2. Instalar as dependências
pnpm install

# 3. Iniciar o servidor de desenvolvimento (escuta em 127.0.0.1)
pnpm dev
```

Abra seu navegador em <http://127.0.0.1:3000>.

> 💡 **Variáveis de Ambiente**:  
> A chave do Jina Reader (`JINA_API_KEY`) é totalmente **opcional** para desenvolvimento local. Se desejar configurá-la, copie `.env.example` para `.env.local` e preencha o valor no arquivo local. Nunca use o prefixo `NEXT_PUBLIC_` para manter a chave segura no servidor.

### Comandos de Teste e Validação

```powershell
# Executar suíte completa de validação (lint + typecheck + testes unitários + build)
pnpm validate

# Executar testes unitários com Vitest
pnpm test:unit

# Executar verificação de tipos TypeScript
pnpm typecheck

# Executar testes E2E com Playwright
pnpm test:e2e
```

---

## 📚 4. Referências e Documentação Adicional

- [Documento de Arquitetura de Software](docs/architecture.md)
- [Relatório de Validação de Rede em Produção](validation/REPORT.md)
- [Jina Reader: Documentação Oficial](https://github.com/jina-ai/reader#using-request-headers)
