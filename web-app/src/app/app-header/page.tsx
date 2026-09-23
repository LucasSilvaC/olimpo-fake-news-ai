'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, 
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScanEye, Target, Trophy, Settings, User, LogOut, Sun, Moon } from "lucide-react";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const user = { name: "Investigador01" };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica mais abrangente para detectar a página inicial
  const isVerifierActive = pathname === "/" || pathname === "/homepage" || pathname === "/verificador";
  const isChallengeActive = pathname === "/desafio";

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      
      {/* Header expandido com max-w-3xl e flex garantindo o espaçamento */}
      <header className="pointer-events-auto flex h-16 w-full max-w-3xl items-center justify-between rounded-full border bg-background/80 px-6 shadow-lg backdrop-blur-md">
        
        {/* Navegação Principal */}
        <nav className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            className={`rounded-full px-5 font-medium transition-colors ${
              isVerifierActive 
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                : "text-muted-foreground hover:text-foreground"
            }`} 
            asChild
          >
            {/* Flex e gap-2 garantem o ícone e texto alinhados lado a lado */}
            <Link href="/" className="flex items-center gap-2">
              <ScanEye className="h-5 w-5" />
              <span>Verificador</span>
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`rounded-full px-5 font-medium transition-colors ${
              isChallengeActive 
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                : "text-muted-foreground hover:text-foreground"
            }`} 
            asChild
          >
            <Link href="/desafio" className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <span>Desafio</span>
            </Link>
          </Button>
        </nav>

        {/* Linha Divisória */}
        <div className="h-8 w-px bg-border mx-2"></div>

        {/* Controles da Direita */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
            className="rounded-full h-10 w-10"
          >
            {mounted && (theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />)}
            <span className="sr-only">Alternar Tema</span>
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30">
            <Trophy className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0 ml-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://github.com/shadcn.png" alt={user.name} />
                  <AvatarFallback>ED</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end" sideOffset={12}>
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}