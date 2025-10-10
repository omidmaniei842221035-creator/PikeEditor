import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Utensils, 
  Pill, 
  Store, 
  Coffee, 
  Sandwich,
  Shirt,
  Scissors,
  Heart,
  Smartphone,
  Car,
  DollarSign,
  Hotel,
  Dumbbell,
  GraduationCap,
  Wheat,
  Factory,
  Wrench,
  Palette,
  Leaf,
  Radio,
  Church,
  Users,
  MapPin,
  Anchor,
  Building,
  ShoppingBag,
  Stethoscope,
  Laptop,
  Key,
  Plane,
  Trophy,
  BookOpen,
  TreePine,
  Hammer,
  Home,
  Briefcase,
  Cpu,
  Fuel,
  CreditCard,
  Bed,
  Activity,
  School,
  Tractor,
  Settings,
  Gift,
  Music,
  Mountain,
  Anchor as Ship
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  businessTypes: Record<string, number>;
  totalCustomers: number;
}

export function BusinessCategories() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview"],
  });

  const businessTypeIcons: Record<string, any> = {
    // خوراکی و غذایی
    "سوپرمارکت": ShoppingCart,
    "فروشگاه عمومی": Store,
    "مینی‌مارکت": ShoppingBag,
    "فروشگاه زنجیره‌ای": Building,
    "هایپرمارکت": ShoppingCart,
    "رستوران": Utensils,
    "کافه": Coffee,
    "فست‌فود": Utensils,
    "نانوایی": Sandwich,
    "قنادی": Coffee,
    "شیرینی‌پزی": Coffee,
    "کباب‌سرا": Utensils,
    "چلوکباب": Utensils,
    "سالن پذیرایی": Users,
    "کافه‌رستوران": Coffee,
    "بوفه": Utensils,
    "کانتین": Utensils,
    "آشپزخانه صنعتی": Factory,
    "آبمیوه‌فروشی": Coffee,
    "بستنی‌فروشی": Coffee,
    "قهوه‌خانه": Coffee,
    "چای‌خانه": Coffee,
    "ساندویچی": Sandwich,
    "پیتزا فروشی": Utensils,
    "مغازه میوه": Store,
    "سبزی‌فروشی": Leaf,
    "گوشت‌فروشی": Store,
    "مرغ‌فروشی": Store,
    "ماهی‌فروشی": Ship,
    "لبنیات": Store,
    "عسل فروشی": Store,
    "ادویه فروشی": Store,
    "خشکبار": Store,
    "چای و قهوه": Coffee,
    "نوشیدنی": Coffee,
    "بستنی ساز": Factory,
    
    // پوشاک و مد
    "پوشاک": Shirt,
    "بوتیک": Shirt,
    "پوشاک مردانه": Shirt,
    "پوشاک زنانه": Shirt,
    "پوشاک بچگانه": Shirt,
    "کیف و کفش": ShoppingBag,
    "کفش‌فروشی": Shirt,
    "کیف فروشی": ShoppingBag,
    "چرم فروشی": Shirt,
    "پارچه فروشی": Shirt,
    "خیاطی": Scissors,
    "طراحی مد": Palette,
    "لباس عروس": Heart,
    "کراوات و پیراهن": Shirt,
    "لباس ورزشی": Trophy,
    "زیرپوش": Shirt,
    "جوراب": Shirt,
    "کلاه": Shirt,
    "عینک آفتابی": Shirt,
    "ساعت": Shirt,
    "جواهرات": Shirt,
    "طلا و جواهر": Shirt,
    "نقره فروشی": Shirt,
    "سکه و طلا": DollarSign,
    
    // زیبایی و سلامت
    "آرایشگاه": Scissors,
    "سالن زیبایی": Heart,
    "لوازم آرایشی": Heart,
    "آرایشگاه مردانه": Scissors,
    "آرایشگاه زنانه": Heart,
    "پیرایش مردانه": Scissors,
    "مانیکور پدیکور": Heart,
    "ماساژ درمانی": Heart,
    "سولاریوم": Heart,
    "لیزر موهای زائد": Heart,
    "داروخانه": Pill,
    "عطاری": Pill,
    "طب سنتی": Stethoscope,
    "مطب": Stethoscope,
    "دندانپزشکی": Stethoscope,
    "چشم‌پزشکی": Stethoscope,
    "آزمایشگاه": Stethoscope,
    "رادیولوژی": Stethoscope,
    "فیزیوتراپی": Activity,
    "کلینیک": Stethoscope,
    "درمانگاه": Stethoscope,
    "طب طبیعی": Leaf,
    "داروخانه آنلاین": Pill,
    "عطر و ادکلن": Heart,
    "محصولات بهداشتی": Heart,
    "لوازم پزشکی": Stethoscope,
    "اپتیک": Stethoscope,
    "سمعک": Stethoscope,
    "ارتوپدی": Stethoscope,
    
    // فناوری و الکترونیک
    "موبایل‌فروشی": Smartphone,
    "کامپیوتر": Laptop,
    "لپ‌تاپ": Laptop,
    "لوازم الکترونیکی": Smartphone,
    "لوازم خانگی": Home,
    "تلویزیون": Smartphone,
    "سیستم صوتی": Music,
    "دوربین": Smartphone,
    "گوشی همراه": Smartphone,
    "تبلت": Laptop,
    "کنسول بازی": Laptop,
    "بازی کامپیوتری": Laptop,
    "کافه‌نت": Laptop,
    "تعمیر کامپیوتر": Wrench,
    "تعمیر موبایل": Wrench,
    "شارژر و کابل": Smartphone,
    "هدفون": Music,
    "اسپیکر": Music,
    "ساعت هوشمند": Smartphone,
    "لوازم جانبی": Smartphone,
    "پرینتر": Laptop,
    "اسکنر": Laptop,
    "سرور": Cpu,
    "شبکه": Settings,
    "امنیت الکترونیک": Settings,
    
    // خودرو و حمل‌ونقل
    "تعمیرگاه خودرو": Car,
    "نمایشگاه خودرو": Car,
    "خودروی کارکرده": Car,
    "پمپ بنزین": Fuel,
    "لوازم یدکی": Wrench,
    "تایر فروشی": Car,
    "باتری خودرو": Car,
    "روغن موتور": Car,
    "کارواش": Car,
    "صافکاری": Hammer,
    "نقاشی خودرو": Palette,
    "تعمیرات موتورسیکلت": Car,
    "فروش موتور": Car,
    "دوچرخه": Car,
    "لوازم دوچرخه": Car,
    "اتوگاز": Fuel,
    "خدمات رانندگی": Car,
    "تاکسی تلفنی": Car,
    "اتوبوس": Car,
    "کامیون": Car,
    "ماشین‌آلات راهسازی": Tractor,
    
    // خدمات مالی
    "بانک": DollarSign,
    "صرافی": DollarSign,
    "بیمه": DollarSign,
    "صندوق قرض‌الحسنه": DollarSign,
    "لیزینگ": DollarSign,
    "حسابداری": Briefcase,
    "مالیاتی": Briefcase,
    "مشاوره سرمایه‌گذاری": DollarSign,
    "املاک": Key,
    "مشاورین املاک": Key,
    "رهن و اجاره": Key,
    "خرید و فروش": Store,
    "ارزیابی املاک": Key,
    "مسکن مهر": Building,
    "پروژه ساختمانی": Building,
    "پیمانکاری": Hammer,
    "معماری": Building,
    
    // اقامت و گردشگری
    "هتل": Hotel,
    "مهمان‌خانه": Bed,
    "هتل آپارتمان": Building,
    "اقامتگاه بوم‌گردی": Mountain,
    "ویلا": Home,
    "کمپ": Mountain,
    "آژانس مسافرتی": Plane,
    "تور مسافرتی": MapPin,
    "بلیت هواپیما": Plane,
    "رزرواسیون": Hotel,
    "راهنمای تور": MapPin,
    "اجاره ماشین": Car,
    "تاکسی گردشگری": Car,
    "راهنمای گردشگری": MapPin,
    "کشتی تفریحی": Ship,
    
    // ورزش و تفریح
    "باشگاه ورزشی": Dumbbell,
    "زورخانه": Trophy,
    "استخر": Activity,
    "زمین فوتبال": Trophy,
    "سالن بدمینتون": Trophy,
    "تنیس": Trophy,
    "کوهنوردی": Mountain,
    "ورزش‌های آبی": Ship,
    "لوازم ورزشی": Dumbbell,
    "بازی‌های کامپیوتری": Laptop,
    "تفریحگاه": Users,
    "پارک آبی": Activity,
    "شهربازی": Users,
    "سالن بولینگ": Trophy,
    "بیلیارد": Trophy,
    "اسکیت": Trophy,
    "دوچرخه‌سواری": Car,
    
    // آموزش و فرهنگ
    "کتابفروشی": BookOpen,
    "لوازم التحریر": BookOpen,
    "آموزشگاه": GraduationCap,
    "مدرسه خصوصی": School,
    "کلاس خصوصی": GraduationCap,
    "آموزش زبان": GraduationCap,
    "کامپیوتر آموز": Laptop,
    "آموزش موسیقی": Music,
    "آموزش رانندگی": Car,
    "مهد کودک": Users,
    "کتابخانه": BookOpen,
    "نشریات": BookOpen,
    "مطبوعات": Radio,
    "تایپ و تکثیر": Laptop,
    "طراحی گرافیک": Palette,
    "چاپخانه": Factory,
    "عکاسی": Smartphone,
    "فیلم‌برداری": Smartphone,
    "استودیو": Music,
    "گالری هنری": Palette,
    "صنایع دستی": Palette,
    "آنتیک": Store,
    
    // کشاورزی و دامپروری
    "کشاورزی": Wheat,
    "باغداری": TreePine,
    "گلخانه": Leaf,
    "فروش بذر": Wheat,
    "کود کشاورزی": Wheat,
    "ماشین‌آلات کشاورزی": Tractor,
    "دامپروری": Wheat,
    "مرغداری": Wheat,
    "زنبورداری": Wheat,
    "پرورش ماهی": Ship,
    "قارچ پروری": Leaf,
    "گل و گیاه": Leaf,
    "گل‌فروشی": Leaf,
    "باغبانی": TreePine,
    "محصولات ارگانیک": Leaf,
    "کنسرو و غذاهای آماده": Factory,
    
    // صنعت و تولید
    "کارخانه": Factory,
    "صنایع غذایی": Factory,
    "صنایع نساجی": Factory,
    "فلزکاری": Hammer,
    "جوشکاری": Hammer,
    "نجاری": Hammer,
    "کابینت‌سازی": Hammer,
    "صنایع چوب": TreePine,
    "پلاستیک‌سازی": Factory,
    "شیشه‌سازی": Factory,
    "سرامیک": Factory,
    "موزاییک": Palette,
    "رنگ‌سازی": Palette,
    "محصولات شیمیایی": Factory,
    "دارو‌سازی": Pill,
    "کارگاه مونتاژ": Factory,
    "تعمیرگاه صنعتی": Wrench,
    
    // خدمات عمومی و شهری
    "اسباب‌بازی": Gift,
    "هدایا و سوغات": Gift,
    "پارتی و جشن": Users,
    "تولد و مراسم": Users,
    "عکس‌فوری": Smartphone,
    "خدمات نظافت": Home,
    "خدمات باغبانی": TreePine,
    "نگهبانی": Settings,
    "حمل و نقل": Car,
    "بسته‌بندی": Factory,
    "بار": Car,
    "انبار": Building,
    "حمل اثاثیه": Car,
    "آسانسور": Settings,
    "تاسیسات": Wrench,
    "برق‌کاری": Settings,
    "آب و فاضلاب": Settings,
    "گاز": Fuel,
    "بازیافت": Leaf,
    "مواد بازیافتی": Leaf,
    "ضایعات": Leaf,
    "زباله": Home,
    "محیط زیست": Leaf,
    
    // خدمات مذهبی و فرهنگی
    "مسجد": Church,
    "حسینیه": Church,
    "تکیه": Church,
    "مدرسه علمیه": School,
    "کتاب‌خانه مذهبی": BookOpen,
    "فرهنگسرا": Users,
    "خانه فرهنگ": Users,
    "عزاداری": Church,
    "روضه‌خوانی": Church,
    "مداحی": Music,
    "قرآن‌خوانی": BookOpen,
    "حافظ قرآن": BookOpen,
    "کلاس تجوید": GraduationCap,
    "کلاس فقه": GraduationCap,
    "نوحه‌سرایی": Music,
    "شعر محلی": BookOpen,
    "موسیقی سنتی": Music,
    "موسیقی مذهبی": Music,
    
    // Default icons for categories
    "فروشگاه": Store,
    "سایر": Store,
  };

  const businessTypeGradients: Record<string, { gradient: string; shadow: string; glow: string }> = {
    // خوراکی و غذایی
    "سوپرمارکت": { 
      gradient: "from-blue-600 via-sky-500 to-cyan-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "فروشگاه عمومی": { 
      gradient: "from-indigo-600 via-purple-500 to-blue-500", 
      shadow: "shadow-indigo-500/25",
      glow: "group-hover:shadow-indigo-500/40"
    },
    "مینی‌مارکت": { 
      gradient: "from-cyan-500 via-blue-500 to-indigo-500", 
      shadow: "shadow-cyan-500/25",
      glow: "group-hover:shadow-cyan-500/40"
    },
    "فروشگاه زنجیره‌ای": { 
      gradient: "from-slate-600 via-gray-600 to-blue-600", 
      shadow: "shadow-slate-500/25",
      glow: "group-hover:shadow-slate-500/40"
    },
    "هایپرمارکت": { 
      gradient: "from-blue-700 via-sky-600 to-cyan-600", 
      shadow: "shadow-blue-600/25",
      glow: "group-hover:shadow-blue-600/40"
    },
    "رستوران": { 
      gradient: "from-orange-500 via-red-500 to-pink-500", 
      shadow: "shadow-orange-500/25",
      glow: "group-hover:shadow-orange-500/40"
    },
    "کافه": { 
      gradient: "from-amber-500 via-yellow-500 to-orange-500", 
      shadow: "shadow-amber-500/25",
      glow: "group-hover:shadow-amber-500/40"
    },
    "فست‌فود": { 
      gradient: "from-red-500 via-orange-500 to-yellow-500", 
      shadow: "shadow-red-500/25",
      glow: "group-hover:shadow-red-500/40"
    },
    "نانوایی": { 
      gradient: "from-pink-500 via-rose-500 to-red-400", 
      shadow: "shadow-pink-500/25",
      glow: "group-hover:shadow-pink-500/40"
    },
    "قنادی": { 
      gradient: "from-pink-400 via-purple-400 to-indigo-400", 
      shadow: "shadow-pink-400/25",
      glow: "group-hover:shadow-pink-400/40"
    },
    "شیرینی‌پزی": { 
      gradient: "from-pink-300 via-purple-300 to-violet-300", 
      shadow: "shadow-pink-300/25",
      glow: "group-hover:shadow-pink-300/40"
    },
    "کباب‌سرا": { 
      gradient: "from-orange-600 via-red-600 to-pink-600", 
      shadow: "shadow-orange-600/25",
      glow: "group-hover:shadow-orange-600/40"
    },
    "چلوکباب": { 
      gradient: "from-yellow-600 via-orange-600 to-red-600", 
      shadow: "shadow-yellow-600/25",
      glow: "group-hover:shadow-yellow-600/40"
    },
    "سالن پذیرایی": { 
      gradient: "from-violet-500 via-purple-500 to-indigo-500", 
      shadow: "shadow-violet-500/25",
      glow: "group-hover:shadow-violet-500/40"
    },
    "کافه‌رستوران": { 
      gradient: "from-amber-600 via-orange-600 to-red-500", 
      shadow: "shadow-amber-600/25",
      glow: "group-hover:shadow-amber-600/40"
    },
    "بوفه": { 
      gradient: "from-green-500 via-teal-500 to-blue-500", 
      shadow: "shadow-green-500/25",
      glow: "group-hover:shadow-green-500/40"
    },
    "کانتین": { 
      gradient: "from-gray-500 via-slate-500 to-zinc-500", 
      shadow: "shadow-gray-500/25",
      glow: "group-hover:shadow-gray-500/40"
    },
    "آشپزخانه صنعتی": { 
      gradient: "from-steel-600 via-gray-600 to-slate-600", 
      shadow: "shadow-steel-500/25",
      glow: "group-hover:shadow-steel-500/40"
    },
    "آبمیوه‌فروشی": { 
      gradient: "from-orange-400 via-yellow-400 to-lime-400", 
      shadow: "shadow-orange-400/25",
      glow: "group-hover:shadow-orange-400/40"
    },
    "بستنی‌فروشی": { 
      gradient: "from-blue-300 via-cyan-300 to-teal-300", 
      shadow: "shadow-blue-300/25",
      glow: "group-hover:shadow-blue-300/40"
    },
    "قهوه‌خانه": { 
      gradient: "from-amber-700 via-orange-700 to-red-700", 
      shadow: "shadow-amber-700/25",
      glow: "group-hover:shadow-amber-700/40"
    },
    "چای‌خانه": { 
      gradient: "from-green-600 via-teal-600 to-emerald-600", 
      shadow: "shadow-green-600/25",
      glow: "group-hover:shadow-green-600/40"
    },
    
    // پوشاک و مد
    "پوشاک": { 
      gradient: "from-purple-600 via-violet-500 to-indigo-500", 
      shadow: "shadow-purple-500/25",
      glow: "group-hover:shadow-purple-500/40"
    },
    "بوتیک": { 
      gradient: "from-violet-500 via-purple-500 to-pink-500", 
      shadow: "shadow-violet-500/25",
      glow: "group-hover:shadow-violet-500/40"
    },
    "پوشاک مردانه": { 
      gradient: "from-slate-600 via-gray-600 to-zinc-600", 
      shadow: "shadow-slate-500/25",
      glow: "group-hover:shadow-slate-500/40"
    },
    "پوشاک زنانه": { 
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500", 
      shadow: "shadow-rose-500/25",
      glow: "group-hover:shadow-rose-500/40"
    },
    "پوشاک بچگانه": { 
      gradient: "from-sky-400 via-blue-400 to-indigo-400", 
      shadow: "shadow-sky-400/25",
      glow: "group-hover:shadow-sky-400/40"
    },
    "کیف و کفش": { 
      gradient: "from-amber-600 via-orange-600 to-red-600", 
      shadow: "shadow-amber-600/25",
      glow: "group-hover:shadow-amber-600/40"
    },
    "کفش‌فروشی": { 
      gradient: "from-stone-600 via-amber-600 to-yellow-600", 
      shadow: "shadow-stone-600/25",
      glow: "group-hover:shadow-stone-600/40"
    },
    "جواهرات": { 
      gradient: "from-yellow-400 via-amber-400 to-orange-400", 
      shadow: "shadow-yellow-400/25",
      glow: "group-hover:shadow-yellow-400/40"
    },
    "طلا و جواهر": { 
      gradient: "from-yellow-500 via-amber-500 to-orange-500", 
      shadow: "shadow-yellow-500/25",
      glow: "group-hover:shadow-yellow-500/40"
    },
    
    // زیبایی و سلامت
    "آرایشگاه": { 
      gradient: "from-pink-500 via-rose-400 to-red-400", 
      shadow: "shadow-pink-500/25",
      glow: "group-hover:shadow-pink-500/40"
    },
    "سالن زیبایی": { 
      gradient: "from-fuchsia-500 via-purple-500 to-violet-500", 
      shadow: "shadow-fuchsia-500/25",
      glow: "group-hover:shadow-fuchsia-500/40"
    },
    "لوازم آرایشی": { 
      gradient: "from-pink-400 via-rose-400 to-red-400", 
      shadow: "shadow-pink-400/25",
      glow: "group-hover:shadow-pink-400/40"
    },
    "داروخانه": { 
      gradient: "from-emerald-500 via-teal-500 to-green-600", 
      shadow: "shadow-emerald-500/25",
      glow: "group-hover:shadow-emerald-500/40"
    },
    "عطاری": { 
      gradient: "from-green-600 via-emerald-600 to-teal-600", 
      shadow: "shadow-green-600/25",
      glow: "group-hover:shadow-green-600/40"
    },
    "طب سنتی": { 
      gradient: "from-emerald-600 via-green-600 to-lime-600", 
      shadow: "shadow-emerald-600/25",
      glow: "group-hover:shadow-emerald-600/40"
    },
    "مطب": { 
      gradient: "from-green-500 via-emerald-500 to-teal-500", 
      shadow: "shadow-green-500/25",
      glow: "group-hover:shadow-green-500/40"
    },
    "دندانپزشکی": { 
      gradient: "from-blue-500 via-cyan-500 to-teal-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "کلینیک": { 
      gradient: "from-teal-500 via-cyan-500 to-blue-500", 
      shadow: "shadow-teal-500/25",
      glow: "group-hover:shadow-teal-500/40"
    },
    
    // فناوری و الکترونیک
    "موبایل‌فروشی": { 
      gradient: "from-blue-500 via-indigo-500 to-purple-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "کامپیوتر": { 
      gradient: "from-indigo-500 via-blue-500 to-cyan-500", 
      shadow: "shadow-indigo-500/25",
      glow: "group-hover:shadow-indigo-500/40"
    },
    "لپ‌تاپ": { 
      gradient: "from-slate-500 via-gray-500 to-blue-500", 
      shadow: "shadow-slate-500/25",
      glow: "group-hover:shadow-slate-500/40"
    },
    "لوازم الکترونیکی": { 
      gradient: "from-cyan-500 via-teal-500 to-blue-500", 
      shadow: "shadow-cyan-500/25",
      glow: "group-hover:shadow-cyan-500/40"
    },
    "لوازم خانگی": { 
      gradient: "from-orange-500 via-amber-500 to-yellow-500", 
      shadow: "shadow-orange-500/25",
      glow: "group-hover:shadow-orange-500/40"
    },
    "کافه‌نت": { 
      gradient: "from-slate-500 via-gray-500 to-zinc-500", 
      shadow: "shadow-slate-500/25",
      glow: "group-hover:shadow-slate-500/40"
    },
    
    // خودرو و حمل‌ونقل
    "تعمیرگاه خودرو": { 
      gradient: "from-gray-600 via-slate-600 to-zinc-600", 
      shadow: "shadow-gray-500/25",
      glow: "group-hover:shadow-gray-500/40"
    },
    "نمایشگاه خودرو": { 
      gradient: "from-blue-600 via-slate-600 to-gray-600", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "پمپ بنزین": { 
      gradient: "from-red-600 via-orange-600 to-yellow-600", 
      shadow: "shadow-red-500/25",
      glow: "group-hover:shadow-red-500/40"
    },
    "لوازم یدکی": { 
      gradient: "from-zinc-600 via-gray-600 to-slate-600", 
      shadow: "shadow-zinc-500/25",
      glow: "group-hover:shadow-zinc-500/40"
    },
    "کارواش": { 
      gradient: "from-blue-400 via-cyan-400 to-teal-400", 
      shadow: "shadow-blue-400/25",
      glow: "group-hover:shadow-blue-400/40"
    },
    
    // خدمات مالی
    "بانک": { 
      gradient: "from-green-600 via-emerald-600 to-teal-600", 
      shadow: "shadow-green-500/25",
      glow: "group-hover:shadow-green-500/40"
    },
    "صرافی": { 
      gradient: "from-yellow-500 via-amber-500 to-orange-500", 
      shadow: "shadow-yellow-500/25",
      glow: "group-hover:shadow-yellow-500/40"
    },
    "بیمه": { 
      gradient: "from-blue-600 via-indigo-600 to-purple-600", 
      shadow: "shadow-blue-600/25",
      glow: "group-hover:shadow-blue-600/40"
    },
    "حسابداری": { 
      gradient: "from-emerald-600 via-green-600 to-teal-600", 
      shadow: "shadow-emerald-600/25",
      glow: "group-hover:shadow-emerald-600/40"
    },
    "املاک": { 
      gradient: "from-stone-500 via-amber-600 to-yellow-600", 
      shadow: "shadow-stone-500/25",
      glow: "group-hover:shadow-stone-500/40"
    },
    
    // اقامت و گردشگری
    "هتل": { 
      gradient: "from-indigo-600 via-purple-600 to-violet-600", 
      shadow: "shadow-indigo-600/25",
      glow: "group-hover:shadow-indigo-600/40"
    },
    "مهمان‌خانه": { 
      gradient: "from-blue-500 via-indigo-500 to-purple-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "آژانس مسافرتی": { 
      gradient: "from-sky-500 via-blue-500 to-indigo-500", 
      shadow: "shadow-sky-500/25",
      glow: "group-hover:shadow-sky-500/40"
    },
    
    // ورزش و تفریح
    "باشگاه ورزشی": { 
      gradient: "from-red-500 via-orange-500 to-amber-500", 
      shadow: "shadow-red-500/25",
      glow: "group-hover:shadow-red-500/40"
    },
    "زورخانه": { 
      gradient: "from-orange-600 via-red-600 to-pink-600", 
      shadow: "shadow-orange-600/25",
      glow: "group-hover:shadow-orange-600/40"
    },
    "لوازم ورزشی": { 
      gradient: "from-orange-500 via-red-500 to-pink-500", 
      shadow: "shadow-orange-500/25",
      glow: "group-hover:shadow-orange-500/40"
    },
    
    // آموزش و فرهنگ
    "کتابفروشی": { 
      gradient: "from-indigo-500 via-purple-500 to-violet-500", 
      shadow: "shadow-indigo-500/25",
      glow: "group-hover:shadow-indigo-500/40"
    },
    "آموزشگاه": { 
      gradient: "from-blue-500 via-indigo-500 to-purple-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "مدرسه خصوصی": { 
      gradient: "from-cyan-500 via-blue-500 to-indigo-500", 
      shadow: "shadow-cyan-500/25",
      glow: "group-hover:shadow-cyan-500/40"
    },
    
    // کشاورزی و دامپروری
    "کشاورزی": { 
      gradient: "from-green-500 via-lime-500 to-yellow-500", 
      shadow: "shadow-green-500/25",
      glow: "group-hover:shadow-green-500/40"
    },
    "باغداری": { 
      gradient: "from-green-600 via-emerald-600 to-teal-600", 
      shadow: "shadow-green-600/25",
      glow: "group-hover:shadow-green-600/40"
    },
    "گلخانه": { 
      gradient: "from-emerald-500 via-green-500 to-lime-500", 
      shadow: "shadow-emerald-500/25",
      glow: "group-hover:shadow-emerald-500/40"
    },
    "دامپروری": { 
      gradient: "from-amber-600 via-yellow-600 to-lime-600", 
      shadow: "shadow-amber-600/25",
      glow: "group-hover:shadow-amber-600/40"
    },
    "گل‌فروشی": { 
      gradient: "from-pink-400 via-rose-400 to-red-400", 
      shadow: "shadow-pink-400/25",
      glow: "group-hover:shadow-pink-400/40"
    },
    
    // صنعت و تولید
    "کارخانه": { 
      gradient: "from-gray-600 via-slate-600 to-zinc-600", 
      shadow: "shadow-gray-600/25",
      glow: "group-hover:shadow-gray-600/40"
    },
    "صنایع غذایی": { 
      gradient: "from-orange-600 via-amber-600 to-yellow-600", 
      shadow: "shadow-orange-600/25",
      glow: "group-hover:shadow-orange-600/40"
    },
    "فلزکاری": { 
      gradient: "from-slate-600 via-gray-600 to-zinc-600", 
      shadow: "shadow-slate-600/25",
      glow: "group-hover:shadow-slate-600/40"
    },
    "جوشکاری": { 
      gradient: "from-orange-700 via-red-700 to-pink-700", 
      shadow: "shadow-orange-700/25",
      glow: "group-hover:shadow-orange-700/40"
    },
    "نجاری": { 
      gradient: "from-amber-700 via-orange-700 to-red-700", 
      shadow: "shadow-amber-700/25",
      glow: "group-hover:shadow-amber-700/40"
    },
    
    // Default
    "فروشگاه": { 
      gradient: "from-purple-600 via-violet-500 to-indigo-500", 
      shadow: "shadow-purple-500/25",
      glow: "group-hover:shadow-purple-500/40"
    },
    "سایر": { 
      gradient: "from-gray-500 to-gray-600", 
      shadow: "shadow-gray-500/25",
      glow: "group-hover:shadow-gray-500/40"
    },
  };

  const businessTypes = Object.entries(analytics?.businessTypes || {})
    .slice(0, 6) // Show top 6 business types
    .map(([type, count]) => ({
      name: type,
      count: typeof count === 'number' ? count : 0,
      icon: businessTypeIcons[type] || Store,
      gradient: businessTypeGradients[type] || { 
        gradient: "from-gray-500 to-gray-600", 
        shadow: "shadow-gray-500/25",
        glow: "group-hover:shadow-gray-500/40"
      },
      percentage: analytics?.totalCustomers 
        ? Math.round(((typeof count === 'number' ? count : 0) / analytics.totalCustomers) * 100)
        : 0,
    }));

  return (
    <div className="mb-8">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center">
          <Store className="w-2.5 h-2.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">داشبورد اصناف تجاری</h3>
          <p className="text-[10px] text-muted-foreground">آمار کسب و کارهای فعال</p>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
        {businessTypes.map((type, index) => {
          const IconComponent = type.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group"
            >
              <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${type.gradient.gradient} ${type.gradient.shadow} shadow-md hover:shadow-lg ${type.gradient.glow} transition-all duration-300 hover:scale-102 cursor-pointer`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full blur-lg" />
                <CardContent className="relative p-1.5 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="bg-white/20 backdrop-blur-sm rounded p-0.5 group-hover:bg-white/30 transition-all duration-300">
                      <IconComponent className="w-2.5 h-2.5 text-white drop-shadow-sm" />
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-white text-[10px] drop-shadow-sm leading-tight">{type.name}</h4>
                      <p className="text-white/70 text-[8px]">اصناف فعال</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-1">
                    <div>
                      <p 
                        className="text-sm font-bold text-white drop-shadow-sm" 
                        data-testid={`business-type-${index}-count`}
                      >
                        {type.count}
                      </p>
                      <p className="text-white/70 text-[8px]">کسب و کار</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white drop-shadow-sm">{type.percentage}%</span>
                      <p className="text-white/70 text-[8px]">سهم بازار</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
                      <motion.div 
                        className="h-full bg-white/50 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${type.percentage}%` }}
                        transition={{ delay: index * 0.2 + 0.8, duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-[7px] text-white/60 mt-0.5">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
