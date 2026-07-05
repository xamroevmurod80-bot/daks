import { Car, Zap, Cpu, Shield, Wrench, type LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Car,
  Zap,
  Cpu,
  Shield,
  Wrench,
};

export function getIcon(key: string): LucideIcon {
  return ICON_MAP[key] ?? Car;
}
