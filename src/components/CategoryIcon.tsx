import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Gift,
  MoreHorizontal,
  Briefcase,
  Award,
  Laptop,
  TrendingUp,
  PlusCircle,
  Wallet,
  CreditCard,
  Smartphone,
  PiggyBank,
  ShieldCheck,
  Plane,
  Zap,
  Coffee,
  Fuel,
  ShoppingCart,
  ArrowRightLeft,
  CircleHelp,
  Tag,
  DollarSign,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Gift,
  MoreHorizontal,
  Briefcase,
  Award,
  Laptop,
  TrendingUp,
  PlusCircle,
  Wallet,
  CreditCard,
  Smartphone,
  PiggyBank,
  ShieldCheck,
  Plane,
  Zap,
  Coffee,
  Fuel,
  ShoppingCart,
  ArrowRightLeft,
  Tag,
  DollarSign,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', style }) => {
  const IconComponent = ICON_MAP[name] || CircleHelp;
  return <IconComponent className={className} style={style} />;
};
