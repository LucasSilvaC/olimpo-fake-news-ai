import Image from "next/image";
import Link from "next/link";

const partners = [
  {
    name: "PUC Campinas",
    href: "https://www.puc-campinas.edu.br/",
    src: "/partners/puc-campinas.svg",
    width: 412,
    height: 155,
  },
  {
    name: "Instituto Eldorado",
    href: "https://www.eldorado.org.br/",
    src: "/partners/eldorado.svg",
    width: 425,
    height: 174,
  },
];

export function Footer(): React.ReactElement {
  return (
    <footer className="w-full border-t border-white/20 bg-white/10 text-white backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:gap-6 sm:px-6">
        <Link
          href="/"
          aria-label="Olimpo, início"
          className="group inline-flex items-center gap-2.5 rounded-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          <Image
            src="/olimpo-logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
          />
          <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
            Olimpo
          </span>
        </Link>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
          <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">
            Apoio institucional
          </span>
          <nav aria-label="Instituições parceiras" className="flex items-center gap-2 sm:gap-3">
            {partners.map((partner) => (
              <a
                key={partner.name}
                href={partner.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visitar ${partner.name}`}
                className="flex h-9 w-[80px] items-center justify-center rounded-lg border border-white/30 bg-white px-2 shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none sm:h-10 sm:w-[94px]"
              >
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  unoptimized
                  className="h-5 w-auto object-contain sm:h-6"
                />
              </a>
            ))}
          </nav>
        </div>

        <a
          href="https://github.com/LucasSilvaC/olimpo-fake-news-ai"
          target="_blank"
          rel="noreferrer"
          aria-label="Repositório do projeto no GitHub"
          className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm transition-all hover:scale-105 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          <svg className="size-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>

      <div className="w-full border-t border-white/10 px-4 py-2.5 text-center text-xs font-medium text-white/80 sm:text-sm">
        <p>© 2026 Olimpo. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
