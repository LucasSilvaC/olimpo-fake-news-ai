# Plano de experimento: Jev como auxiliar

## Objetivo e hipótese

Verificar se o Jev melhora uma decisão local ou se ajuda a encaminhar casos difíceis. O Jev e o modelo local devem permanecer como sinais separados e auditáveis. Não adicionar a saída do Jev às features do Isolation Forest e continuar chamando o resultado de não supervisionado: isso mudaria a hipótese e a natureza do detector.

## Pré-condições

1. Executar e registrar o experimento Jev sozinho seguindo [jev-standalone.md](jev-standalone.md), sob o mesmo gate de custo gratuito.
2. Escolher o modelo local principal apenas pela validação do protocolo comum; preferir o melhor baseline supervisionado local para classificar Fake/True. Manter IF como sinal complementar de estilo/novidade, não como prova.
3. Usar exatamente os mesmos `record_id`s no comparativo: modelo local sozinho, Jev sozinho e combinação.

## Estratégia inicial (sem treino de meta-modelo)

Começar com regras transparentes, pré-registradas na validação:

- modelo local e Jev concordam com alta confiança: manter sugestão, mas registrar que não é veredito factual;
- discordância ou resposta Jev `needs_verification`: abster-se/encaminhar para revisão humana;
- Isolation Forest anômalo: elevar prioridade da revisão independentemente da classe sugerida pelo Jev;
- Isolation Forest normal: não rebaixar automaticamente uma indicação Fake do classificador/Jev.

Definir previamente o que conta como “alta confiança”, limiar do classificador e comportamento para cada combinação. Ajustar somente em validação. Se não houver regra aprovada ou se Jev não for gratuito, não emitir decisão combinada.

## Opção posterior: meta-classificador

Só após a regra inicial, avaliar um meta-classificador local que receba scores/saídas out-of-fold dos modelos locais e do Jev. Construir os sinais de treino com previsões fora da dobra (nunca previsões in-sample), particionar os registros por grupo/história e treinar/calibrar apenas dentro do treino/validação. Reportar o resultado como ensemble híbrido supervisionado, não como Isolation Forest puro. Não fazer isso na primeira rodada se não houver dados ou créditos suficientes.

## Comparação e critério de sucesso

Seguir [comparison-protocol.md](comparison-protocol.md) e comparar no mesmo teste:

1. melhor baseline local sozinho;
2. Jev sozinho;
3. baseline local + regra auxiliar Jev;
4. opcionalmente, baseline local + regra Jev + alarme IF.

Reportar macro-F1, balanced accuracy, Fake precision/recall, True FPR, AP/ROC-AUC quando houver score, cobertura/abstenção, custo e latência. Considerar melhora apenas se aumentar a métrica primária congelada sem exceder a tolerância de falsos alertas ou reduzir cobertura de modo inaceitável. Se o Jev gratuito não estiver disponível, registrar `not_run`; não inventar resultado nem usar uma execução paga.

## Limite de uso no produto

O objetivo é triagem/avaliação experimental. A resposta correta exibida no jogo continua dependendo de curadoria ou evidência jornalística verificada. Manter decisão automatizada fora do gabarito até validação independente e revisão de produto.

