import { VehicleProvider } from '@/context/vehicle-context';

export default function VehicleLayout({ children }: { children: React.ReactNode }) {
  return <VehicleProvider>{children}</VehicleProvider>;
}
