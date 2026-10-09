# Olimpo — template de apresentação

Apresentação com a abertura original, três slides de problema e três de solução. HTML independente, CSS/JS inline e palco 1920 × 1080 escalado uniformemente.

## Prévia e edição

Abra `slides/olimpo.html` diretamente no navegador. A apresentação é independente do web-app e não precisa de servidor, instalação ou rede: fontes e imagem estão incorporadas.

Pressione **E**, ou passe o mouse no canto superior esquerdo, para editar. **Esc** conclui; **Ctrl+S / Cmd+S** baixa um HTML com os textos atuais. A edição salva automaticamente neste navegador. O conteúdo inicial permanece no arquivo-fonte.

Use **← / →**, **PageUp / PageDown**, **espaço**, a roda do mouse ou um gesto horizontal no celular para navegar. Os controles também aparecem ao passar o mouse na região inferior central. As transições usam dissolução de 650 ms e entrada discreta do conteúdo; a preferência de movimento reduzido é respeitada.

## Seção de problema — 2 minutos

1. **Pensamento crítico em falta** — consumo acelerado, bolhas de opinião e compartilhamento impulsivo. Pergunta: “O que nos faz acreditar em uma notícia?”
2. **Confiabilidade das notícias** — exemplo do desafio do gato Bones, com imagem incorporada, manchete e crédito ao G1 (04/09/2019). Original em `assets/gato-bones.jpg`. As notas explicam o sentido figurado de “preso”, conforme o gabarito.
3. **Barreiras à checagem** — esforço de verificar, aprendizagem passiva e respostas sem explicação. Pergunta de passagem ao pitch: “Como tornar o questionamento um hábito?”

Reserve cerca de **40 segundos por slide**. As notas de fala e as referências locais estão nos elementos `.speaker-notes` de cada slide, fora da projeção. Conteúdo baseado no `text.txt` da raiz do workspace, no README principal e na seção 1 do documento `docs/entregaveis/entregavel-final-reestruturado.md`. As barreiras são a motivação do projeto; não representam resultados medidos de adesão. Não foram usadas estatísticas sem fonte.

## Seção de solução — 2 minutos

1. **Aprender com o Olimpo** — modos solo e grupo; captura real da leitura e votação em sala. O recorte elimina a área de notificações do teste.
2. **Observar a escrita** — painel FP-Growth, catálogo experimental de 20 padrões, leitura dos primeiros 300 caracteres e frequências descritivas com 720 notícias por classe na validação. Não são probabilidades de uma notícia nova.
3. **Uma estimativa explicada** — painel do gato Bones e scores reais dos três desafios: 19,89; 77,94; 1,14, na escala 0–100. Exemplos selecionados da demonstração, sem alegação de avaliação independente de acurácia. Os pontos continuam definidos pelo gabarito cadastrado.

Reserve **40 segundos por slide**. Referências completas e ressalvas de interpretação estão nas notas de fala do HTML. Capturas de validação preservadas em assets/app-votacao.png, assets/app-observacoes.png e assets/app-previsao-bones.png; os recortes são feitos apenas em CSS. Todas as imagens estão incorporadas para uso offline. Os textos e a tabela de scores permanecem editáveis.

## Reutilização

- `:root`: paleta, fontes e margem lateral segura de 320 px.
- `.scenery`: arte de papiro e colunas, independente do conteúdo.
- `.slide-content`: composição central; textos em elementos semânticos com `data-edit`.
- Fontes incorporadas do Google Fonts: Cinzel 500 e Source Serif 4 400, com acentos portugueses.
- Paleta: papiro `#f4ead7`, marrom `#4b2e19`, texto secundário `#71543b`, ocre `#ad8753`.
- `assets/papiro-colunas.png`: original da arte incorporada, preservado para reutilização. Fundo e colunas formam um único recurso decorativo raster; textos permanecem editáveis.

Não há novos pacotes, alterações de rotas ou mudanças no aplicativo. A abertura e as seções de problema e solução estão implementadas; pitch, roadmap, ganhos e conclusão seguem para as próximas etapas do roteiro (máximo de 15 slides no total).

## Arte

Gerada com a ferramenta integrada ImageGen. Prompt final:

> Create a reusable presentation background asset, landscape 16:9 1920x1080. NO TEXT. Warm pale ivory aged papyrus (#f4ead7), subtle organic watercolor mottling, fine paper grain and soft uneven pale ochre stains. Two elegant ancient Greek IONIC columns with spiral volute capitals, one at each far lateral edge. Each column occupies only outermost 12% of canvas, full height, capitals entirely visible, bases visible near bottom. Antique book illustration, refined sepia engraved linework mixed with very soft watercolor sandy ochre shading, not photorealistic, not heavy outlines. Symmetric quiet architectural framing, central 72% almost empty luminous pale parchment with very subtle texture for editable dark brown typography later. Columns have fluted shafts. Restrained classical elegant composition. No Apollo, no people, no statues, no blue, no text, no letters, no symbols in center, no heavy border. Save generated asset for integration into a local HTML project.

## Validação

Playwright/Chromium: sete slides em proporção 16:9, inspeção visual, fontes incorporadas, navegação e edição. O palco mantém escala uniforme no celular. Nenhuma suíte do aplicativo foi executada: a alteração é um artefato HTML estático isolado.
