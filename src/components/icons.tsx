import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BrainIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChatCircleIcon,
  CheckIcon,
  ClockIcon,
  CoffeeIcon,
  CompassIcon,
  DatabaseIcon,
  DevicesIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  FlagIcon,
  HeartIcon,
  HouseIcon,
  ImageIcon as PhImageIcon,
  ListIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MaskHappyIcon,
  MoonIcon,
  NewspaperIcon,
  PaperPlaneRightIcon,
  PencilLineIcon,
  PencilSimpleIcon,
  PlusIcon,
  ProhibitIcon,
  RobotIcon,
  ShieldCheckIcon,
  SidebarIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SparkleIcon,
  SquareIcon,
  StarIcon,
  SunIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
  TrendUpIcon,
  UserIcon,
  UserMinusIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Sippa's icons (owner request 2026-11-07: Duolingo-style — chunky, rounded, filled).
 * Phosphor icons in the "fill" weight; arrows, carets, ticks and crosses use "bold" so
 * they stay crisp. Names match the old lucide-react ones, so pages just import from here.
 * Works in server and client components (Phosphor's SSR build has no context).
 */
type Props = Omit<IconProps, "weight"> & {
  /** Accepted for compatibility with the old icons; Phosphor sets its own weight. */
  strokeWidth?: number | string;
};

function icon(I: Icon, weight: IconWeight, name: string) {
  function SippaIcon({ strokeWidth: _ignored, size = 24, ...props }: Props) {
    return <I weight={weight} size={size} {...props} />;
  }
  SippaIcon.displayName = name;
  return SippaIcon;
}

const fill = (I: Icon, name: string) => icon(I, "fill", name);
const bold = (I: Icon, name: string) => icon(I, "bold", name);

// Glyph-like icons: bold lines.
export const ArrowDown = bold(ArrowDownIcon, "ArrowDown");
export const ArrowLeft = bold(ArrowLeftIcon, "ArrowLeft");
export const ArrowRight = bold(ArrowRightIcon, "ArrowRight");
export const ArrowUp = bold(ArrowUpIcon, "ArrowUp");
export const Check = bold(CheckIcon, "Check");
export const ChevronDown = bold(CaretDownIcon, "ChevronDown");
export const ChevronLeft = bold(CaretLeftIcon, "ChevronLeft");
export const ChevronRight = bold(CaretRightIcon, "ChevronRight");
export const Menu = bold(ListIcon, "Menu");
export const Plus = bold(PlusIcon, "Plus");
export const RotateCcw = bold(ArrowCounterClockwiseIcon, "RotateCcw");
export const TrendingUp = bold(TrendUpIcon, "TrendingUp");
export const X = bold(XIcon, "X");

// Object icons: filled.
export const Ban = fill(ProhibitIcon, "Ban");
export const Bot = fill(RobotIcon, "Bot");
export const Brain = fill(BrainIcon, "Brain");
export const Clock = fill(ClockIcon, "Clock");
export const Coffee = fill(CoffeeIcon, "Coffee");
export const Compass = fill(CompassIcon, "Compass");
export const Database = fill(DatabaseIcon, "Database");
export const Eye = fill(EyeIcon, "Eye");
export const EyeOff = fill(EyeSlashIcon, "EyeOff");
export const Flag = fill(FlagIcon, "Flag");
export const Flame = fill(FireIcon, "Flame");
export const Heart = fill(HeartIcon, "Heart");
export const Home = fill(HouseIcon, "Home");
export const ImageIcon = fill(PhImageIcon, "ImageIcon");
export const Lock = fill(LockIcon, "Lock");
export const LogOut = fill(SignOutIcon, "LogOut");
export const MapPin = fill(MapPinIcon, "MapPin");
export const MessageCircle = fill(ChatCircleIcon, "MessageCircle");
export const MonitorSmartphone = fill(DevicesIcon, "MonitorSmartphone");
export const Moon = fill(MoonIcon, "Moon");
export const Newspaper = fill(NewspaperIcon, "Newspaper");
export const PanelLeftClose = fill(SidebarSimpleIcon, "PanelLeftClose");
export const PanelLeftOpen = fill(SidebarIcon, "PanelLeftOpen");
export const PenLine = fill(PencilLineIcon, "PenLine");
export const Pencil = fill(PencilSimpleIcon, "Pencil");
export const Search = bold(MagnifyingGlassIcon, "Search");
export const SendHorizontal = fill(PaperPlaneRightIcon, "SendHorizontal");
export const ShieldCheck = fill(ShieldCheckIcon, "ShieldCheck");
export const Sparkles = fill(SparkleIcon, "Sparkles");
export const Square = fill(SquareIcon, "Square");
export const Star = fill(StarIcon, "Star");
export const Sun = fill(SunIcon, "Sun");
export const Theater = fill(MaskHappyIcon, "Theater");
export const ThumbsDown = fill(ThumbsDownIcon, "ThumbsDown");
export const ThumbsUp = fill(ThumbsUpIcon, "ThumbsUp");
export const Trash2 = fill(TrashIcon, "Trash2");
export const User = fill(UserIcon, "User");
export const UserX = fill(UserMinusIcon, "UserX");
