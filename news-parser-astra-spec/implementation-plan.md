# Plano de execução — News Parser

Data: 2026-09-08. Complexidade: DEEP. SDD: full, com a especificação e arquitetura fornecidas nos documentos 00–05 como fonte canônica.

## Auditoria e autorização

`app` não é um repositório Git. `web-app` existe e está vazia: não há aplicação, dependências, testes ou baseline executável. Implementação em `web-app`, sem alterar o contrato fornecido. O prompt mestre autoriza criar arquivos, instalar dependências e validar o fluxo completo; não há nova decisão de produto pendente. A aplicação será executada localmente, sem publicação.

## Rota e decisões

Execução sequencial em uma janela: scaffold → extração/API/UI → testes → execução real → revisão. Aplicar React best practices, critérios comportamentais de TDD e revisões de segurança, arquitetura e UX. A instrução específica de montar primeiro o fluxo prevalece sobre test-first; Route Handler e estrutura simples prevalecem sobre Server Actions/DDD genéricos.

- Next.js App Router, TypeScript estrito; Node 24.15+ recomendado (engines conforme jsdom instalado); npm com lockfile.
- `src/lib/news` contém funções do parser; UI só importa o contrato/schema, sem módulos Node.
- `undici.fetch` permite fixar DNS por request com Agent; `ipaddr.js` identifica IPs especiais IPv4/IPv6 sem regex artesanal.
- Resolver todos os IPs, rejeitar se qualquer um for especial, fixar a conexão nos IPs aprovados. Apenas portas padrão 80/443; sem credenciais na URL. Até 3 redirects, cada destino validado antes da conexão.
- Limites locais: 8 s incluindo DNS/redirects/body, 3 MiB descomprimidos, HTML apenas. Body da API limitado a 8 KiB. Falhas de segurança e 404/410 não acionam Jina.
- Jina: origem fixa `https://r.jina.ai`, uma tentativa, 15 s, Accept JSON e conteúdo textual; chave opcional só no servidor. Sem modos LLM. Validar novamente o alvo antes do fallback. Redirecionamentos internos do serviço Jina são responsabilidade do provedor e não podem ser inspecionados pelo cliente.
- Preservar metadados locais; conteúdo final deve passar no mesmo critério de 300 caracteres mais título/publisher/autores. O critério é de suficiência textual, não classificação semântica de notícias.
- UI simples em português com loading, erro recuperável, campos ausentes explícitos e JSON completo; texto renderizado com escaping React.

## Aceite e tarefas

1. Criar scaffold e dependências.
2. Implementar rede segura, parsing, merge e fallback.
3. Implementar contrato HTTP e formulário.
4. Validar parsing e rede em testes determinísticos, API e UI reais, URLs públicas SSR/JSON-LD, URL inválida/interna e não-artigo. Tentar fallback público e reportar se o provedor impedir.
5. Rodar lint, typecheck, testes e build; registrar evidências e limites no relatório de validação.

Sem baseline Git: `validate:changed` executa validação integral do único pacote e informa esse fallback no README. Sem LLM, banco, fila, autenticação, browser headless ou seletores por portal.
