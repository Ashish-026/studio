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
import { LogOut, Sprout, ChevronsUpDown, Factory, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';
import { useRouter } from 'next/navigation';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { selectedMill, mills, selectMill } = useMill();
  const { selectedKmsYear, selectKmsYear, availableKmsYears } = useKmsYear();
  const router = useRouter();

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
    router.refresh();
  };
  
  const handleKmsYearChange = (year: string) => {
    selectKmsYear(year);
    router.refresh();
  }

  const handleLogout = () => {
    logout();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold font-headline text-xl text-primary tracking-tight">Mandi Monitor</span>
        </Link>
        
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
              {user.role === 'admin' && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/settings" className="flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
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
