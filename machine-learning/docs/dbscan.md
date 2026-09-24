# Plano de experimento: DBSCAN

## Pergunta

As notícias True formam regiões densas nos atributos de estilo usados pelos detectores atuais, e as notícias Fake aparecem com maior frequência fora dessas regiões? Separadamente, que grupos de tema/estilo aparecem quando DBSCAN recebe conteúdo sem rótulo?

## Implementação planejada

1. Criar notebook/script novo. Reusar a leitura do Fake.br e contrato `0=True`, `1=Fake`, mas não copiar labels, origem da pasta ou IDs para features.
2. Primeira trilha: usar as seis features de estilo, primeiros 300 caracteres, comparáveis a IF/LOF/OCSVM. Ajustar median imputer e scaler no True de treino apenas. Testar DBSCAN sobre essa representação numérica.
3. Fixar uma grade pequena de `min_samples` (5, 10, 20, 40). Escolher `eps` por k-distance da amostra de treino e congelar as opções antes da validação. Guardar cada configuração e taxa de ruído; rejeitar a configuração que transforme quase todo o treino em ruído ou num único grupo sem informação.
4. Ajustar apenas com True de treino para o perfil de detecção de novidade. Para aplicar a novos itens, definir no código a regra de atribuição a core points: atribuir ao core mais próximo dentro de `eps`; se nenhum core estiver dentro do raio, marcar como não atribuído/ruído. Score de suspeita = distância mínima ao core dividida por `eps`; documentar empate e caso sem core.
5. Usar True-validation para threshold q95 e Fake-validation apenas para seleção entre as configurações previamente definidas, usando a ordem ROC-AUC, Average Precision e menor complexidade. Congelar score/threshold antes do teste.
6. Em uma seção separada, testar clusters transdutivos no treino sem labels para explorar composição Fake/True, ARI/NMI e estabilidade. Não chamar esse resultado de previsão de notícia nova.

## Comparação e saída

Seguir [comparison-protocol.md](comparison-protocol.md). Comparar o detector DBSCAN com IF, LOF, One-Class SVM, PU Learning e os modelos supervisionados na mesma lista de IDs de teste. Para clustering exploratório, comparar com HDBSCAN/K-means em quadro separado. Registrar `% ruído`, número de grupos, memória/tempo e taxa de falsos alertas True.

DBSCAN não é decisão de veracidade. Se a regra de atribuição a itens novos for instável ou não puder ser implementada sem usar o teste, limitar a conclusão à descoberta de grupos.

