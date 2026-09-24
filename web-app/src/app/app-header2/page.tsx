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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppHeader() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  // Estado para controlar o menu lateral manualmente
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

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
        
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="font-bold text-2xl tracking-tight transition-colors hover:opacity-80"
            style={{ color: "var(--roxo, #7A2ADB)" }}
          >
            OLIMPO
          </Link>
        </div>

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
                          ? "text-[var(--roxo)] font-bold bg-accent/50" 
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

        <div className="flex items-center gap-4">
          
          {mounted ? (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          ) : (
            <div className="w-9 h-9" /> 
          )}

          {/* Adicionado modal={false} para remover o blur do fundo da tela */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} modal={false}>
            <SheetTrigger className="relative h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--roxo)] transition-all hover:ring-2 hover:ring-[var(--roxo)]/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/user-01.png" alt="Avatar do usuário" />
                <AvatarFallback className="bg-[var(--roxo)] text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col border-l shadow-2xl">
              
              {/* O Avatar com Background que havia sumido foi restaurado aqui */}
              <div className="h-32 w-full bg-gradient-to-r from-[var(--roxo)] to-[#00879C] relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src="/avatars/user-01.png" alt="Avatar do usuário" />
                    <AvatarFallback className="bg-muted text-4xl text-[var(--roxo)]">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <SheetHeader className="px-6 pt-14 pb-6 text-center border-b">
                <SheetTitle className="text-xl font-bold text-foreground">Usuário Olimpo</SheetTitle>
                <p className="text-sm text-muted-foreground">usuario@exemplo.com</p>
                
                <div className="flex flex-col items-center gap-2 mt-4">
                  <span className="inline-flex items-center rounded-full bg-[var(--ouro)]/10 px-3 py-1 text-xs font-semibold text-[var(--ouro)]">
                    <Trophy className="w-3 h-3 mr-1" />
                    Nível 5 - Investigador
                  </span>
                  <span className="text-sm text-muted-foreground font-medium mt-1">
                    Posição no Ranking Global: <strong className="text-foreground">#42</strong>
                  </span>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                
                <div className="space-y-2">
                  <Link 
                    href="/perfil" 
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Configurações da Conta</span>
                  </Link>
                  <Link 
                    href="/leaderboard" 
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Trophy className="h-5 w-5 text-[var(--ouro)]" />
                    <span className="font-medium">Meu Ranking</span>
                  </Link>
                </div>
                
                <hr className="border-border" />
                
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-[var(--vermelho)] hover:bg-[var(--vermelho)]/10">
                    <LogOut className="mr-3 h-5 w-5" />
                    Terminar Sessão
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-[var(--vermelho)] hover:bg-[var(--vermelho)]/10">
                    <Trash2 className="mr-3 h-5 w-5" />
                    Apagar Conta
                  </Button>
                </div>

              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  );
}