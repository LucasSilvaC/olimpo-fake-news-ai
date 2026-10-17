# Desenho: refatoração arquitetural dos fluxos de jogo

## Decisões

1. **MVVM por fluxo**: cada view de lobby, partida e desafio recebe dados prontos e handlers de um hook em `model/`. Estado, efeitos, navegação, chamadas de ações e transformação de DTOs ficam no ViewModel. Componentes de estágio com estado próprio recebem ViewModels locais.
2. **Camadas FSD**: `app/` permanece como entrada/roteamento. `views/` representa a camada de páginas do FSD. O nome permanece `views` porque `src/pages` é a convenção de roteamento legada do Next.js. Slices só expõem módulos por `index.ts`; uma view não importa implementação interna de outra.
3. **Estágios compartilhados**: etapas usadas por sala e desafio solo são publicadas por `widgets/game-stages/index.ts`. A interação de votação e seus componentes de artigo/opções pertencem à feature `news-voting`. Nenhuma view importa implementação interna de outra view.
4. **Resultado autoritativo**: pontuação e correção vêm do resultado persistido pelo servidor ou do evento de rodada. A interface não repete fórmulas de pontuação; os campos que o servidor sempre envia tornam-se obrigatórios nos contratos internos.
5. **DDD parcial nos contextos tocados**: tipos puros pertencem ao domínio, interfaces são ports, adapters Drizzle/Redis fazem o mapeamento de persistência e uma composition root fornece as implementações. O value object compartilhado fica limitado ao vocabulário estável das três classificações e não inclui agregados de outro contexto.
6. **Leitura de artigos**: agregados de desafio mantêm o `articleId`; consultas enriquecidas para a interface usam DTOs de leitura, sem anexar uma linha Drizzle à entidade de domínio.

## Fluxo de dependências

```text
Next App Router -> view -> ViewModel -> Server Action -> application use case -> domain ports
                                                                    ^                  ^
                                                                    |                  |
                                                        composition root -> infrastructure adapters
```

O caminho de retorno usa DTOs serializáveis. Domínio e aplicação não dependem de Next.js, React, Drizzle ou Redis.

## Limites e compatibilidade

- Manter opções de voto, transições, contagem regressiva, SSE, autorização, persistência e textos atuais.
- O evento `ROUND_COMPLETED` é contrato de transporte SSE; não será promovido a evento de domínio sem consumidor de domínio.
- `views/` é documentado como equivalente à camada `pages` do FSD neste projeto App Router.
- Atomic Design é aplicado a componentes reutilizáveis; componentes de seção usados somente pelo lobby permanecem locais à view até que exista um segundo consumidor.
- Não criar repositório genérico ou shared kernel amplo. Compartilhar somente o value object de classificação já usado com o mesmo significado por votação e desafio.

## Riscos e mitigação

- **Risco**: mudança de inicialização/efeitos pode alterar sincronização SSE e contagem regressiva. **Mitigação**: preservar os handlers e validar os testes de página, lobby, desafio e SSE.
- **Risco**: tornar campos de pontuação obrigatórios pode revelar caminhos do servidor sem esses dados. **Mitigação**: auditar todos os emissores antes de estreitar os tipos.
- **Risco**: separar adapters dos casos de uso pode deixar imports apontando para singletons antigos. **Mitigação**: atualizar actions e testes pela API pública da composition root e executar typecheck, lint e suíte afetada.
