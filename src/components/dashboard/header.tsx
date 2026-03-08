'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Factory as MillIcon, ChevronsUpDown, Factory, Calendar, Settings, Home } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';
import type { ViewState } from '@/app/page';

interface AppHeaderProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

export function AppHeader({ onNavigate, currentView }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { selectedMill, mills, selectMill } = useMill();
  const { selectedKmsYear, selectKmsYear, availableKmsYears } = useKmsYear();

  if (!user || !selectedMill || !selectedKmsYear) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleMillChange = (millId: string) => {
    selectMill(millId);
  };
  
  const handleKmsYearChange = (year: string) => {
    selectKmsYear(year);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div 
          className="mr-6 flex items-center space-x-2 cursor-pointer" 
          onClick={() => onNavigate('main')}
        >
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <MillIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold font-headline text-xl text-primary tracking-tight">Mandi Monitor</span>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-primary">{selectedMill.name}</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Operational Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {mills.map((mill) => (
                    <DropdownMenuItem key={mill.id} onSelect={() => handleMillChange(mill.id)} className="cursor-pointer">
                      {mill.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-primary">KMS {selectedKmsYear}</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Marketing Season</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableKmsYears.map((year) => (
                    <DropdownMenuItem key={year} onSelect={() => handleKmsYearChange(year)} className="cursor-pointer">
                      {year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>


        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/10 p-0 overflow-hidden">
                <Avatar className="h-full w-full">
                  <AvatarImage src={`https://avatar.vercel.sh/${user.name}.png`} alt={user.name} />
                  <AvatarFallback className="bg-primary text-white">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-primary">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">{user.role} Access</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('main')} className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              {user.role === 'admin' && (
                <DropdownMenuItem onClick={() => onNavigate('settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
