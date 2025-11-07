import { LabourProvider } from '@/context/labour-context';

export default function LabourLayout({ children }: { children: React.ReactNode }) {
  return <LabourProvider>{children}</LabourProvider>;
}
