import type { DocumentationNavigationGroup, IDocumentationPage } from "../model/types";

const repository = "https://github.com/LucasSilvaC/olimpo-fake-news-ai/blob/feat/linguistic-rules";

export const documentationGroupsEs: DocumentationNavigationGroup[] = [
  { id: "produto", title: "Producto", description: "Propósito, salas y reglas del juego.", icon: "Gamepad2" },
  { id: "engenharia", title: "Ingeniería", description: "Cómo se organizan los servicios y los datos.", icon: "Workflow" },
  { id: "manutencao", title: "Desarrollo", description: "Entorno local, calidad y documentación.", icon: "Wrench" },
];

export const documentationPagesEs: IDocumentationPage[] = [
  {
    slug: "visao-geral",
    href: "/",
    title: "Visión general",
    summary: "Qué propone Olimpo y cómo el juego convierte la verificación de noticias en una práctica compartida.",
    category: "El proyecto",
    group: "produto",
    icon: "Compass",
    readingTime: "3 min de lectura",
    sections: [
      {
        id: "proposito",
        title: "Aprender a verificar practicando en equipo",
        blocks: [
          {
            type: "paragraph",
            text: "Olimpo es un proyecto educativo que usa partidas y retos sobre noticias para ejercitar la lectura crítica, la comparación de fuentes y la prudencia antes de compartir información. La propuesta cambia las explicaciones meramente pasivas por decisiones que se toman durante el juego.",
          },
          {
            type: "figure",
            src: "/reading-the-newspaper.jpg",
            alt: "Una persona lee un periódico en una calle de Zúrich.",
            caption: "Leer con atención es el primer paso para investigar un titular.",
            credit: "Michael Kuhn (kuhnmi) · CC BY 2.0",
            creditHref: "https://commons.wikimedia.org/wiki/File:Reading_the_Newspaper_(31997783335).jpg",
          },
          {
            type: "callout",
            title: "Estado del proyecto",
            text: "Olimpo está en desarrollo. Esta guía resume las reglas y decisiones documentadas en el repositorio; los valores y nombres que aparecen en las pantallas pueden ser ejemplos visuales.",
          },
        ],
      },
      {
        id: "experiencia",
        title: "Qué reúne la experiencia",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "UsersRound",
                title: "Salas colaborativas",
                description: "Una persona anfitriona organiza una sala, comparte un PIN y prepara la secuencia de noticias de la partida.",
              },
              {
                icon: "Newspaper",
                title: "Noticias para investigar",
                description: "Cada ronda presenta una noticia para que los participantes evalúen su fiabilidad.",
              },
              {
                icon: "Trophy",
                title: "Aprendizaje con resultados",
                description: "La ronda revela la respuesta correcta y actualiza la puntuación de la sala; al final, el resultado suma XP al perfil.",
              },
            ],
          },
        ],
      },
      {
        id: "fontes",
        title: "Fuentes de esta guía",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README del proyecto",
                href: `${repository}/README.md`,
                description: "Objetivo, público y mecánicas centrales de Olimpo.",
              },
              {
                label: "Especificaciones OpenSpec",
                href: "https://github.com/LucasSilvaC/olimpo-fake-news-ai/tree/feat/linguistic-rules/openspec/specs",
                description: "Contratos de dominio para salas, votación y puntuación.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "salas-e-partidas",
    href: "/docs/salas-e-partidas",
    title: "Salas y partidas",
    summary: "Desde el PIN de acceso hasta el cierre de la ronda: los estados y condiciones que organizan una partida.",
    category: "Flujo del juego",
    group: "produto",
    icon: "UsersRound",
    readingTime: "4 min de lectura",
    sections: [
      {
        id: "ciclo-da-sala",
        title: "Ciclo de la partida",
        blocks: [
          {
            type: "paragraph",
            text: "Una sala comienza en espera. La persona anfitriona comparte el PIN, prepara la lista ordenada de noticias e inicia el juego cuando la sala y el contenido están listos.",
          },
          {
            type: "figure",
            src: "/jornada-da-partida.es.svg",
            alt: "Flujo en cuatro pasos: preparar la sala, responder la ronda, revelar el resultado y cerrar la partida.",
            caption: "La ronda conecta la preparación de la sala con el resultado colectivo.",
          },
          {
            type: "steps",
            items: [
              {
                title: "Crear la sala",
                description: "Una persona autenticada indica el nombre y la duración de la ronda. El sistema crea la sala en estado de espera y asigna el rol de anfitrión.",
              },
              {
                title: "Entrar con un PIN",
                description: "Los participantes introducen el PIN de seis dígitos, que se muestra con el formato XXX XXX. Pueden entrar mientras la sala esté en espera.",
              },
              {
                title: "Preparar el contenido",
                description: "La persona anfitriona añade noticias en un orden definido. Para iniciar se necesita al menos una persona participante y una noticia.",
              },
              {
                title: "Responder y avanzar",
                description: "Cada persona envía una respuesta para la ronda activa. El ciclo termina cuando todos responden o se agota el tiempo de la ronda.",
              },
            ],
          },
        ],
      },
      {
        id: "estados-da-sala",
        title: "Estados de la sala",
        blocks: [
          {
            type: "table",
            headers: ["Estado", "Qué significa", "Acceso de participantes"],
            rows: [
              ["En espera", "La persona anfitriona está preparando la sala.", "Se aceptan participantes con un PIN válido."],
              ["En curso", "Las rondas de la partida están activas.", "Se rechazan nuevas entradas."],
              ["Finalizada", "La lista de rondas se ha completado.", "Se rechazan nuevas entradas."],
            ],
          },
          {
            type: "callout",
            title: "Duración mínima",
            text: "La especificación de salas rechaza las duraciones inferiores a 10 segundos y los nombres vacíos. También exige contenido y participantes antes de iniciar.",
          },
        ],
      },
      {
        id: "referencias-salas",
        title: "Fuentes del flujo",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Especificación de salas",
                href: `${repository}/openspec/specs/rooms/spec.md`,
                description: "PIN, acceso, lista de reproducción e inicio de la partida.",
              },
              {
                label: "Especificación de eventos en tiempo real",
                href: `${repository}/openspec/specs/realtime-events/spec.md`,
                description: "Eventos que se usan para actualizar el estado de la sala.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "votacao-e-pontuacao",
    href: "/docs/votacao-e-pontuacao",
    title: "Votación y puntuación",
    summary: "Las opciones de respuesta, el cierre de cada ronda y el cálculo de la puntuación.",
    category: "Reglas del juego",
    group: "produto",
    icon: "Trophy",
    readingTime: "3 min de lectura",
    sections: [
      {
        id: "opcoes",
        title: "Tres respuestas posibles",
        blocks: [
          {
            type: "paragraph",
            text: "La votación compara la evaluación de cada persona con la clasificación de referencia de la noticia. La opción de duda permite reconocer que todavía faltan pruebas.",
          },
          {
            type: "table",
            headers: ["Opción en la interfaz", "Valor de dominio", "Interpretación"],
            rows: [
              ["Hecho", "reliable", "La noticia es fiable."],
              ["Duda", "uncertain", "Hay que buscar más elementos."],
              ["Falsa", "unreliable", "La noticia no es fiable."],
            ],
          },
        ],
      },
      {
        id: "fechamento",
        title: "Cómo se cierra una ronda",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "Se registra la respuesta",
                description: "Cada participante de la sala puede votar una vez en la ronda activa. Se rechazan las respuestas duplicadas o enviadas fuera de la ronda.",
              },
              {
                title: "El sistema cierra la ronda",
                description: "El recuento comienza cuando todos los participantes activos han respondido o cuando termina la duración establecida.",
              },
              {
                title: "El resultado actualiza la puntuación",
                description: "La clasificación correcta suma puntos. Las respuestas que difieren de la solución siguen las reglas de evaluación del juego.",
              },
              {
                title: "La partida suma XP",
                description: "Cuando termina la sala, la puntuación acumulada se convierte en XP permanente para el perfil de cada participante.",
              },
            ],
          },
          {
            type: "callout",
            title: "Esta guía no fija valores de puntos",
            text: "OpenSpec describe los criterios de puntuación, pero no publica una tabla fija de puntos por acción. Por eso, esta guía explica las reglas sin presentar como promesa los valores de las pantallas de demostración.",
            tone: "info",
          },
        ],
      },
      {
        id: "referencias-votacao",
        title: "Fuentes de las reglas",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Especificación de votación",
                href: `${repository}/openspec/specs/news-voting/spec.md`,
                description: "Opciones permitidas, un voto por persona y cierre de la ronda.",
              },
              {
                label: "Especificación de gamificación",
                href: `${repository}/openspec/specs/gamification/spec.md`,
                description: "Puntuación por ronda, clasificación y XP al final de la partida.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "extracao-de-noticias",
    href: "/docs/extracao-de-noticias",
    title: "Extracción de noticias",
    summary: "Cómo se valida una URL pública, se lee y se convierte en datos estructurados para el producto.",
    category: "Entrada de contenido",
    group: "engenharia",
    icon: "Newspaper",
    readingTime: "4 min de lectura",
    sections: [
      {
        id: "entrada",
        title: "De la URL al artículo estructurado",
        blocks: [
          {
            type: "paragraph",
            text: "El endpoint POST /api/news/extract recibe una URL y devuelve un artículo normalizado. El extractor busca metadatos estructurados y texto editorial, y conserva campos como el título, la descripción, los autores, la fecha, el contenido, la imagen y el método de extracción.",
          },
          {
            type: "figure",
            src: "/pipeline-de-noticias.es.svg",
            alt: "Flujo que recibe una URL, valida el destino, extrae metadatos y texto, y devuelve un artículo normalizado.",
            caption: "El analizador combina los metadatos de la página con el texto editorial del artículo.",
          },
          {
            type: "table",
            headers: ["Fuente", "Uso en el flujo"],
            rows: [
              ["JSON-LD", "Lee datos estructurados como NewsArticle y Article, incluso dentro de grafos."],
              ["Open Graph y metadatos", "Recupera el título, la descripción, la imagen y otros datos publicados por la página."],
              ["Mozilla Readability", "Identifica el cuerpo principal del texto sin cargar los scripts de la página."],
              ["Jina Reader", "Puede usarse como alternativa cuando el texto extraído localmente no es suficiente."],
            ],
          },
        ],
      },
      {
        id: "seguranca-url",
        title: "Las URL se tratan como entradas no confiables",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "ShieldCheck",
                title: "Protocolos restringidos",
                description: "Solo se aceptan HTTP y HTTPS; se rechazan los demás esquemas.",
              },
              {
                icon: "Database",
                title: "Destino verificado",
                description: "Se bloquean las direcciones locales, las redes privadas y los destinos de metadatos en la nube tras validar el DNS y la IP.",
              },
              {
                icon: "GitBranch",
                title: "Redirecciones limitadas",
                description: "Se vuelve a validar cada destino y la navegación se limita a tres redirecciones.",
              },
            ],
          },
          {
            type: "callout",
            title: "Errores previsibles",
            text: "El contrato distingue entre URL no válida, destino inseguro, página inexistente, fallo de extracción y error interno. Las respuestas internas no exponen trazas de pila.",
          },
        ],
      },
      {
        id: "referencias-parser",
        title: "Fuentes técnicas",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README del web-app",
                href: `${repository}/web-app/README.md`,
                description: "Flujo del analizador, respuesta y códigos de error.",
              },
              {
                label: "Manejador de ruta de extracción",
                href: `${repository}/web-app/src/app/api/news/extract/route.ts`,
                description: "Adaptador HTTP que valida la entrada y coordina la extracción.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "arquitetura",
    href: "/docs/arquitetura",
    title: "Arquitectura de la aplicación",
    summary: "Cómo la separación entre interfaz, casos de uso e infraestructura sostiene Olimpo.",
    category: "Visión técnica",
    group: "engenharia",
    icon: "Workflow",
    readingTime: "5 min de lectura",
    sections: [
      {
        id: "mapa",
        title: "Mapa de responsabilidades",
        blocks: [
          {
            type: "paragraph",
            text: "El web-app usa Next.js y TypeScript en el borde. Las acciones validan las entradas, llaman a los casos de uso y dependen de contratos de repositorio. Las implementaciones concretas conectan las reglas de negocio con los servicios de datos.",
          },
          {
            type: "figure",
            src: "/arquitetura-olimpo.es.svg",
            alt: "Diagrama de arquitectura: interfaz de Next.js, acciones, casos de uso, interfaces de repositorio y PostgreSQL o Redis.",
            caption: "Las dependencias apuntan a las reglas de negocio; la infraestructura implementa las interfaces definidas por la aplicación.",
          },
        ],
      },
      {
        id: "camadas",
        title: "Cómo se organiza el código",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "BookOpen",
                title: "Interfaz y rutas",
                description: "El App Router expone páginas y endpoints. Views, widgets y features organizan los flujos visuales por funcionalidad.",
              },
              {
                icon: "GitBranch",
                title: "Aplicación y dominio",
                description: "Los casos de uso coordinan cada acción; las entidades y reglas de negocio se mantienen separadas de la base de datos, la red y el framework.",
              },
              {
                icon: "Database",
                title: "Infraestructura",
                description: "Los repositorios concretos usan Drizzle/PostgreSQL para registros duraderos y Redis para el estado transitorio de alta frecuencia.",
              },
            ],
          },
          {
            type: "callout",
            title: "Especificaciones que guían el desarrollo",
            text: "OpenSpec mantiene los requisitos por funcionalidad y registra propuestas de cambio. Usa las especificaciones para entender los contratos; el código y el estado de los cambios muestran qué está implementado.",
          },
        ],
      },
      {
        id: "fontes-arquitetura",
        title: "Fuentes de arquitectura",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Documento de arquitectura (PDF)",
                href: `${repository}/docs/arquitetura.pdf`,
                description: "Decisiones técnicas y límites operativos del proyecto.",
              },
              {
                label: "README del repositorio",
                href: `${repository}/README.md`,
                description: "Resumen de la tecnología y los principios de ingeniería.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "dados-e-tempo-real",
    href: "/docs/dados-e-tempo-real",
    title: "Datos y tiempo real",
    summary: "Por qué los datos persistentes y el estado de la partida siguen caminos diferentes.",
    category: "Servicios de apoyo",
    group: "engenharia",
    icon: "RadioTower",
    readingTime: "3 min de lectura",
    sections: [
      {
        id: "persistencia",
        title: "Cada dato tiene un ciclo de vida",
        blocks: [
          {
            type: "paragraph",
            text: "La persistencia es híbrida. PostgreSQL guarda los datos que deben seguir disponibles, mientras que Redis atiende lecturas y actualizaciones frecuentes relacionadas con las salas activas.",
          },
          {
            type: "table",
            headers: ["Servicio", "Responsabilidad documentada", "Ejemplos"],
            rows: [
              ["PostgreSQL", "Datos relacionales duraderos y consistencia transaccional.", "Usuarios, artículos e historial completado."],
              ["Redis", "Estado transitorio, operaciones rápidas y publicación de eventos.", "PIN activos, puntuación y canales de las salas."],
            ],
          },
        ],
      },
      {
        id: "eventos",
        title: "Actualizaciones del servidor a los clientes",
        blocks: [
          {
            type: "paragraph",
            text: "Las salas usan Server-Sent Events (SSE) para enviar eventos del servidor al navegador mediante una conexión HTTP continua. Redis Pub/Sub distribuye las notificaciones de la sala; el Route Handler convierte esos mensajes en eventos del flujo.",
          },
          {
            type: "steps",
            items: [
              { title: "Una acción modifica la sala", description: "El caso de uso actualiza el estado necesario y publica un evento asociado al PIN." },
              { title: "Redis distribuye el mensaje", description: "El canal de la sala entrega la actualización a los listeners activos." },
              { title: "SSE lo envía al navegador", description: "El Route Handler escribe el evento en el flujo y libera recursos cuando termina la conexión." },
            ],
          },
          {
            type: "callout",
            title: "Alcance del canal",
            text: "SSE gestiona las actualizaciones del servidor al cliente. Las acciones de los participantes siguen llegando por rutas o Server Actions independientes.",
          },
        ],
      },
      {
        id: "fontes-dados",
        title: "Fuentes técnicas",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Documento de arquitectura (PDF)",
                href: `${repository}/docs/arquitetura.pdf`,
                description: "Persistencia híbrida, Pub/Sub e implementación de SSE.",
              },
              {
                label: "Especificación de eventos en tiempo real",
                href: `${repository}/openspec/specs/realtime-events/spec.md`,
                description: "Eventos de dominio publicados por las salas.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "executar-localmente",
    href: "/docs/executar-localmente",
    title: "Ejecutar en local",
    summary: "Comandos separados para iniciar la documentación y la aplicación principal.",
    category: "Entorno de desarrollo",
    group: "manutencao",
    icon: "Terminal",
    readingTime: "4 min de lectura",
    sections: [
      {
        id: "requisitos",
        title: "Requisitos del repositorio",
        blocks: [
          {
            type: "cards",
            items: [
              { icon: "Terminal", title: "Node.js 24", description: "El package.json del docu-app admite Node.js desde la versión 24 y anteriores a la 25." },
              { icon: "Wrench", title: "pnpm 11.10+", description: "El workspace declara pnpm 11.10.0 como gestor de paquetes." },
              { icon: "Database", title: "Servicios del web-app", description: "La aplicación principal también usa PostgreSQL y Redis; la documentación no depende de esos servicios." },
            ],
          },
        ],
      },
      {
        id: "iniciar-documentacao",
        title: "Iniciar solo la documentación",
        blocks: [
          {
            type: "paragraph",
            text: "El docu-app es independiente: ejecútalo desde su propia carpeta. No necesita base de datos ni configuración de servicios externos.",
          },
          {
            type: "code",
            label: "PowerShell · carpeta docu-app",
            language: "powershell",
            code: "pnpm install\npnpm dev",
          },
          {
            type: "paragraph",
            text: "El servidor de desarrollo escucha en 127.0.0.1:3000.",
          },
        ],
      },
      {
        id: "iniciar-aplicativo",
        title: "Iniciar la aplicación principal",
        blocks: [
          {
            type: "paragraph",
            text: "Para iniciar el web-app, arranca PostgreSQL y Redis, configura las variables locales a partir del archivo de ejemplo y aplica las migraciones antes de iniciar el servidor.",
          },
          {
            type: "code",
            label: "PowerShell · raíz del repositorio",
            language: "powershell",
            code: "Set-Location web-app\npnpm install\nCopy-Item .env.example .env.local\npnpm db:migrate\npnpm dev",
          },
          {
            type: "callout",
            title: "Configuración local",
            text: "Completa .env.local con las direcciones y credenciales de tu entorno. No subas el archivo local al repositorio; mantén las credenciales fuera del código.",
          },
        ],
      },
      {
        id: "fontes-execucao",
        title: "Instrucciones y fuentes",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README del docu-app",
                href: `${repository}/docu-app/README.md`,
                description: "Ejecución y organización de esta aplicación de documentación.",
              },
              {
                label: "README del web-app",
                href: `${repository}/web-app/README.md`,
                description: "Scripts y detalles de desarrollo de la aplicación principal.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "qualidade-e-acessibilidade",
    href: "/docs/qualidade-e-acessibilidade",
    title: "Calidad y accesibilidad",
    summary: "Controles de ingeniería, funciones de accesibilidad existentes y límites de las mediciones registradas.",
    category: "Calidad del producto",
    group: "manutencao",
    icon: "Accessibility",
    readingTime: "4 min de lectura",
    sections: [
      {
        id: "checks",
        title: "Controles disponibles",
        blocks: [
          {
            type: "table",
            headers: ["Verificación", "Herramienta", "Comando"],
            rows: [
              ["Tipos", "TypeScript", "pnpm typecheck"],
              ["Análisis estático", "ESLint", "pnpm lint"],
              ["Pruebas unitarias e integración", "Vitest", "pnpm test:unit"],
              ["Flujos en el navegador", "Playwright", "pnpm test:e2e"],
            ],
          },
        ],
      },
      {
        id: "recursos-acessiveis",
        title: "Funciones implementadas y aspectos pendientes de medición",
        blocks: [
          {
            type: "cards",
            items: [
              {
                icon: "Accessibility",
                title: "Navegación y foco",
                description: "Los controles nativos, las etiquetas asociadas y los estilos de foco visible aparecen en los flujos y componentes documentados.",
              },
              {
                icon: "ShieldCheck",
                title: "Mensajes de estado",
                description: "Los formularios y las cargas usan mensajes de texto y regiones de anuncio en algunas partes del producto.",
              },
              {
                icon: "Files",
                title: "Medición parcial del contraste",
                description: "El JSON de evidencias mide pares seleccionados del código; algunas combinaciones no alcanzan los umbrales registrados.",
              },
            ],
          },
          {
            type: "callout",
            title: "No es una declaración general de conformidad",
            text: "Las mediciones disponibles no cubren el DOM, las opacidades, los estados de interacción ni todas las pantallas. Registran evidencias y tareas pendientes; no demuestran la conformidad WCAG AA de todo el producto.",
            tone: "warning",
          },
        ],
      },
      {
        id: "fontes-qualidade",
        title: "Fuentes y evidencias",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "Informe de arquitectura y accesibilidad",
                href: `${repository}/docs/arquitetura.pdf`,
                description: "Estrategia de calidad y evidencias de accesibilidad.",
              },
              {
                label: "Mediciones de contraste",
                href: `${repository}/docs/acessibilidade-contrastes.json`,
                description: "Pares medidos, relación de contraste y alcance de la auditoría.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "manter-documentacao",
    href: "/docs/manter-documentacao",
    title: "Mantener esta documentación",
    summary: "Dónde están los artículos, cómo se configura la navegación general y cómo conservar el contrato de contenido.",
    category: "Contribuir",
    group: "manutencao",
    icon: "Files",
    readingTime: "3 min de lectura",
    sections: [
      {
        id: "origem-conteudo",
        title: "Contenido e interfaz se mantienen separados",
        blocks: [
          {
            type: "paragraph",
            text: "Los art?culos est?n en documentation-pages.ts, documentation-pages.en.ts y documentation-pages.es.ts. Cada archivo sigue el contrato IDocumentationPage; los identificadores de p?ginas y secciones se mantienen entre idiomas.",
          },
          {
            type: "table",
            headers: ["Archivo", "Responsabilidad"],
            rows: [
              ["src/entities/documentation/data/documentation-pages.ts","Art?culos en portugu?s: textos, secciones, figuras, referencias y grupos de navegaci?n."],
              ["src/entities/documentation/data/documentation-pages.en.ts","Art?culos en ingl?s con la misma estructura tipada."],
              ["src/entities/documentation/data/documentation-pages.es.ts","Art?culos en espa?ol con la misma estructura tipada."],
              ["messages/[locale]/*.json","Textos est?ticos de la interfaz para cada idioma."],
              ["src/entities/documentation/model/types.ts","Contrato tipado de los art?culos y bloques de contenido."],
              ["src/entities/documentation/index.ts","Selecci?n del cat?logo de contenido seg?n el idioma."],
              ["src/i18n/routing.ts","Idiomas disponibles y reglas de prefijo en las rutas."],
              ["src/features/documentation-navigation/ui/sidebar-navigation.tsx","B?squeda y navegaci?n agrupada de la barra lateral."],
              ["src/views/document/ui/document-page.tsx","Renderizado de art?culos, figuras, tablas y referencias."],
            ],
          },
        ],
      },
      {
        id: "criar-artigo",
        title: "Lista para crear un artículo",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "Confirma la fuente", description: "Prioriza el código actual, las especificaciones de OpenSpec y los documentos del proyecto. Indica si la información es una regla, una implementación o un plan." },
              { title: "Elige un tema general", description: "Usa Producto, Ingeniería o Desarrollo. Reserva la barra lateral para las áreas generales y desarrolla los subtemas dentro del artículo." },
              { title: "Añade navegación visual", description: "Elige un icono de Lucide para el artículo y usa SVG o imágenes con texto alternativo, pie y crédito." },
              { title: "Añade referencias", description: "Enlaza el documento o el código que respalda cada recomendación técnica importante." },
            ],
          },
          {
            type: "callout",
            title: "Ejecutar la documentación",
            text: "Desde la carpeta docu-app, ejecuta pnpm install y pnpm dev. Los scripts de lint y typecheck están definidos en package.json.",
          },
        ],
      },
      {
        id: "fonte-docu-app",
        title: "También puedes leer",
        blocks: [
          {
            type: "references",
            items: [
              {
                label: "README del docu-app",
                href: `${repository}/docu-app/README.md`,
                description: "Estructura técnica y comandos de esta aplicación.",
              },
              {
                label: "Iconos de Lucide",
                href: "https://lucide.dev/icons/",
                description: "Catálogo de iconos SVG usados por la interfaz.",
              },
            ],
          },
        ],
      },
    ],
  },
];
