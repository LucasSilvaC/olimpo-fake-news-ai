# Plano de experimento: HDBSCAN

## Pergunta

HDBSCAN encontra grupos de estilos/temas com densidades diferentes e identifica notícias fora da distribuição aprendida melhor que DBSCAN e os detectores one-class existentes?

## Implementação planejada

1. Criar notebook/script novo e seguir o contrato de labels, corpus e IDs em [comparison-protocol.md](comparison-protocol.md).
2. Começar na trilha numérica de seis features/300 caracteres dos notebooks IF/LOF/OCSVM. Ajustar imputação e escala somente em True de treino; avaliar sensibilidade a autoria incluída/excluída como variantes marcadas, sem alterar o baseline.
3. Definir uma grade curta de `min_cluster_size` e `min_samples` antes de olhar validação/teste. Registrar versão e origem da implementação. A disponibilidade de HDBSCAN dentro do scikit-learn depende da versão; não acrescentar dependência silenciosamente.
4. Para perfil de novidade, ajustar com True de treino. Consultar a API oficial da implementação escolhida para uma forma suportada de estimar score/atribuição em exemplos novos. Não executar `fit_predict` no teste para simular predição: isso ajusta a estrutura nos dados que deveriam ser holdout.
5. Usar strength/probabilidade de pertencimento, outlier score ou estimador de predição apenas se a API da versão instalada documentar o significado e o comportamento para pontos novos. Definir orientação única (maior = suspeita), threshold True-validation q95 e salvar também a fração sem cluster.
6. Se a implementação disponível for somente transdutiva, manter o resultado no track exploratório: estabilidade, número/tamanho dos clusters, ruído, ARI/NMI e composição dos grupos com labels externos depois do ajuste. Não apresentá-lo como classificador de teste.

## Comparação e saída

Comparar com DBSCAN no mesmo espaço de features e seeds. Comparar no ranking de classificação com IF, LOF, One-Class SVM, PU Learning, Regressão Logística, LinearSVC e Random Forest apenas se uma regra válida de scoring/atribuição fora da amostra estiver definida. Seguir [comparison-protocol.md](comparison-protocol.md) e reportar tempo, memória, cobertura e falsos alertas.

## Risco a explicitar

HDBSCAN pode lidar com densidades diferentes melhor que DBSCAN, mas não elimina a dependência de representação, métrica e parâmetros. “Ruído” descreve baixa densidade conforme essa representação, não falsidade factual.

