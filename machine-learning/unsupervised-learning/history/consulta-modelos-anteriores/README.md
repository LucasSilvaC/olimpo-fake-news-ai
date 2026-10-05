# Modelos e experimentos anteriores

Esta pasta é o **arquivo histórico** da trilha não supervisionada. Os oito notebooks e dois scripts abaixo foram preservados para consulta, reuso de ideias e auditoria. Eles não representam os quatro experimentos atualmente em avaliação e seus resultados não entram no comparativo atual.

## Catálogo

| Arquivo | Conteúdo / resultado registrado |
|---|---|
| [anomaly-detection-fakebr.ipynb](anomaly-detection-fakebr.ipynb) | Isolation Forest com texto completo; ROC-AUC 0,990782, AP 0,995131, 1.752/1.800 Fake sinalizadas e 35/720 True sinalizadas no corte registrado. |
| [anomaly-detection-fakebr-truncated.ipynb](anomaly-detection-fakebr-truncated.ipynb) | Variante com os primeiros 300 caracteres; ROC-AUC 0,980673, AP 0,988672, 1.769 Fake e 21 True sinalizadas. |
| [anomaly-detection-fakebr-no-word-count.ipynb](anomaly-detection-fakebr-no-word-count.ipynb) | Ablação da feature de contagem de palavras; ROC-AUC 0,989457, 1.745 Fake e 30 True sinalizadas. |
| [anomaly-detection-fakebr-windowed.ipynb](anomaly-detection-fakebr-windowed.ipynb) | Comparação por texto completo, prefixo e agregação de janelas. ROC-AUC: 0,991937 / 0,980673 / 0,984725; Fake sinalizadas: 1.771 / 1.769 / 1.771; True sinalizadas: 31 / 21 / 22. |
| [anomaly-detection-fakebr-windowed-improvements.ipynb](anomaly-detection-fakebr-windowed-improvements.ipynb) | Exploração de melhorias e agregação por janelas; não há resultados de execução persistidos. |
| [anomaly-detection-isolation-forest-windowed-historical.ipynb](anomaly-detection-isolation-forest-windowed-historical.ipynb) | Implementação histórica de Isolation Forest por janelas; não há resultados de execução persistidos. |
| [anomaly-detection-fakebr-controlled-author.ipynb](anomaly-detection-fakebr-controlled-author.ipynb) | Experimentos com controle do sinal de autoria. No split por notícia, recall anotado: 0,9733 com autoria, 0,6700 sem autoria e 0,7994 com autoria limitada. No split pareado: 0,9750 / 0,7069 / 0,8417. Os protocolos não são diretamente comparáveis. |
| [treated_fakebr.ipynb](treated_fakebr.ipynb) | Preparação/exploração antiga com classificadores supervisionados: macro-F1 de validação cruzada 0,9269 com TF-IDF e 0,9585 com TF-IDF + metadados. Não é detector não supervisionado. |
| [controlled_author.py](controlled_author.py) | Script auxiliar do estudo de política de autoria. |
| [controlled_author_evaluation.py](controlled_author_evaluation.py) | Script auxiliar para avaliar o experimento de autoria. |

## Como interpretar o histórico

Esses experimentos variam truncamento, janelas, features e política de autoria. Os splits e os procedimentos também diferem dos notebooks atuais. Use os números apenas como registro de resultados de cada estudo; não os coloque no ranking atual sem reexecutar os experimentos no protocolo compartilhado.

Para os métodos em avaliação e as métricas disponíveis, volte ao [índice da pasta](../README.md) e ao [comparativo atual](../RESULTADOS.md).
