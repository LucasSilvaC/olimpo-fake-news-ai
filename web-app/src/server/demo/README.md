# Desafio preparado por sala

O anfitrião abre `/sala/SEU-CODIGO?p=3`, antes de iniciar a partida. O parâmetro
carrega automaticamente as três notícias nos mesmos cartões do fluxo por URL. Os participantes usam
o endereço normal; a configuração carregada pertence à sala e sobrevive a recargas.
Depois de carregar os itens, o parâmetro é removido da URL. A autorização e o
estado `waiting` são conferidos no servidor; o parâmetro não concede acesso.

As três notícias são persistidas com identidades UUID próprias. O fluxo normal de
votos, tempo, pontuação e ranking continua ativo. Somente o conteúdo e as análises
dos itens preparados são reproduzidos localmente, sem extrair páginas ou chamar a
IA durante a partida. O gabarito pontua os votos independentemente da IA.

## Conteúdo e procedência

`scripts/demo-news-inputs.json` contém o texto exato analisado. As notícias
verdadeiras são **resumos redigidos para o desafio**, não transcrições integrais
extraídas do G1. As páginas indicadas não estavam acessíveis à extração nesta
preparação. Os horários `00:00` representam somente a data informada na URL,
não um horário de publicação confirmado; autores e imagens não confirmados estão
vazios.

- Gato Bones: [reportagem indicada do G1](https://g1.globo.com/planeta-bizarro/noticia/2019/09/04/gato-e-preso-suspeito-de-furto-nos-eua.ghtml).
  A notícia original é reproduzida e citada em uma
  [prova oficial da Prefeitura de Bauru, edital 21/2022](https://www2.bauru.sp.gov.br/arquivos/sist_concursos/concursos_documentos/concurso_397/concurso_397_anexo_7.pdf),
  questões 31–36. O resumo preserva os fatos ali documentados.
- Santa Aurora: cidade, veículo, projeto e promessa inventados para uma experiência
  educativa consentida. O domínio `.example` é reservado e não imita um veículo
  real. A imagem `/demo/challenge-street.png` foi gerada por IA e representa uma
  instalação imaginária. A revelação informa que texto e imagem são fictícios.
- Incêndio na UFPE: [reportagem indicada do G1](https://g1.globo.com/pe/pernambuco/noticia/2026/10/07/incendio-predio-da-ufpe-video.ghtml).
  Fatos corroborados pela cobertura de
  [O Tempo](https://www.otempo.com.br/brasil/2026/10/7/incendio-de-grandes-proporcoes-atinge-predio-da-ufpe-em-pernambuco),
  [Metrópoles](https://www.metropoles.com/brasil/incendio-predio-pesquisa-ufpe) e
  [Agora Litoral](https://agoralitoral.com.br/2026/10/08/incendio-atinge-predio-da-universidade-federal-de-pernambuco/).
  O resumo não faz atribuições sobre a causa do incêndio.

## Inferência real e reprodução

Os três resultados em `demo-news.ts` vieram dos motores reais `/supervised/analyze`
e `/analyze`, com as versões, identidade de inferência e hash de artefato retornados
pelo serviço. Todas as classificações coincidiram com os gabaritos nesta captura:

| Item                    | Gabarito   | Probabilidade estimada de falsidade | Classificação real |
| ----------------------- | ---------- | ----------------------------------- | ------------------ |
| Gato Bones              | Verdadeira | 19,89%                              | `reliable`         |
| Calçada de Santa Aurora | Falsa      | 77,94%                              | `unreliable`       |
| Incêndio na UFPE        | Verdadeira | 1,14%                               | `reliable`         |

Nenhum score, motivo ou padrão foi inventado. Foram testadas variantes do texto
fictício e selecionada uma que o modelo classificou como falsa. Isso demonstra
um exemplo selecionado, **não uma avaliação independente de acurácia**. O modelo
não verifica fontes, imagens ou fatos; seu score descreve associação textual.

Para regenerar, inicie o motor no ambiente exigido pelo manifesto (Python 3.14.2
e dependências exatas) e execute na raiz do `web-app`:

```powershell
$env:DEMO_MODEL_URL = 'http://127.0.0.1:8010'
node scripts/prepare-demo-news.mjs
pnpm exec prettier --write src/server/demo/demo-news.ts
```

O script chama os dois motores para o mesmo corpo, aplica a mesma seleção de até
três famílias de padrões usada pelo app e calcula o SHA-256 UTF-8 do corpo completo.

## Verificação da partida sem IA

`pnpm demo:check` usa o build de produção e dois navegadores (desktop e celular).
Exige `DEMO_SMOKE_DATABASE_URL` apontando para um banco descartável já migrado;
use também um Redis isolado em `DEMO_SMOKE_REDIS_URL`. Não execute com o banco da
apresentação. O teste carrega as três notícias pelo painel, recarrega a sala,
confere o bloqueio da previsão antes do último voto, a imagem, os seis votos,
os 300 pontos do jogador que acerta todas e a conclusão da partida. Um servidor
que responde 503 recebe qualquer tentativa de chamar o motor; a contagem final
de chamadas deve ser zero. Evidências ficam em `validation/demo-challenges/`.

```powershell
pnpm build
$env:DEMO_SMOKE_DATABASE_URL = 'postgresql://USUARIO:SENHA@127.0.0.1:PORTA/BANCO_DESCARTAVEL'
$env:DEMO_SMOKE_REDIS_URL = 'redis://127.0.0.1:PORTA'
pnpm demo:check
```

Ele só grava o arquivo após as três análises estarem disponíveis e todas as
classificações reais coincidirem com os gabaritos. Uma divergência falha com erro,
preservando o arquivo anterior, em vez de alterar o score. `capturedAt` registra a
captura e `bodySha256` vincula cada resultado ao conteúdo exibido.

A captura foi repetida no serviço Docker local (`8010`) depois da primeira
execução em Python 3.14.2 isolado: os três scores e as identidades coincidiram.
