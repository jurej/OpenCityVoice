import {
  Armchair,
  Bike,
  Bus,
  CircleAlert,
  Construction,
  Droplets,
  Lightbulb,
  MessageSquarePlus,
  ParkingCircle,
  PawPrint,
  Recycle,
  SignpostBig,
  Snowflake,
  Trash2,
  TreeDeciduous,
  TriangleAlert,
  Volume2,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Curated icon set available to municipality administrators. */
export const categoryIcons: Record<string, LucideIcon> = {
  "circle-alert": CircleAlert,
  construction: Construction,
  "triangle-alert": TriangleAlert,
  lightbulb: Lightbulb,
  armchair: Armchair,
  "trash-2": Trash2,
  recycle: Recycle,
  "message-square-plus": MessageSquarePlus,
  "tree-deciduous": TreeDeciduous,
  droplets: Droplets,
  snowflake: Snowflake,
  bike: Bike,
  bus: Bus,
  "parking-circle": ParkingCircle,
  "signpost-big": SignpostBig,
  "paw-print": PawPrint,
  "volume-2": Volume2,
  wrench: Wrench,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = categoryIcons[name] ?? CircleAlert;
  return <Icon className={className} aria-hidden="true" />;
}
