"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, User, Settings, LogOut, Trash2, Trophy } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Importações do novo componente Sheet (Menu Lateral)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function AppHeader() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevenção de Hydration Mismatch na alternância do tema
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Desafio", href: "/desafio" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Branding (Logotipo) */}
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="font-bold text-2xl tracking-tight transition-colors hover:opacity-80"
            style={{ color: "var(--roxo, #7A2ADB)" }}
          >
            OLIMPO
          </Link>
        </div>

        {/* Navegação Acessível */}
        <NavigationMenu>
          <NavigationMenuList>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <NavigationMenuItem key={link.href}>
                  <Link href={link.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} ${
                        isActive 
                          ? "text-[#7A2ADB] font-bold bg-accent/50 dark:text-[#9F5BFF]" 
                          : "text-foreground"
                      }`}
                    >
                      {link.name}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Ações à Direita: Tema e Perfil */}
        <div className="flex items-center gap-4">
          
          {/* Alternar Tema */}
          {mounted ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
              className="text-foreground hover:text-[#7A2ADB] dark:hover:text-[#9F5BFF] transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          ) : (
            <div className="w-9 h-9" /> 
          )}

          {/* Menu do Utilizador (Sheet / Painel Lateral) */}
          <Sheet>
            <SheetTrigger className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7A2ADB] transition-all hover:ring-2 hover:ring-[#7A2ADB]/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/user-01.png" alt="Avatar do usuário" />
                <AvatarFallback className="bg-[#7A2ADB] text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col border-l">
              
              {/* Capa de Fundo do Perfil (Mistura Roxo e Ciano) */}
              <div className="h-32 w-full bg-gradient-to-r from-[#7A2ADB] to-[#00879C] relative">
                
                {/* O Avatar sobrepondo a capa */}
                <div className="absolute -bottom-10 left-6">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src="/avatars/user-01.png" alt="Avatar do usuário" />
                    <AvatarFallback className="bg-muted text-4xl text-[#7A2ADB]">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <SheetHeader className="px-6 pt-12 pb-4 text-left border-b">
                <SheetTitle className="text-xl font-bold text-foreground">Usuário Olimpo</SheetTitle>
                <p className="text-sm text-muted-foreground">usuario@exemplo.com</p>
                
                {/* Badge de Gamificação (Score/Nível usando Ouro) */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center rounded-full bg-[#D19200]/10 px-3 py-1 text-xs font-semibold text-[#D19200] dark:bg-[#EBA814]/10 dark:text-[#EBA814]">
                    <Trophy className="w-3 h-3 mr-1" />
                    Nível 5 - Investigador
                  </span>
                </div>
              </SheetHeader>
              
              {/* Opções de Navegação do Perfil */}
              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
                <SheetClose asChild>
                  <Link href="/perfil" className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Configurações da Conta</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/leaderboard" className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors">
                    <Trophy className="h-5 w-5 text-[#D19200] dark:text-[#EBA814]" />
                    <span className="font-medium">Meu Ranking</span>
                  </Link>
                </SheetClose>
              </div>
              
              {/* Ações Destrutivas no Rodapé (usando Vermelho do Branding) */}
              <div className="p-4 border-t space-y-2 bg-muted/20">
                <Button variant="ghost" className="w-full justify-start text-[#CF240A] dark:text-[#F04D36] hover:bg-[#CF240A]/10 dark:hover:bg-[#F04D36]/10">
                  <LogOut className="mr-3 h-5 w-5" />
                  Terminar Sessão
                </Button>
                <Button variant="ghost" className="w-full justify-start text-[#CF240A] dark:text-[#F04D36] hover:bg-[#CF240A]/10 dark:hover:bg-[#F04D36]/10">
                  <Trash2 className="mr-3 h-5 w-5" />
                  Apagar Conta
                </Button>
              </div>
              
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
}