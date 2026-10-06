import { ShieldCheck } from "lucide-react";
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
    <footer className="w-full border-t border-white/15 bg-blue-950/25 text-white">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="Olimpo, início"
          className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          <ShieldCheck className="size-6" aria-hidden="true" />
        </Link>

        <nav
          aria-label="Instituições parceiras"
          className="flex items-center justify-center gap-2 sm:gap-4"
        >
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visitar ${partner.name}`}
              className="flex h-10 w-[76px] items-center justify-center rounded-lg bg-white px-2 shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none sm:h-12 sm:w-[100px]"
            >
              <Image
                src={partner.src}
                alt={partner.name}
                width={partner.width}
                height={partner.height}
                unoptimized
                className="h-6 w-auto object-contain sm:h-8"
              />
            </a>
          ))}
        </nav>

        <a
          href="https://github.com/LucasSilvaC/olimpo-fake-news-ai"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="inline-flex size-10 items-center justify-center rounded-xl text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          <svg className="size-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>

      <p className="w-full border-t border-white/10 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        © 2026 Olimpo. Todos os direitos reservados.
      </p>
    </footer>
  );
}
