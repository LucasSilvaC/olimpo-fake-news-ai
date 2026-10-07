NEXT.JS
CONTEXTO
Optamos pelo Next.js para o ecossistema web devido à sua capacidade full-stack integrada. A utilização de Server Actions reduz a complexidade da aplicação ao executar mutações no servidor via requisições POST nativas, sem a obrigatoriedade de construir rotas de API dedicadas — o que eleva o nível de segurança e a produtividade no desenvolvimento. Por fim, a infraestrutura com suporte a hospedagem sem custo para a nossa volumetria viabiliza a execução do projeto com excelente relação custo-benefício.

PONTOS POSITIVOS
Desenvolvimento rápido (por ser o mesmo framework tanto no frontend, como no backend. É possível compartilhar tipagens, funções genéricas... Além de ser a mesma linguagem de programação)
Segurança (Por ter componentes server-only, dados sensíveis ficam por conta do servidor, o cliente não tem acesso)
Hospedagem gratuita (na Vercel)
PONTOS NEGATIVOS
WebSocket (Tempo real para o chat em grupo) (Por utilizar arquitetura Serverless, não é possível implementar nativamente)
RESOLUÇÃO PARA O PONTO NEGATIVO
Utilizar uma ferramenta complementar para permitir o websocket, como: Ably

BANCO DE DADOS (SUPABASE & POSTGRESQL)
CONTEXTO
Optamos pelo ecossistema Supabase & PostgreSQL para o gerenciamento de dados. A escolha pelo PostgreSQL assegura um motor relacional de alto rendimento, confiabilidade e facilidade de manutenção. A integração com o Supabase viabiliza uma hospedagem eficiente e sem custos para o volume de acessos previsto no escopo atual, otimizando o orçamento do projeto sem comprometer a estabilidade do ambiente.

PONTOS POSITIVOS
Hospedagem grátis no Supabase
Fácil conexão com o projeto
Eficiente para o nosso uso

DRIZZLE (ORM)
CONTEXTO
Definimos a adoção do Drizzle ORM para a camada de acesso ao banco de dados. A ferramenta traz maior robustez à arquitetura do projeto ao simplificar a manutenção do código por meio do uso de entidades orientadas a objetos, tipagem forte e construção intuitiva de queries. Essa abordagem eleva a segurança do código e acelera o tempo de desenvolvimento.

PONTOS POSITIVOS

Segurança (Como a manipulação fica direta no código, não ocorre SQL-Injection)
Migrations (Versionamento de dados)
Objetos (facilita demais o desenvolvimento ao utilizar objetos, podendo declarar entidades e etc)

FSD (Feature Sliced Design)
CONTEXTO
Optamos pelo padrão de Arquitetura em Camadas fundamentado em Domain-Driven Design (DDD) para estruturar a aplicação. O principal motivador dessa decisão é a desacoplagem entre as regras de domínio e os serviços de infraestrutura. Essa flexibilidade viabiliza a substituição de componentes externos (como a migração de um SGBD Relacional para NoSQL) isolando o impacto a adaptadores específicos da camada de dados. Como resultado, o projeto ganha em manutenibilidade, testabilidade e escalabilidade a longo prazo.

PONTOS POSITIVOS
Manutenibilidade
Legibilidade  
Elegível para trocas de ferramentas, (como: Banco de dados) sem comprometer o resto do código

PONTOS NEGATIVOS
Complexo
Demorado de implementar
FALTA COLOCAR COMO A IA VAI SE CONECTAR COM BACK \* DEVE SER FEITO NA QUARTA

ROADMAP DO PROJETO OLIMPO

Plataforma educacional para avaliação de confiabilidade de notícias com apoio de Inteligência Artificial

Planejamento de 7 semanas

Residência em IA — Eldorado / PUC

Roadmap criado na primeira semana do projeto, com objetivo de metrificar entregaveis semanais \*

1. Visão geral do projeto
   Objetivo. Desenvolver uma aplicação educacional inspirada em experiências como o Kahoot, na qual usuários avaliam notícias antes de visualizar a análise realizada por um modelo de IA. A solução também permitirá inserir o texto de uma notícia para receber um score de confiabilidade e sinais que apoiem a reflexão do usuário.

Princípio central. A IA não deve substituir o julgamento humano. O produto deve estimular pensamento crítico, apresentar indícios e deixar claras as limitações do modelo.

Escopo técnico mínimo. O projeto deve contemplar classificação, aprendizado supervisionado e não supervisionado, limpeza de dados, métricas de avaliação, desenvolvimento em Python, visualizações de dados, aspectos éticos, protótipo funcional, validação com usuários reais e evidências de impacto.

2. Roadmap
   Semana
   Objetivo
   Resultado esperado
   1
   Metodologia e organização do trabalho
   Metodologias, frameworks, ferramentas, governança e forma de trabalho definidas.
   2
   Arquitetura da solução, escolha das tecnologias  
   e dataset
   Arquitetura inicial definida e tecnologias selecionadas para frontend, backend, mapeamento da integração, classificadores, parâmetros que serão utilizados e dataset inicial.
   3
   Estudo e experimentação das técnicas de IA
   Técnicas de classificação compreendidas, experimentadas superficialmente e selecionadas para estudo.
   4
   Construção, avaliação e preparação do modelo para o backend
   Modelo treinado, testado e preparado para ser integrado com aplicação e testes com usuários.
   5
   Motor de análise, backend e fundação do frontend
   API integrada ao modelo e base do frontend preparada para consumir o serviço.
   6
   Experiência do usuário, integração e início da frente de negócio
   Protótipo navegável, integração avançada e preparação do pitch.
   7
   Validação, negócio, refinamento e pitch final
   MVP validado, proposta de negócio consolidada e apresentação final pronta.
   2.1 Estratégia de divisão do grupo
   O grupo possui 6 integrantes. Em cada semana, a equipe será organizada em frentes temporárias de trabalho, sempre totalizando 6 pessoas. A divisão não cria papéis fixos: os integrantes podem rotacionar entre as frentes conforme aprendizado, dependências e carga de trabalho.

A proposta mantém o princípio do Crystal Clear adotado pelo grupo: comunicação constante, colaboração entre frentes e responsabilidade compartilhada. Cada frente deve registrar decisões no Jira/GitHub e realizar checkpoints com as demais para evitar silos entre IA, dados, frontend, backend, validação e negócio.

3. Semana 1 — Metodologia e organização do trabalho
   Descrição. Definir como o grupo irá trabalhar durante todo o projeto. A primeira semana foi dedicada à escolha das metodologias, frameworks, ferramentas, estratégias de teste, governança de IA, mineração de dados, desenvolvimento e pesquisa. O documento inicial do grupo estabelece o Crystal Clear como metodologia organizacional, apoiado por RACI, MoSCoW e Planning Poker, com Jira e GitHub para gestão e versionamento.

Metodologias e decisões da semana.

Crystal Clear para organização de um time pequeno, com ciclos curtos, comunicação osmótica, planejamento de iterações e reflexão periódica.
RACI para explicitar responsável, aprovador, consultado e informado em cada atividade.
MoSCoW para priorização das funcionalidades entre Must Have, Should Have, Could Have e Won’t Have.
Planning Poker para estimar esforço e apoiar a divisão equilibrada das tarefas.
Jira para organização em épicos, histórias e tarefas; GitHub para repositórios, branches, pull requests e versionamento.
Testes de viés e equidade para dados; testes metamórficos para o modelo; testes unitários e de integração para o código.
AIPGF como referência de governança de IA, com foco em centrismo humano, transparência e adaptabilidade.
CRISP-DM para organizar entendimento do problema, dados, preparação, modelagem, avaliação e implantação.
MLOps nível 1 como direção de desenvolvimento, priorizando pipelines mais automatizados e reprodutíveis.
Pesquisa bibliográfica, levantamento de campo e netnografia para fundamentar o problema e compreender o público.
Resultado esperado. Base metodológica definida e documentada, com regras claras para organização do grupo, priorização, desenvolvimento, testes, governança e pesquisa.

Critérios de aceite.

✓

Metodologia organizacional escolhida e justificada.

✓

Frameworks de priorização, responsabilidade e estimativa definidos.

✓

Ferramentas de gestão e versionamento escolhidas.

✓

Estratégia inicial de testes definida.

✓

Referência de governança de IA definida.

✓

Abordagem de desenvolvimento/MLOps definida.

✓

Metodologias de pesquisa registradas em documento compartilhado pelo grupo.

Distribuição sugerida da equipe — Semana 1
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Metodologia, organização e ferramentas
3
Consolidar Crystal Clear, RACI, MoSCoW, Planning Poker, Jira/GitHub e organização do fluxo de trabalho.
Governança, testes e pesquisa
3
Estruturar AIPGF, CRISP-DM, MLOps, estratégia de testes e métodos de pesquisa do projeto.

4. Semana 2 — Arquitetura da solução e escolha das tecnologias
   Descrição. Definir a arquitetura inicial da solução, selecionar as tecnologias que serão utilizadas ao longo do projeto e preparar o dataset para as etapas de modelagem. Nesta semana, o grupo estrutura como frontend, backend, dados e modelo de IA irão se relacionar, além de realizar a análise e limpeza inicial do conjunto de dados, tratando inconsistências, valores ausentes, duplicidades e informações que possam prejudicar o treinamento.

Também serão definidas as duas principais perspectivas de classificação da solução. A primeira está relacionada às notícias, utilizando inicialmente a Regressão Logística como modelo classificatório de referência (baseline) aplicado ao dataset após a preparação dos textos. A segunda está relacionada aos dados gerados pelos usuários durante a utilização da plataforma, permitindo posteriormente analisar padrões de comportamento e acerto por características como faixa etária, região e outros segmentos disponíveis.

A classificação dos usuários não terá como objetivo determinar se uma pessoa é ou não capaz de identificar notícias falsas, mas permitir análises agregadas como, por exemplo, identificar se determinada faixa etária apresenta maior dificuldade com certos tipos de notícia ou se existem diferenças de comportamento entre regiões. Esses resultados poderão posteriormente compor indicadores e visualizações da solução.

Resultado esperado. Arquitetura inicial definida e documentada, tecnologias selecionadas, dataset preparado para modelagem e estratégia de classificação estabelecida para notícias e dados de utilização da plataforma. Ao final da semana, o grupo deverá possuir uma primeira aplicação da Regressão Logística sobre os dados preparados e uma definição de quais informações dos usuários poderão ser utilizadas posteriormente para análises segmentadas.

Critérios de aceite.

✓

Fluxo principal de comunicação entre frontend, backend e modelo representado.

✓

Tecnologias principais do projeto selecionadas e registradas.

✓

Arquitetura inicial da solução definida e documentada.

✓

Responsabilidades de frontend, backend, dados e modelo de IA delimitadas.

✓

Dataset analisado e processo inicial de limpeza executado.

✓

Duplicidades, valores ausentes, inconsistências e demais problemas relevantes do conjunto de dados identificados e tratados.

✓

Variável que será utilizada como alvo da classificação das notícias identificada.

✓

Regressão Logística definida e aplicada como primeiro modelo classificatório de referência.

✓

Fluxo inicial entre preparação textual e classificação documentado.

✓

Dados de utilização que poderão alimentar análises por perfil identificados, como faixa etária, região e demais segmentos disponíveis.

✓

Estratégia inicial para análise agregada dos resultados dos usuários definida.

✓

Riscos de viés relacionados à utilização de informações como idade e região considerados na definição da análise.

✓

Estrutura de repositórios, organização de código ou estratégia de versionamento alinhada à arquitetura escolhida.

Distribuição sugerida da equipe — Semana 2
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Arquitetura e mapeamento da integração
2
Definir componentes, responsabilidades das camadas, tecnologias, contratos iniciais e integração entre frontend, backend, dados e IA.
Tecnologias e documentação técnica
2
Analisar e limpar o dataset, preparar os dados para modelagem e estruturar a primeira aplicação da Regressão Logística como baseline classificatório.
Dados do usuário, fluxo e segmentação
2
Mapear o fluxo do usuário, definir quais informações serão coletadas e estruturar como resultados poderão ser analisados por faixa etária, região e outros segmentos relevantes.

5. Semana 3 — Estudo e experimentação das técnicas de IA
   Descrição. Aprofundar o estudo das técnicas de Inteligência Artificial e Machine Learning aplicáveis ao projeto a partir do dataset já preparado e do baseline construído na semana anterior.

Nesta etapa, o grupo deverá compreender melhor como diferentes formas de representação textual afetam o modelo, avaliar o comportamento da Regressão Logística já implementada e experimentar outros algoritmos supervisionados e não supervisionados para comparação.

Também serão iniciadas análises sobre os resultados produzidos pelos usuários, estruturando como respostas, perfil e tipo de notícia poderão se relacionar futuramente. O objetivo será permitir perguntas como:

determinadas faixas etárias erram mais algum tipo específico de notícia?  
existem temas que geram maior dúvida independentemente do perfil?  
determinada região apresenta comportamentos diferentes?  
quais categorias de notícia apresentam maior taxa de erro?  
usuários mudam sua decisão depois de visualizar os sinais apresentados pela IA?  
Essas análises deverão ocorrer de forma agregada e serão utilizadas para compreender comportamento e impacto educacional, não para criar avaliações individuais sobre os usuários.

Exemplos de técnicas a explorar.

Representação textual
TF-IDF: representar numericamente a importância das palavras no conjunto de notícias.  
Bag of Words: utilizar frequência de palavras como uma representação inicial mais simples.  
N-grams: analisar combinações como "cura milagrosa" em vez de apenas "cura" e "milagrosa" separadamente.  
Classificação supervisionada

Logistic Regression: aprofundar e avaliar o baseline iniciado na Semana 2.  
Naive Bayes: comparar um algoritmo tradicionalmente utilizado em classificação textual.  
Random Forest: experimentar uma abordagem baseada em árvores.  
Outras técnicas poderão ser avaliadas caso apresentem justificativa e sejam compatíveis com o prazo.  
Aprendizado não supervisionado

K-Means: observar se surgem agrupamentos naturais entre notícias.  
PCA ou técnica equivalente: reduzir dimensionalidade para auxiliar a visualização dos grupos.
Resultado esperado. Compreender as principais abordagens e selecionar um conjunto pequeno de técnicas para aprofundamento na modelagem.

Critérios de aceite.

✓

Regressão Logística analisada e utilizada como baseline de comparação.

✓

Pelo menos uma técnica de representação textual, como TF-IDF ou N-grams, aplicada ao dataset.

✓

Pelo menos dois algoritmos supervisionados comparados.

✓

Pelo menos uma técnica não supervisionada experimentada.

✓

Métricas iniciais de desempenho dos modelos obtidas e comparadas.

✓

Estrutura dos dados necessária para análise segmentada por faixa etária, região, tema e outros recortes definida.

✓

Técnicas selecionadas para aprofundamento na Semana 4 justificadas pelo grupo.

Distribuição sugerida da equipe — Semana 3
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Classificação supervisionada e representação textual
2
Evoluir Regressão Logística, experimentar TF-IDF/N-grams e comparar outros classificadores supervisionados.
Não supervisionado, métricas e visualizações
2
Experimentar clustering, redução de dimensionalidade, métricas e produzir visualizações dos resultados.
Classificação dos usuários e integração dos dados
2
Estruturar análises por faixa etária, região, tema e outros segmentos, além de definir como essas informações chegarão do frontend/backend para análise.

6. Semana 4 — Construção, avaliação e preparação do modelo para o backend
   Descrição. Aplicar de forma estruturada as técnicas selecionadas. Nesta etapa serão criados os pipelines de treinamento, separados os conjuntos de treino e teste, executados os algoritmos escolhidos e comparados seus resultados. A equipe deve selecionar um modelo principal com base em desempenho, simplicidade e interpretabilidade. Ao mesmo tempo, será iniciada a preparação técnica para o backend: empacotar o fluxo de inferência, definir a função responsável por receber uma notícia e devolver a predição e rascunhar o contrato que a API utilizará nas semanas seguintes.

Pipeline de referência. Notícia → pré-processamento → representação textual (ex.: TF-IDF) → modelo de classificação → probabilidade → classificação.

Métricas sugeridas. Accuracy, Precision, Recall, F1-score e Confusion Matrix. Caso as classes estejam desbalanceadas, F1-score deve receber atenção especial por equilibrar Precision e Recall.

Resultado esperado. Pelo menos um modelo funcional capaz de classificar textos, acompanhado de métricas e comparação entre as abordagens testadas, além de uma interface de inferência estável que possa ser posteriormente exposta pelo backend.

Critérios de aceite.

✓

Pipeline de treinamento implementado em Python.

✓

Separação entre treino e teste realizada de forma controlada.

✓

Pelo menos dois algoritmos comparados quando viável.

✓

Accuracy, Precision, Recall e F1-score calculados.

✓

Confusion Matrix gerada e interpretada.

✓

Pelo menos três técnicas de visualização utilizadas ao longo da análise do projeto.

✓

Modelo principal selecionado e escolha documentada.

✓

Limitações conhecidas do modelo registradas.

✓

Função ou módulo de inferência isolado do código de treinamento e pronto para uso pelo backend.

✓

Contrato preliminar de entrada e saída definido entre modelo e aplicação.

Distribuição sugerida da equipe — Semana 4
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Modelagem e avaliação
3
Treinar, comparar e avaliar modelos; consolidar métricas e escolher o modelo principal.
Engenharia de ML e backend inicial
3
Isolar inferência, serializar artefatos, definir contrato de entrada/saída e preparar a base para exposição via API.

7. Semana 5 — Motor de análise, backend e fundação do frontend
   Descrição. Transformar o modelo treinado em um serviço consumível pela aplicação. O backend deverá receber o texto de uma notícia, executar pré-processamento e inferência, gerar o score de confiabilidade e retornar sinais que ajudem o usuário a interpretar a avaliação. Em paralelo, o frontend inicia sua estrutura base: navegação, componentes principais, estados de carregamento/erro e contrato de consumo da API. O objetivo é que backend e frontend avancem juntos sobre um formato de resposta já definido, reduzindo retrabalho na integração.

Resultado esperado. Backend funcional integrado ao modelo, retornando score, classificação e sinais interpretáveis, com a estrutura inicial do frontend pronta para consumir esse serviço.

Critérios de aceite.

✓

Entrada de texto aceita pelo serviço.

✓

Modelo integrado ao fluxo de análise.

✓

Score de confiabilidade calculado de forma consistente.

✓

Resultado convertido para níveis visuais compreensíveis, como vermelho, amarelo e verde.

✓

Sinais relevantes apresentados junto ao resultado.

✓

Resposta da API padronizada para integração com o frontend.

✓

Entradas vazias ou inválidas tratadas.

✓

Limitações e caráter probabilístico da análise comunicados ao usuário.

✓

Endpoint principal do backend implementado e integrado ao módulo de inferência.

✓

Estrutura base do frontend criada com navegação e componentes essenciais.

✓

Frontend preparado para consumir o contrato de resposta definido pela API, mesmo que parte da interface ainda utilize dados mockados.

Distribuição sugerida da equipe — Semana 5
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Backend, modelo e score
3
Implementar API, integração com inferência, score, sinais, validações e testes do serviço.
Frontend e contrato de integração
3
Criar estrutura da aplicação, navegação, componentes base e consumo/mock do contrato da API.

8. Semana 6 — Experiência do usuário, integração e início da frente de negócio
   Descrição. Construir e consolidar o protótipo funcional com foco nas duas experiências principais: o modo desafio, inspirado no Kahoot, e o modo de análise livre. O frontend deve finalizar os fluxos visuais e integrar os principais pontos com o backend, enquanto a frente técnica garante estabilidade dos endpoints, tratamento de erros, consistência das respostas e ajustes necessários para que a plataforma possa ser utilizada de ponta a ponta.

O principal objetivo desta semana é validar a experiência do usuário e concluir os ajustes da plataforma, observando clareza dos fluxos, facilidade de uso, compreensão das respostas da IA e comportamento do sistema durante a navegação.

A frente de negócio pode ser iniciada nesta semana como um bônus, caso as entregas principais estejam estabilizadas. Essa atividade pode incluir uma primeira definição de público prioritário, proposta de valor, contexto de uso e estrutura inicial do pitch. No entanto, caso existam pendências de integração, usabilidade ou estabilidade, essa frente deve ser postergada para a Semana 7 sem comprometer o objetivo principal da sprint.

Fluxo principal do desafio. Notícia → escolha do usuário no semáforo → registro da resposta → análise da IA → comparação entre percepção do usuário e resultado do sistema.

Resultado esperado. Plataforma funcional, navegável e integrada, com os principais fluxos concluídos e ajustados com foco na experiência do usuário. A solução deve estar estável o suficiente para testes e validação, deixando apenas refinamentos finais para a última semana.

Como bônus, caso haja disponibilidade da equipe, espera-se também iniciar a estruturação da proposta de valor e da narrativa de apresentação, podendo essa atividade ser concluída integralmente na Semana 7.

Critérios de aceite.

✓

Tela inicial e navegação principal disponíveis.

✓

Modo desafio funcional.

✓

Notícias exibidas individualmente.

✓

Semáforo vermelho, amarelo e verde disponível para resposta.

✓

Resposta do usuário registrada antes da resposta da IA.

✓

Tela de resultado exibindo score e sinais.

✓

Área para inserção manual de notícia disponível.

✓

Integração inicial com a API realizada.

✓

Interface comunica que a IA auxilia a avaliação, mas não determina a verdade de forma absoluta.

✓

Integração frontend-backend funcionando nos fluxos prioritários do MVP.

✓

Público/comunidade prioritária e problema de negócio/uso descritos de forma objetiva.

✓

Proposta de valor inicial e principais diferenciais do produto registrados.

✓

Estrutura inicial da apresentação e do pitch criada, incluindo problema, solução, funcionamento e demonstração planejada.

Distribuição sugerida da equipe — Semana 6
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Frontend e experiência do usuário
2
Implementar modo desafio, análise livre, semáforo, resultado, responsividade e feedbacks de interface.
Backend, integração e qualidade
2
Concluir endpoints necessários, integrar frontend/modelo, tratar erros e executar testes de integração.
Negócio, validação e pitch inicial
2
Definir público, proposta de valor e diferenciais; preparar plano de validação e roteiro inicial da apresentação/pitch.
Frente de negócio e pitch — início na Semana 6
A frente de negócio deve começar sem transformar o projeto em um plano empresarial complexo. O foco é demonstrar para quem a solução gera valor e em qual contexto ela poderia ser adotada. O grupo deve definir público/comunidade prioritária, problema, proposta de valor, diferenciais e possibilidades de uso, por exemplo em ambientes educacionais, treinamentos ou iniciativas de educação midiática.

O pitch também começa nesta semana. Deve ser criado um roteiro inicial conectando contexto do problema, impacto da desinformação, proposta da solução, funcionamento do produto e demonstração planejada. Métricas do modelo, validação e evidências de impacto serão incorporadas na semana 7.

9. Semana 7 — Validação, negócio, refinamento e pitch final
   Descrição. Concluir a integração entre frontend, backend/API e modelo, testar o fluxo completo com usuários reais, coletar feedback e consolidar evidências de impacto. A frente de negócio iniciada na semana 6 deve ser finalizada com proposta de valor consolidada, público e contexto de adoção, possíveis canais de uso, viabilidade inicial, custos/recursos relevantes e próximos passos do produto. Em paralelo, o grupo deve fechar a narrativa da apresentação e do pitch, preparar a demonstração, organizar evidências técnicas e de impacto e realizar ensaios. Não devem ser adicionadas grandes funcionalidades novas nesta etapa.

Estratégia de validação sugerida. Apresentar um conjunto pequeno de notícias, registrar a percepção inicial do usuário, mostrar a análise da ferramenta e verificar se os sinais apresentados ajudaram na reflexão. Também podem ser aplicadas perguntas curtas de usabilidade e confiança em escala de 1 a 5.

Resultado esperado. MVP integrado, estável e validado com usuários reais, proposta de negócio consolidada e apresentação final com pitch e demonstração pronta para execução.

Critérios de aceite.

✓

Frontend, API e modelo integrados.

✓

Fluxo de desafio funcionando de ponta a ponta.

✓

Fluxo de análise livre funcionando de ponta a ponta.

✓

Principais bugs identificados e corrigidos.

✓

Testes realizados com usuários reais.

✓

Feedback dos usuários registrado e consolidado.

✓

Evidências de impacto coletadas.

✓

Métricas do modelo consolidadas.

✓

Aspectos éticos e limitações documentados.

✓

Documentação final e apresentação/pitch preparados.

✓

MVP disponível para demonstração.

✓

Proposta de valor, público, contexto de adoção e diferenciais consolidados.

✓

Viabilidade inicial e próximos passos do produto documentados, sem necessidade de um plano financeiro complexo.

✓

Pitch final estruturado com problema, solução, diferencial, evidências, impacto, negócio e próximos passos.

✓

Demonstração preparada e plano alternativo definido para o caso de falha durante a apresentação.

✓

Apresentação ensaiada pelo grupo e ajustada ao tempo disponibilizado.

Distribuição sugerida da equipe — Semana 7
Divisão sugerida para os 6 integrantes. As frentes devem manter checkpoints entre si e podem rotacionar pessoas conforme necessidade e aprendizado.

Frente
Pessoas
Responsabilidade principal
Estabilização técnica e demonstração
2
Corrigir bugs, fechar integrações, preparar ambiente de demonstração e plano alternativo para falhas.
Validação, impacto e negócio
2
Executar testes com usuários, consolidar evidências, finalizar proposta de valor, adoção, viabilidade e próximos passos.
Apresentação, pitch e documentação
2
Montar slides, organizar narrativa, inserir métricas/evidências, ensaiar pitch e finalizar documentação.
Frente de negócio e pitch — conclusão na Semana 7
A proposta iniciada na semana anterior deve ser consolidada em uma visão simples de negócio: público, necessidade atendida, proposta de valor, contexto/canais de adoção, recursos necessários, diferenciais, limitações e próximos passos. Caso seja útil para a apresentação, esses pontos podem ser organizados em um Canvas simplificado, sem ampliar o escopo técnico do MVP.

A apresentação final deve contar uma história única: problema → por que importa → como investigamos → como a IA foi construída → como frontend e backend materializam a solução → demonstração → validação com usuários → evidências de impacto → proposta de valor/negócio → limitações éticas → próximos passos. O pitch deve ser ensaiado com a demonstração real do MVP.

10. Diretrizes de escopo
    Posicionamento recomendado. Apresentar a solução como uma plataforma educacional que identifica padrões associados à confiabilidade de informações e ajuda o usuário a desenvolver pensamento crítico. Evitar posicionar o produto como um “detector definitivo de fake news”, pois o modelo trabalha com padrões aprendidos do dataset e está sujeito a erros, vieses e mudanças de contexto.

Prioridade do MVP.

Must Have: classificação de texto, score de confiabilidade, semáforo, explicação/sinais, modo desafio, entrada manual de notícia, modelo supervisionado, experimento não supervisionado, métricas e validação com usuários.
Should Have: análise por URL, histórico simples e pontuação no desafio, caso o tempo permita. Essas funcionalidades não devem comprometer integração, validação, frente de negócio ou preparação do pitch.
Could Have: login, ranking global, compartilhamento e funcionalidades sociais.
Won’t Have nesta versão: fact-checking universal em tempo real, scraping complexo de qualquer site e infraestrutura avançada de multiplayer.
10.1 Princípio de execução entre as frentes
Frontend, backend, dados e IA não devem ser tratados como projetos separados. A partir da Semana 4, contratos de entrada e saída precisam ser compartilhados; na Semana 5, backend e frontend evoluem em paralelo; nas Semanas 6 e 7, o foco passa a ser integração, experiência, validação e comunicação de valor. A frente de negócio deve utilizar evidências reais produzidas pelo produto e pelos testes, evitando promessas que o modelo não consegue sustentar.

11. Referências internas do planejamento
    Material da Residência em IA — Dia 6: Big Idea “Desinformação”, Essential Question sobre confiabilidade sem substituir pensamento crítico e Guiding Constraints do projeto.
    Documento “Metodologias Propostas Inicialmente — OLIMPO”: Crystal Clear, RACI, MoSCoW, Planning Poker, Jira, GitHub, testes, AIPGF, CRISP-DM, MLOps nível 1 e metodologias de pesquisa.

Isolation Florest:

Modos de usar (2 modos):

Detecção de Novidade (Estamos nesse):

Treina apenas com dados de um rótulo, exemplo: Verdadeiro, e qualquer dado que caia fora dessa região, é considerado como anomalia.

Detecção de Outliers:

Treina tudo misturado, como: 99% verdadeiro e 1% falso. O modelo encontra as anomalias naturalmente, já que elas ficam fora do centro. (esse é interessante, quando não sabemos o rótulo do nosso dataset)

Treinamento

Primeiramente, o algoritmo cria as árvores.

Outlier detection with Isolation Forest

Como é criado as árvores?

Funciona pegando amostras aleátorias de 256(por padrão) registros da nossa base de dados.

Com isso, criasse uma árvore, dentro dessa arvore, é feito mais um sorteio, dessa vez de uma feature (coluna). É pego o maior e menor valor dessa feature, após isso, é feito mais um sorteio, dessa vez de um valor dentro do intervalo. O algoritmo separa para a esquerda valores menores que o valor sorteado, e maiores para a direita. Esse processo é repetido até não sobrar mais pontos ou chegar na profundidade máxima.

Após isso, esse mesmo processo de sortear 256 registros é repetido 100x (por padrão).

Se o dado novo, percorreu um caminho curto em várias dessas arvores de 100. Ele possui uma maior chance de ser anomalia.

Se ele percorreu um caminho longo, há uma maior tendência de ser um dado normal.

Previsão

Após a criação das árvores, agora os dados novos percorrem os nós da árvore.

Se o dado novo, percorreu um caminho curto em várias dessas arvores de 100. Ele possui uma maior chance de ser anomalia.

Se ele percorreu um caminho longo, há uma maior tendência de ser um dado normal.

Vantagens

Algoritmo de tempo linear e alta velocidade. Ele opera pelo tamanho das amostras, e não pelo tamanho do dataset.
Requer pouco processamento computacional
Desvantagens

Não entende contexto
Não explica o porquê de ser anomalia

Não supervisionado:

Aprendizado não supervisionado

1. Por que Escolhemos a Técnica de Detecção de Anomalias?

A escolha da técnica de Detecção de Anomalias via Machine Learning fundamenta-se na necessidade de identificar padrões linguísticos e estilísticos atípicos frequentemente empregados na elaboração de notícias falsas (fake news). Diferente do jornalismo tradicional focado na neutralidade e apuração dos fatos, conteúdos enganosos tendem a recorrer a gatilhos sensacionalistas, desvios gramaticais intencionais, pontuação ostensiva e termos apelativos para provocar reações emocionais imediatas no leitor.

Nossa abordagem prevê o treinamento inicial do modelo com uma base robusta de notícias legítimas provenientes de veículos de imprensa consolidados e de credibilidade reconhecida (como G1, Folha de S.Paulo, O Globo, entre outros). Dessa forma, o modelo estabelece uma matriz de comportamento e padrão textual esperado para o jornalismo ético. Quando uma nova notícia é submetida à plataforma, o algoritmo avalia o texto e mensura o seu desvio em relação ao padrão aprendido, retornando um score de probabilidade de anomalia. Esse score reflete o quanto o padrão linguístico da mensagem se afasta da norma padrão jornalística.

Exemplos de Pontos Aberrantes (Outliers) Detectados:
• Gatilhos de Urgência e Alarmismo: Uso ostensivo de termos em caixa alta como "BOMBA", "URGENTE", "ATENÇÃO", "COMPARTILHE ANTES QUE APAGUE".
• Anomalias Sintáticas e Ortográficas: Erros gramaticais recorrentes, construção frasal truncada e pontuação excessiva (ex: "!!!", "???").
• Viés Emocional Extremo: Vocabulário altamente carregado de subjetividade, apelando para o medo, raiva ou indignação.

2. Análise da Técnica: Pontos Positivos e Negativos

A tabela a seguir sintetiza as principais vantagens e desafios atrelados à adoção da detecção de anomalias no escopo do projeto:

Pontos Positivos (Vantagens)

Pontos Negativos (Desafios)

Independência de Verificação de Fatos (Fact-Checking): Não necessita consultar bancos de dados em tempo real para checar fatos específicos, pois analisa a forma e o estilo textual.
Incapacidade de Detectar Mentiras Bem Redigidas: Notícias falsas escritas em estilo jornalístico culto e formal podem passar despercebidas pelo modelo.
Detecção de Padrões Inéditos (Zero-Day Fake News): Capaz de sinalizar novas narrativas desinformativas assim que surgem, desde que apresentem discrepâncias estilísticas.
Risco de Falsos Positivos: Artigos opinativos, colunas de sátira, crônicas ou títulos legítimos propositalmente chamativos podem ser marcados indevidamente como anomalias.
Escalabilidade e Agilidade: O processamento estatístico do texto e cálculo do score ocorrem em milissegundos, permitindo grande volume de análises simultâneas.
Dependência da Qualidade do Base-line: O modelo exige uma base de treinamento (notícias legítimas) constantemente atualizada e isenta de vícios de escrita para manter a precisão.
Sintonia com a Proposta Socrática e Gamificada: Fornece um score de anomalia indicativo, servindo como ponto de partida ideal para instigar a investigação do usuário sem dar uma resposta conclusiva prévia.
Sensibilidade à Evolução da Linguagem: Gírias, novos neologismos ou mudanças no estilo jornalístico moderno podem ser interpretados erroneamente como desvios.

DER (Diagrama de Entidade e Relacionamento):

Bibliografia:

https://blog.runrun.it/metodologia-crystal/

https://www.dataphi.net/post/epic-story-e-tarefas-como-fazer-uma-gest%C3%A3o-eficiente-de-escopo-de-projeto

https://www.efficientlyconnected.com/pmi-ai-project-management-standard-enterprise-governance/

https://www-datascience--pm-com.translate.goog/crisp-dm-2/?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc

https://www-6sigma-us.translate.goog/lean-six-sigma-articles/crystal-agile-methodology/?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc

https://youtu.be/G_ZETFAYxSQ?si=54Zrs0QEfuAEeGTi

https://interfacing-com.translate.goog/what-is-rasci-raci?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc

https://www.atlassian.com/br/agile/scrum/ceremonies

https://www-scrum--institute-org.translate.goog/Effort_Estimations_Planning_Poker.php?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc

https://aws.amazon.com/pt/what-is/mlops/

https://www.atlassian.com/br/work-management/project-management/raci-chart

https://www.atlassian.com/br/agile/project-management/epics-stories-themes

https://www.iso.org/home/insights-news/resources/iso-42001-explained-what-it-is.html

https://www.gov.br/mds/pt-br/acesso-a-informacao/governanca/integridade/campanhas/lgpd

https://fernandafperes.com.br/blog/interpretacao-boxplot/

https://shap.readthedocs.io/en/latest/example_notebooks/api_examples/plots/beeswarm.html

https://shap.readthedocs.io/en/latest/

https://shap.readthedocs.io/en/latest/example_notebooks/overviews/An%20introduction%20to%20explainable%20AI%20with%20Shapley%20values.html

https://www.google.com/goto?url=CAESzgEB6zswFYK_kTdwqoEOCTwCS4ujV6OERj6QN-fr9u2J-TjkQ9TSn0rJYYkrFORuntLgK5Ti88k3x9ntK2qdHKSq5Do78xLVmhCoKyuMunjCdeEr4jhDFSGF2S12zo59rBOhQ2Xxw-dHbEW_qE6d9woDADY8DEms3XXcw5gCC666Fc4HIE56E3BrL5mtewMOEl6wpMIJmin-WoCqNMFcQ_rgpqI1Nf6hEdTtVTONw_0UtBxcB1Tt24S-x8r5xDN-JDxJAx8u_1pmoTo15nyOfQ

https://www.geeksforgeeks.org/data-analysis/what-is-exploratory-data-analysis/

https://www.ibm.com/br-pt/think/topics/exploratory-data-analysis

https://www.ibm.com/br-pt/think/topics/logistic-regression

https://www.scirp.org/reference/referencespapers?referenceid=3092942

https://www.bbc.com/future/article/20240509-the-sift-strategy-a-four-step-method-for-spotting-misinformation

https://www.productplan.com/glossary/moscow-prioritization

https://scikit-learn.org/stable/modules/tree.html

https://github.com/GiovanniGatti/socratic-llm/tree/main

https://www.datacamp.com/pt/tutorial/introduction-to-shap-values-machine-learning-interpretability

https://huggingface.co/tasks/feature-extraction

https://www.ibm.com/think/topics/feature-extraction

Google Colab
https://colab.research.google.com/drive/1Al1scCzAe9uQWYXc2L8bfyXeo4ZYPvGi?usp=sharing

Miro
Olimpo - Miro
