# Resultados do FP-Growth principal

Execução realizada em 7 de outubro de 2026, horário de São Paulo. Os nomes das pastas usam UTC. [Run completo](../outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z/summary.md), com 100 reamostragens de grupos para redescoberta e 100 para intervalos gramaticais da validação.

| Representação | Features ativas | Regras elegíveis no treino | Regras sustentadas na validação | Sustentadas e com redescoberta ≥80% | Padrões distintos elegíveis | Novos candidatos na fila de revisão | Cobertura de todos os padrões na validação |
|---|---:|---:|---:|---:|---:|---:|---:|
| Referência corrigida | 15 | 152 | 121 | 102 | 93 | 0 | 1.374/1.440 |
| POS ampliado | 18 | 189 | 153 | 126 | 118 | 5 | 1.410/1.440 |
| Sintaxe ampliada | 22 | 523 | 422 | 347 | 345 | 14 | 1.439/1.440 |
| Vocabulário coletado amplo | 37 | 4.350 | 3.563 | 3.093 | 2.546 | 19 | 1.440/1.440 |

A coluna de novos candidatos conta padrões com itens acrescentados em relação à referência, entre os 20 selecionados para revisão em cada variante. Os padrões elegíveis resultam da união de itens das regras que passaram os filtros do treino. A cobertura total inclui padrões instáveis. Não representa cobertura de observações aprovadas nem ganho de utilidade para usuários.

## Modelo principal

A variante `sintaxe_ampliada` é o modelo principal para descobrir os padrões textuais usados na proposta de reflexão sobre notícias. Ela acrescenta ADP, AUX e NUM, além de obl, cc, acl:relcl e nsubj:pass. A versão ampla eleva as regras de 523 para 4.350 e acrescenta somente uma notícia à união total dos padrões na validação. Ainda pode conter observações diferentes e úteis, mas a variante ampla permanece uma ablação de comparação.

A fila sintática cobre 1.346 notícias da validação, comparada a 1.253 da fila da referência e 1.393 da fila ampla. Essas são uniões de listas diferentes de até 20 candidatos. Suas diferenças de contagem não medem diretamente quantas notícias novas foram acrescentadas nem comprovam melhoria editorial.

Exemplos da fila sintática, sem seleção por Fake/True:

| Combinação | Ocorrências na validação | Redescoberta da direção representativa |
|---|---:|---:|
| `DEP_acl:relcl_rate_baixo + POS_PRON_rate_baixo` | 441 | 100% |
| `DEP_nsubj:pass_rate_baixo + POS_AUX_rate_baixo` | 387 | 100% |
| `DEP_nsubj:pass_rate_baixo + DEP_nsubj_rate_alto` | 352 | 100% |
| `DEP_nsubj:pass_rate_baixo + DEP_obj_rate_alto` | 344 | 100% |

Para revisar um padrão, inspecionar o limiar e seu denominador, os tokens previstos e exemplos cobertos. `baixo` pode significar contagem zero em determinadas tags. Ausência de uma anotação prevista não demonstra ausência de um fenômeno em todo o documento. Os exemplos do notebook permitem iniciar essa revisão, mas não equivalem a anotação linguística humana de referência.

## Associação descritiva com Fake e True

Na validação, os 345 padrões do principal apresentam 105 com maior presença proporcional em Fake, 235 em True e cinco empatados. A descrição já está calculada por classe, partição e autoria em [posthoc_composition.csv](../outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z/sintaxe_ampliada/posthoc_composition.csv). Ainda faltam intervalos e avaliação da força das associações para escolher padrões por classe. Essas contagens não classificam textos novos.

## Relação com o propósito do teste.md

O experimento entrega quatro catálogos de pesquisa. Seus itens carregam operadores, limiares completos, denominadores e procedência. As uniões consolidam direções inversas e possuem famílias de redundância. Há descrições e perguntas preliminares, além de contagens por partição e autoria com os dois denominadores da comparação por classe.

Todos os padrões permanecem `research_only`, com comparação por classe desabilitada. A próxima etapa é selecionar observações compreensíveis, revisar perguntas e exemplos e promover somente os padrões aprovados para um catálogo do produto. Termos como `acl:relcl` não devem aparecer sem tradução na experiência do usuário.

## Verificações realizadas

- ZIP congelado validado por SHA-256.
- Os 7.200 textos do CSV coletado corresponderam ao corpus congelado, preservando CRLF/BOM.
- IDs e grupos canônicos reconstruídos sem separação dos pares entre partições.
- Os atributos e as 152 regras direcionais da referência corrigida foram reproduzidos.
- Cinco testes passaram, cobrindo denominadores, janela, ausência versus zero, mineração e reamostragem de pares.
- Notebook executado, com checagem de identidade e ocorrências de todos os padrões dos quatro catálogos na validação.

As métricas medem recorrência e estabilidade neste corpus. O teste já conhecido continua exploratório. Os atributos/famílias foram escolhidos à luz de análises anteriores. Não há nova validação externa, aprovação editorial ou estudo com usuários nesta entrega.

## Arquivos e reprodução

- [Notebook principal](fp_growth_principal_sem_autoria.ipynb): resultados, comparações, exemplos e catálogos.
- [Implementação principal](fp_growth_principal.py): extração e comparação com `PRIMARY_VARIANT = "sintaxe_ampliada"`.
- [Legado](history/mineracao-de-padroes/fp-growth-legado/README.md) e [referência linguística anterior](history/mineracao-de-padroes/fp-growth-linguistico/README.md): documentação e resultados históricos nas próprias pastas.
- As referências e ablações do run têm README junto aos respectivos CSVs.

```powershell
python machine-learning/unsupervised-learning/fp_growth_principal.py --repetitions 100
python -m unittest discover -s machine-learning/unsupervised-learning/tests -v
```
