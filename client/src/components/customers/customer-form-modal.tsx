import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";

type CustomerFormData = z.infer<typeof insertCustomerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerFormModal({ open, onOpenChange }: CustomerFormModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      shopName: "",
      ownerName: "",
      phone: "",
      businessType: "",
      address: "",
      monthlyProfit: 0,
      status: "active",
      branchId: "",
      supportEmployeeId: "",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        ...data,
        latitude: selectedLocation?.lat?.toString(),
        longitude: selectedLocation?.lng?.toString(),
      };
      return apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "موفقیت",
        description: "مشتری جدید با موفقیت اضافه شد",
      });
      onOpenChange(false);
      form.reset();
      setSelectedLocation(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در افزودن مشتری",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const businessTypes = [
    // خوراکی و غذایی
    "سوپرمارکت", "فروشگاه عمومی", "مینی‌مارکت", "فروشگاه زنجیره‌ای", "هایپرمارکت",
    "رستوران", "کافه", "فست‌فود", "نانوایی", "قنادی", "شیرینی‌پزی", "کباب‌سرا", 
    "چلوکباب", "سالن پذیرایی", "کافه‌رستوران", "بوفه", "کانتین", "آشپزخانه صنعتی",
    "آبمیوه‌فروشی", "بستنی‌فروشی", "قهوه‌خانه", "چای‌خانه", "ساندویچی", "پیتزا فروشی",
    "مغازه میوه", "سبزی‌فروشی", "گوشت‌فروشی", "مرغ‌فروشی", "ماهی‌فروشی", "لبنیات",
    "عسل فروشی", "ادویه فروشی", "خشکبار", "چای و قهوه", "نوشیدنی", "بستنی ساز",
    
    // پوشاک و مد
    "پوشاک", "بوتیک", "پوشاک مردانه", "پوشاک زنانه", "پوشاک بچگانه", "کیف و کفش", 
    "کفش‌فروشی", "کیف فروشی", "چرم فروشی", "پارچه فروشی", "خیاطی", "طراحی مد",
    "لباس عروس", "کراوات و پیراهن", "لباس ورزشی", "زیرپوش", "جوراب", "کلاه",
    "عینک آفتابی", "ساعت", "جواهرات", "طلا و جواهر", "نقره فروشی", "سکه و طلا",
    
    // زیبایی و سلامت
    "آرایشگاه", "سالن زیبایی", "لوازم آرایشی", "آرایشگاه مردانه", "آرایشگاه زنانه", 
    "پیرایش مردانه", "مانیکور پدیکور", "ماساژ درمانی", "سولاریوم", "لیزر موهای زائد",
    "داروخانه", "عطاری", "طب سنتی", "مطب", "دندانپزشکی", "چشم‌پزشکی", "آزمایشگاه",
    "رادیولوژی", "فیزیوتراپی", "کلینیک", "درمانگاه", "طب طبیعی", "داروخانه آنلاین",
    "عطر و ادکلن", "محصولات بهداشتی", "لوازم پزشکی", "اپتیک", "سمعک", "ارتوپدی",
    
    // فناوری و الکترونیک
    "موبایل‌فروشی", "کامپیوتر", "لپ‌تاپ", "لوازم الکترونیکی", "لوازم خانگی", "تلویزیون",
    "سیستم صوتی", "دوربین", "گوشی همراه", "تبلت", "کنسول بازی", "بازی کامپیوتری",
    "کافه‌نت", "تعمیر کامپیوتر", "تعمیر موبایل", "شارژر و کابل", "هدفون", "اسپیکر",
    "ساعت هوشمند", "لوازم جانبی", "پرینتر", "اسکنر", "سرور", "شبکه", "امنیت الکترونیک",
    
    // خودرو و حمل‌ونقل
    "تعمیرگاه خودرو", "نمایشگاه خودرو", "خودروی کارکرده", "پمپ بنزین", "لوازم یدکی",
    "تایر فروشی", "باتری خودرو", "روغن موتور", "کارواش", "صافکاری", "نقاشی خودرو",
    "تعمیرات موتورسیکلت", "فروش موتور", "دوچرخه", "لوازم دوچرخه", "اتوگاز",
    "خدمات رانندگی", "تاکسی تلفنی", "اتوبوس", "کامیون", "ماشین‌آلات راهسازی",
    
    // خدمات مالی
    "بانک", "صرافی", "بیمه", "صندوق قرض‌الحسنه", "لیزینگ", "حسابداری", "مالیاتی",
    "مشاوره سرمایه‌گذاری", "املاک", "مشاورین املاک", "رهن و اجاره", "خرید و فروش",
    "ارزیابی املاک", "مسکن مهر", "پروژه ساختمانی", "پیمانکاری", "معماری",
    
    // اقامت و گردشگری  
    "هتل", "مهمان‌خانه", "هتل آپارتمان", "اقامتگاه بوم‌گردی", "ویلا", "کمپ",
    "آژانس مسافرتی", "تور مسافرتی", "بلیت هواپیما", "رزرواسیون", "راهنمای تور",
    "اجاره ماشین", "تاکسی گردشگری", "راهنمای گردشگری", "کشتی تفریحی",
    
    // ورزش و تفریح
    "باشگاه ورزشی", "زورخانه", "استخر", "زمین فوتبال", "سالن بدمینتون", "تنیس",
    "کوهنوردی", "ورزش‌های آبی", "لوازم ورزشی", "بازی‌های کامپیوتری", "تفریحگاه",
    "پارک آبی", "شهربازی", "سالن بولینگ", "بیلیارد", "اسکیت", "دوچرخه‌سواری",
    
    // آموزش و فرهنگ
    "کتابفروشی", "لوازم التحریر", "آموزشگاه", "مدرسه خصوصی", "کلاس خصوصی", 
    "آموزش زبان", "کامپیوتر آموز", "آموزش موسیقی", "آموزش رانندگی", "مهد کودک",
    "کتابخانه", "نشریات", "مطبوعات", "تایپ و تکثیر", "طراحی گرافیک", "چاپخانه",
    "عکاسی", "فیلم‌برداری", "استودیو", "گالری هنری", "صنایع دستی", "آنتیک",
    
    // کشاورزی و دامپروری
    "کشاورزی", "باغداری", "گلخانه", "فروش بذر", "کود کشاورزی", "ماشین‌آلات کشاورزی",
    "دامپروری", "مرغداری", "زنبورداری", "پرورش ماهی", "قارچ پروری", "گل و گیاه",
    "گل‌فروشی", "باغبانی", "محصولات ارگانیک", "کنسرو و غذاهای آماده",
    
    // صنعت و تولید
    "کارخانه", "صنایع غذایی", "صنایع نساجی", "فلزکاری", "جوشکاری", "نجاری",
    "کابینت‌سازی", "صنایع چوب", "پلاستیک‌سازی", "شیشه‌سازی", "سرامیک", "موزاییک",
    "رنگ‌سازی", "محصولات شیمیایی", "دارو‌سازی", "کارگاه مونتاژ", "تعمیرگاه صنعتی",
    
    // خدمات عمومی و شهری
    "اسباب‌بازی", "هدایا و سوغات", "پارتی و جشن", "تولد و مراسم", "عکس‌فوری", 
    "خدمات نظافت", "خدمات باغبانی", "نگهبانی", "حمل و نقل", "بسته‌بندی", "بار",
    "انبار", "حمل اثاثیه", "آسانسور", "تاسیسات", "برق‌کاری", "آب و فاضلاب",
    "گاز", "بازیافت", "مواد بازیافتی", "ضایعات", "زباله", "محیط زیست",

    // صنایع غذایی تخصصی
    "قهوه‌سرای سنتی", "آش‌پزی خانگی", "کله‌پاچه", "جیگرکی", "دل‌ و روده", "کوکو فروشی",
    "آبگوشت‌خانه", "حلیم‌پزی", "فلافل", "سوسیس و کالباس", "انواع ترشی", "مربا و کمپوت",
    "شیر و ماست خانگی", "پنیر بومی", "کشک و دوغ", "انواع نان محلی", "لواشک", "پشمک",

    // هنر و صنایع دستی
    "قالیبافی", "گلیم‌بافی", "مس‌گری", "فیروزه‌کاری", "میناکاری", "خطاطی", "نقاشی روی شیشه",
    "سفال‌گری", "انواع سوزندوزی", "طلاکوبی", "نجاری سنتی", "حکاکی", "خیل کوبی",
    "مجسمه‌سازی", "گچ‌کاری", "کاشی‌کاری", "شیشه‌گری", "مقالم‌بافی", "ابریشم‌بافی",

    // صنایع نساجی و پوشاک تخصصی
    "چادر مشکی", "روسری و شال", "بافندگی", "قلاب‌بافی", "نخ‌ریسی", "رنگرزی پارچه",
    "دوخت لباس محلی", "کلاه بافی", "کفش دست‌دوز", "گیوه", "چارخ", "موکاسن",
    "لباس کار ایمنی", "یونیفرم", "لباس نظامی", "کیف ورزشی", "کوله‌پشتی", "چمدان",

    // الکترونیک تخصصی
    "تعمیر تلویزیون", "تعمیر رادیو", "تعمیر ماشین لباسشویی", "تعمیر یخچال", "تعمیر کولر",
    "سیستم امنیتی خانگی", "دوربین مدار بسته", "سیستم صوتی مسجد", "ماهواره", "آنتن",
    "انواع باتری", "شارژر تخصصی", "لوازم برقی خانگی", "پنکه سقفی", "هود آشپزخانه",

    // حمل‌ونقل تخصصی
    "تعمیر لنت و کلاچ", "کارواش آبی", "کارواش بخار", "پولیش خودرو", "رنگ خودرو",
    "اجاره خودرو عروسی", "اجاره ون", "بارگیری", "باربری", "کامیونت", "تریلی",
    "دراج موتور", "پیک موتوری", "تاکسی شبانه‌روزی", "اسنپ و تپ‌سی", "بلبرینگ خودرو",

    // خدمات درمانی تخصصی
    "طب ایرانی", "حجامت", "زالودرمانی", "طب توریسم", "ماساژ درمانی", "کایروپراکتیک",
    "رفلکسولوژی", "اکوپانکچر", "طب سوجوک", "یوگادرمانی", "درمان با گیاهان",
    "مشاوره تغذیه", "رژیم درمانی", "کلینیک لاغری", "کلینیک ترک اعتیاد", "گفتار درمانی",

    // کشاورزی پیشرفته
    "قارچ صدفی", "قارچ شیتاکه", "کشت آبزی", "کشت هیدروپونیک", "گلخانه هوشمند",
    "دام و طیور بومی", "زنبور عسل", "پرورش طاووس", "پرورش شتر", "انواع کود آلی",
    "بیماری‌های گیاهی", "آفت‌کش بیولوژیک", "کشت گل محمدی", "نهال انواع میوه", "بذر اصلاح شده",

    // ساخت و ساز تخصصی
    "پیچ و مهره", "میلگرد", "تیرآهن", "ورق فلزی", "سیمان و گچ", "شن و ماسه",
    "آجر سفال", "سنگ ساختمانی", "کف‌پوش", "دیوارپوش", "سقف کاذب", "عایق رطوبت",
    "نقاشی ساختمان", "کاغذ دیواری", "شیشه سکوریت", "آلومینیم", "پنجره دوجداره",

    // محیط زیست و انرژی
    "پنل خورشیدی", "باد نیروگاه کوچک", "سیستم بازیافت آب", "کمپوست", "ورمی کمپوست",
    "تصفیه هوا", "درخت‌کاری", "محیط‌بان", "آموزش محیط زیست", "انرژی‌های تجدیدپذیر",

    // رسانه و ارتباطات
    "روزنامه محلی", "رادیو محلی", "تلویزیون شهری", "سایت خبری", "پادکست", "ولاگ",
    "تبلیغات محیطی", "بیلبورد", "تابلوسازی", "چاپ دیجیتال", "فتوکپی", "صحافی",
    "انتشارات", "نشریه تخصصی", "مجله محلی", "خدمات ترجمه", "تایپیست", "تدوین",

    // خدمات مذهبی و فرهنگی  
    "مسجد", "حسینیه", "تکیه", "مدرسه علمیه", "کتاب‌خانه مذهبی", "فرهنگسرا",
    "خانه فرهنگ", "عزاداری", "روضه‌خوانی", "مداحی", "قرآن‌خوانی", "حافظ قرآن",
    "کلاس تجوید", "کلاس فقه", "نوحه‌سرایی", "شعر محلی", "موسیقی سنتی", "موسیقی مذهبی",

    // صنعت بازی و تفریح
    "تئاتر محلی", "سینما خانگی", "کارتون تولید", "انیمیشن", "بازی رومیزی", "شطرنج",
    "تخته‌نرد", "کتاب‌خوانی", "قصه‌گویی", "نمایش عروسکی", "سرکس محلی", "نقل و نقالی",

    // صنعت گردشگری محلی
    "راهنمای محلی", "موزه خصوصی", "آثار باستانی", "بناهای تاریخی", "طبیعت‌گردی",
    "کوه‌نوردی", "غارنوردی", "سوارکاری", "چادرزدن", "طبیعت‌گردی", "بوم‌گردی",

    // صنایع دریایی و آبی (برای شهرهای ساحلی)
    "صید ماهی", "پرورش ماهی", "خاویار", "صدف پرورش", "نمک دریا", "جلبک دریایی",
    "لنج سازی", "قایق سازی", "تجهیزات شنا", "لباس غواصی", "اسکوبا", "ماهی‌گیری ورزشی",

    // سایر خدمات تخصصی
    "مترجم", "راننده شخصی", "نگهدار خانه", "مربی خصوصی", "مشاور خانواده", "روان‌شناس",
    "مددکار اجتماعی", "امور اجتماعی", "کار با سالمندان", "مرکز روزانه کودکان", "مادر شبانه",
    "خدمات پرستاری", "خدمات میکروبیولوژی", "مشاوره حقوقی", "دفتر طلاق", "دفتر وکالت",
    
    "سایر"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>افزودن مشتری جدید</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام فروشگاه *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="shop-name-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مالک *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="owner-name-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="phone-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع کسب‌وکار *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="business-type-select">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وضعیت POS</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="status-select">
                        <SelectValue placeholder="انتخاب وضعیت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">✅ کارآمد</SelectItem>
                      <SelectItem value="normal">🟡 معمولی</SelectItem>
                      <SelectItem value="marketing">📢 بازاریابی</SelectItem>
                      <SelectItem value="loss">❌ زیان‌ده</SelectItem>
                      <SelectItem value="collected">📦 جمع‌آوری شده</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} rows={3} data-testid="address-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سود ماهانه (تومان)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="monthly-profit-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شعبه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="branch-select">
                          <SelectValue placeholder="انتخاب شعبه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="supportEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>کارمند پشتیبان</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="support-employee-select">
                        <SelectValue placeholder="انتخاب کارمند" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm">
                  📍 انتخاب از نقشه
                </Button>
                <span className="text-sm text-muted-foreground">
                  **موقعیت انتخاب شده:** {selectedLocation ? "انتخاب شده" : "هیچ"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createCustomerMutation.isPending}
                data-testid="save-customer-button"
              >
                {createCustomerMutation.isPending ? "در حال ذخیره..." : "💾 ذخیره مشتری"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="cancel-button"
              >
                لغو
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
