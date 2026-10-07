# Prévia das anotações linguísticas

**Estas anotações são previsões do spaCy, não uma referência humana validada (gold truth).**
A prévia permite conferir exemplos e identificar erros; sua geração não constitui revisão manual.

Os IDs de treino são fornecidos pelo experimento. Não houve seleção pela classe. Textos: normalização NFKC, remoção de BOM inicial e primeiros 300 caracteres.

Modelo: `pt_core_news_sm`; versão `3.8.0`. Documentos: 12.

No CSV, `start` e `end` indicam offsets de caracteres na janela normalizada; `head` é o índice do token que funciona como núcleo sintático previsto. `lexicaleligible` exclui espaços e pontuação, mantendo números. O CSV contém todos os tokens; as tabelas abaixo mostram os primeiros 12 de cada janela.

## fake/1692

```text
Mais uma mensagem enigmática foi postada no twitter horas antes da morte de Teori Zavascki.  Adriano Argolo, advogado petista, fez um alerta no mínimo esquisito, hoje em sua conta do twitter.  Ele publicou: "Vou avisar pq depois vão culpar o lula e o PT... delação da ODEBRECHT entrando políticos de 
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Mais | 0 | 4 | ADV | advmod | 1 | sim |
| uma | 5 | 8 | NUM | nummod | 2 | sim |
| mensagem | 9 | 17 | NOUN | nsubj:pass | 5 | sim |
| enigmática | 18 | 28 | ADJ | amod | 2 | sim |
| foi | 29 | 32 | AUX | aux:pass | 5 | sim |
| postada | 33 | 40 | VERB | ROOT | 5 | sim |
| no | 41 | 43 | ADP | mark | 7 | sim |
| twitter | 44 | 51 | VERB | xcomp | 5 | sim |
| horas | 52 | 57 | NOUN | obj | 7 | sim |
| antes | 58 | 63 | ADV | advmod | 7 | sim |
| da | 64 | 66 | ADP | case | 11 | sim |
| morte | 67 | 72 | NOUN | obl | 9 | sim |

## fake/1165

```text
General do Exército: "Lula é um morto-vivo desprovido de caráter".  Ninguém, hoje, em sã consciência e com um mínimo de discernimento, será capaz de prever o que será o amanhã do nosso País.  Gen Gilberto Pimentel / Presidente do Clube Militar / *** a declaração tem pouco mais de 1 ano, mas vale a p
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| General | 0 | 7 | NOUN | ROOT | 0 | sim |
| do | 8 | 10 | ADP | case | 2 | sim |
| Exército | 11 | 19 | NOUN | nmod | 0 | sim |
| : | 19 | 20 | PUNCT | punct | 0 | não |
| " | 21 | 22 | PROPN | appos | 0 | não |
| Lula | 22 | 26 | PROPN | nsubj | 8 | sim |
| é | 27 | 28 | AUX | cop | 8 | sim |
| um | 29 | 31 | DET | det | 8 | sim |
| morto-vivo | 32 | 42 | NOUN | nsubj | 30 | sim |
| desprovido | 43 | 53 | VERB | acl | 8 | sim |
| de | 54 | 56 | ADP | case | 11 | sim |
| caráter | 57 | 64 | NOUN | xcomp | 9 | sim |

## true/1197

```text
 A Associação Nacional dos Procuradores da República (ANPR) cobrou em nota nesta quarta-feira, 28, investigação sobre as ameaças ao ministro Edson Fachin, do Supremo Tribunal Federal (STF), e também sobre os tiros disparados contra a caravana do ex-presidente Lula, no interior do Paraná. Nesta terça
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
|   | 0 | 1 | SPACE | dep | 0 | não |
| A | 1 | 2 | DET | det | 2 | sim |
| Associação | 3 | 13 | PROPN | nsubj | 11 | sim |
| Nacional | 14 | 22 | PROPN | flat:name | 2 | sim |
| dos | 23 | 26 | ADP | case | 5 | sim |
| Procuradores | 27 | 39 | PROPN | nmod | 2 | sim |
| da | 40 | 42 | ADP | case | 7 | sim |
| República | 43 | 52 | PROPN | nmod | 5 | sim |
| ( | 53 | 54 | PUNCT | punct | 9 | não |
| ANPR | 54 | 58 | PROPN | appos | 2 | sim |
| ) | 58 | 59 | PUNCT | punct | 9 | não |
| cobrou | 60 | 66 | VERB | ROOT | 11 | sim |

## true/1648

```text
À procura de partido menor, Meirelles continua candidato ao Planalto. Ideia é migrar para um partido da base aliada até 7 de abril, prazo estabelecido pela lei para a troca de legendas.  BRASÍLIA - A disposição do presidente Michel Temer de disputar novo mandato não inibiu o projeto do ministro da F
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| À | 0 | 1 | ADP | case | 1 | sim |
| procura | 2 | 9 | NOUN | obl | 7 | sim |
| de | 10 | 12 | ADP | case | 3 | sim |
| partido | 13 | 20 | NOUN | nmod | 1 | sim |
| menor | 21 | 26 | ADJ | amod | 3 | sim |
| , | 26 | 27 | PUNCT | punct | 1 | não |
| Meirelles | 28 | 37 | PROPN | nsubj | 7 | sim |
| continua | 38 | 46 | VERB | ROOT | 7 | sim |
| candidato | 47 | 56 | NOUN | obj | 7 | sim |
| ao | 57 | 59 | ADP | case | 10 | sim |
| Planalto | 60 | 68 | NOUN | nmod | 8 | sim |
| . | 68 | 69 | PUNCT | punct | 7 | não |

## fake/1231

```text
Joesley pagou propina para Ministério da Agricultura alterar regras de exportação.  Aos poucos, a "coisa" vai se encaixando.  O todo poderoso da Friboi, Joesley Batista, disse em sua delação premiada que também pagou propina para o Ministério da Agricultura, na época comandado por Antônio Andrade (P
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Joesley | 0 | 7 | PROPN | nsubj | 1 | sim |
| pagou | 8 | 13 | VERB | ROOT | 1 | sim |
| propina | 14 | 21 | NOUN | obj | 1 | sim |
| para | 22 | 26 | ADP | case | 4 | sim |
| Ministério | 27 | 37 | PROPN | obl | 1 | sim |
| da | 38 | 40 | ADP | case | 6 | sim |
| Agricultura | 41 | 52 | PROPN | nmod | 4 | sim |
| alterar | 53 | 60 | VERB | xcomp | 1 | sim |
| regras | 61 | 67 | NOUN | obj | 7 | sim |
| de | 68 | 70 | ADP | case | 10 | sim |
| exportação | 71 | 81 | NOUN | nmod | 8 | sim |
| . | 81 | 82 | PUNCT | punct | 1 | não |

## true/1789

```text
Marqueteira de campanha de Lula diz ter recebido dinheiro vivo em caixa de sapato. Monica Moura relatou em delação premiada que pagamentos eram feitos em loja de chá de shopping de SP. Nesta quinta, ministro do STF retirou sigilo da delação dela e de João Santana..  A marqueteira Monica Moura narrou
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Marqueteira | 0 | 11 | PROPN | nsubj | 5 | sim |
| de | 12 | 14 | ADP | case | 2 | sim |
| campanha | 15 | 23 | NOUN | nmod | 0 | sim |
| de | 24 | 26 | ADP | case | 4 | sim |
| Lula | 27 | 31 | PROPN | nmod | 2 | sim |
| diz | 32 | 35 | VERB | ROOT | 5 | sim |
| ter | 36 | 39 | AUX | aux | 7 | sim |
| recebido | 40 | 48 | VERB | xcomp | 5 | sim |
| dinheiro | 49 | 57 | NOUN | obj | 7 | sim |
| vivo | 58 | 62 | ADJ | amod | 8 | sim |
| em | 63 | 65 | ADP | case | 11 | sim |
| caixa | 66 | 71 | NOUN | nmod | 8 | sim |

## true/405

```text
A luta de Temer entre a pinguela e a tormenta. Presidente faz anotações diárias e confessa a amigo: ‘estou cansado de apanhar injustamente’.  BRASÍLIA - Com uma crise atrás da outra batendo à porta do Palácio do Planalto, o presidente Michel Temer confidenciou, nos últimos dias, que não esperava enf
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| A | 0 | 1 | DET | det | 1 | sim |
| luta | 2 | 6 | NOUN | ROOT | 1 | sim |
| de | 7 | 9 | ADP | case | 3 | sim |
| Temer | 10 | 15 | PROPN | nmod | 1 | sim |
| entre | 16 | 21 | ADP | case | 6 | sim |
| a | 22 | 23 | DET | det | 6 | sim |
| pinguela | 24 | 32 | NOUN | nmod | 1 | sim |
| e | 33 | 34 | CCONJ | cc | 9 | sim |
| a | 35 | 36 | DET | det | 9 | sim |
| tormenta | 37 | 45 | NOUN | conj | 6 | sim |
| . | 45 | 46 | PUNCT | punct | 1 | não |
| Presidente | 47 | 57 | NOUN | nsubj | 12 | sim |

## true/2493

```text
Pais buscam cura para doença rara que destrói cérebro de criança em SP. Nicholas Casarino, de 10 anos, foi diagnosticado com Doença de Alexander. Brasileiro pode ser um dos primeiros a testar tratamento revolucionário nos EUA..  Uma doença genética raríssima rouba, a cada dia, um pouco da vida do pe
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Pais | 0 | 4 | PROPN | nsubj | 1 | sim |
| buscam | 5 | 11 | VERB | ROOT | 1 | sim |
| cura | 12 | 16 | NOUN | obj | 1 | sim |
| para | 17 | 21 | ADP | case | 4 | sim |
| doença | 22 | 28 | NOUN | obl | 1 | sim |
| rara | 29 | 33 | ADJ | amod | 4 | sim |
| que | 34 | 37 | PRON | nsubj | 7 | sim |
| destrói | 38 | 45 | VERB | ccomp | 1 | sim |
| cérebro | 46 | 53 | NOUN | obj | 7 | sim |
| de | 54 | 56 | ADP | case | 10 | sim |
| criança | 57 | 64 | NOUN | nmod | 8 | sim |
| em | 65 | 67 | ADP | case | 12 | sim |

## true/2094

```text
 CHRISTIAN DE CASTRO, DA ANCINE. ARQUIVO PESSOAL Para Christian de Castro, novo presidente da agência, ela precisa ter menos burocracia, prazos mais curtos para os projetos e previsibilidade para interessar aos investidores . Assim que tomou posse na Agência Nacional de Cinema, no início do ano, Chr
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
|   | 0 | 1 | SPACE | dep | 0 | não |
| CHRISTIAN | 1 | 10 | NOUN | ROOT | 1 | sim |
| DE | 11 | 13 | ADP | case | 3 | sim |
| CASTRO | 14 | 20 | PROPN | nmod | 1 | sim |
| , | 20 | 21 | PUNCT | punct | 6 | não |
| DA | 22 | 24 | ADP | case | 6 | sim |
| ANCINE | 25 | 31 | PROPN | nmod | 3 | sim |
| . | 31 | 32 | PUNCT | punct | 1 | não |
| ARQUIVO | 33 | 40 | NOUN | ROOT | 8 | sim |
| PESSOAL | 41 | 48 | PROPN | flat:name | 8 | sim |
| Para | 49 | 53 | ADP | case | 11 | sim |
| Christian | 54 | 63 | PROPN | nmod | 16 | sim |

## true/1112

```text
Neurocientista que estuda psicopatas descobre que ele mesmo tem o distúrbio. James Fallon concedeu entrevista exclusiva ao 'Aliás'.  Mindhunter , a mais nova série da Netflix, que começou em outubro e já vai para a segunda temporada, devido ao grande sucesso, traz uma abordagem original sobre o comp
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Neurocientista | 0 | 14 | ADJ | nsubj | 4 | sim |
| que | 15 | 18 | PRON | nsubj | 2 | sim |
| estuda | 19 | 25 | VERB | acl:relcl | 0 | sim |
| psicopatas | 26 | 36 | NOUN | obj | 2 | sim |
| descobre | 37 | 45 | VERB | ROOT | 4 | sim |
| que | 46 | 49 | SCONJ | mark | 8 | sim |
| ele | 50 | 53 | PRON | nsubj | 8 | sim |
| mesmo | 54 | 59 | ADV | amod | 6 | sim |
| tem | 60 | 63 | VERB | ccomp | 4 | sim |
| o | 64 | 65 | DET | det | 10 | sim |
| distúrbio | 66 | 75 | NOUN | obj | 8 | sim |
| . | 75 | 76 | PUNCT | punct | 4 | não |

## fake/273

```text
Baixou a Dilma no homem: "Temos que apoiar a Reforma da Previdência. Em pouco tempo o homem viverá 140 anos".  Ahhh ... agora sim tá explicado, senhor presidento!.  Se tivesse falado isso antes, a população teria apoiado vosmicê desde o início da Reforma da Previdência. Em São Paulo, Temer declarou 
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
| Baixou | 0 | 6 | PROPN | ROOT | 0 | sim |
| a | 7 | 8 | DET | det | 2 | sim |
| Dilma | 9 | 14 | PROPN | obj | 0 | sim |
| no | 15 | 17 | ADP | case | 4 | sim |
| homem | 18 | 23 | NOUN | obl | 0 | sim |
| : | 23 | 24 | PUNCT | punct | 0 | não |
| " | 25 | 26 | PUNCT | nsubj | 9 | não |
| Temos | 26 | 31 | VERB | aux | 9 | sim |
| que | 32 | 35 | SCONJ | mark | 9 | sim |
| apoiar | 36 | 42 | VERB | ROOT | 9 | sim |
| a | 43 | 44 | DET | det | 11 | sim |
| Reforma | 45 | 52 | PROPN | obj | 9 | sim |

## true/3311

```text
 A pregação dos bispos católicos contra as reformas deixa muito claro que o combate contra as mudanças, que, aliás, tem encontrado eco num Congresso corrompido, suspeito e, sobretudo, pouco representativo, que grupos de parasitas e sanguessugas não aceitam de nenhuma perder privilégios, inalcançávei
```

| Token | Início | Fim | POS | DEP | Head | Elegível |
|---|---:|---:|---|---|---:|---|
|   | 0 | 1 | SPACE | dep | 0 | não |
| A | 1 | 2 | DET | det | 2 | sim |
| pregação | 3 | 11 | NOUN | nsubj | 9 | sim |
| dos | 12 | 15 | ADP | case | 4 | sim |
| bispos | 16 | 22 | NOUN | nmod | 2 | sim |
| católicos | 23 | 32 | ADJ | amod | 4 | sim |
| contra | 33 | 39 | ADP | case | 8 | sim |
| as | 40 | 42 | DET | det | 8 | sim |
| reformas | 43 | 51 | NOUN | nmod | 2 | sim |
| deixa | 52 | 57 | VERB | ROOT | 9 | sim |
| muito | 58 | 63 | ADV | advmod | 11 | sim |
| claro | 64 | 69 | ADJ | advmod | 9 | sim |
