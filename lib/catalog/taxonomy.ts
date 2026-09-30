/**
 * هيكل الكتالوج: مجموعات ← أقسام رئيسية ← أقسام فرعية
 * مستوحى من تقسيم متاجر التجزئة الكبرى (البقالة / مستلزمات البيت / أغذية طازجة)
 */

export type CatalogGroup = {
  id: string
  name: string
  subtitle: string
}

export type Department = {
  id: string
  name: string
  groupId: string
  icon: string
  tint: string
}

export type SubCategory = {
  id: string
  name: string
  departmentId: string
}

export const catalogGroups: CatalogGroup[] = [
  { id: 'grocery', name: 'البقالة', subtitle: 'كل احتياجات المطبخ والمخزن' },
  { id: 'home', name: 'مستلزمات البيت', subtitle: 'تنظيف، عناية ومستلزمات الأطفال' },
  { id: 'fresh', name: 'أغذية طازجة', subtitle: 'يومي من المزرعة والملحمة' },
]

export const departments: Department[] = [
  // البقالة
  { id: 'pantry', name: 'خزانة الأطعمة', groupId: 'grocery', icon: 'Wheat', tint: 'oklch(0.95 0.06 75)' },
  { id: 'frozen', name: 'المجمدات', groupId: 'grocery', icon: 'Snowflake', tint: 'oklch(0.94 0.05 220)' },
  { id: 'bakery', name: 'المخبوزات', groupId: 'grocery', icon: 'Croissant', tint: 'oklch(0.95 0.055 60)' },
  { id: 'drinks', name: 'المشروبات', groupId: 'grocery', icon: 'CupSoda', tint: 'oklch(0.94 0.05 200)' },
  { id: 'snacks', name: 'سناكس وحلويات', groupId: 'grocery', icon: 'Candy', tint: 'oklch(0.95 0.055 100)' },

  // مستلزمات البيت
  { id: 'household', name: 'احتياجات المنزل', groupId: 'home', icon: 'SprayCan', tint: 'oklch(0.94 0.05 300)' },
  { id: 'beauty', name: 'الجمال والصحة', groupId: 'home', icon: 'Sparkles', tint: 'oklch(0.94 0.05 330)' },
  { id: 'baby', name: 'مستلزمات الأطفال', groupId: 'home', icon: 'Baby', tint: 'oklch(0.95 0.05 340)' },

  // أغذية طازجة
  { id: 'produce', name: 'الفواكه والخضروات', groupId: 'fresh', icon: 'Carrot', tint: 'oklch(0.94 0.06 145)' },
  { id: 'dairy', name: 'البيض والألبان', groupId: 'fresh', icon: 'Milk', tint: 'oklch(0.94 0.045 240)' },
  { id: 'butchery', name: 'الملحمة', groupId: 'fresh', icon: 'Beef', tint: 'oklch(0.94 0.055 25)' },
  { id: 'ownbrand', name: 'منتجات تسويقة', groupId: 'fresh', icon: 'BadgeCheck', tint: 'oklch(0.94 0.05 170)' },
]

export const subCategories: SubCategory[] = [
  // خزانة الأطعمة
  { id: 'rice-pasta', name: 'الأرز والباستا', departmentId: 'pantry' },
  { id: 'cooking', name: 'مكونات الطبخ', departmentId: 'pantry' },
  { id: 'sugar-flour', name: 'السكر والطحين', departmentId: 'pantry' },
  { id: 'breakfast', name: 'وجبة الفطور وإضافاتها', departmentId: 'pantry' },
  { id: 'canned', name: 'المعلبات والمخللات', departmentId: 'pantry' },
  { id: 'spices', name: 'البهارات والتوابل', departmentId: 'pantry' },

  // المجمدات
  { id: 'ice-cream', name: 'آيس كريم', departmentId: 'frozen' },
  { id: 'frozen-fish', name: 'أسماك مجمدة', departmentId: 'frozen' },
  { id: 'frozen-meat', name: 'لحوم مجمدة', departmentId: 'frozen' },
  { id: 'ready-meals', name: 'وجبات جاهزة', departmentId: 'frozen' },
  { id: 'frozen-veg', name: 'خضروات مجمدة', departmentId: 'frozen' },

  // المخبوزات
  { id: 'arabic-bread', name: 'الخبز العربي', departmentId: 'bakery' },
  { id: 'cakes', name: 'الكيك والحلويات', departmentId: 'bakery' },
  { id: 'bread-buns', name: 'الخبز والفطائر', departmentId: 'bakery' },
  { id: 'pastries', name: 'معجنات وكرواسون', departmentId: 'bakery' },

  // المشروبات
  { id: 'water', name: 'مياه الشرب', departmentId: 'drinks' },
  { id: 'soda', name: 'المشروبات الغازية', departmentId: 'drinks' },
  { id: 'coffee', name: 'القهوة', departmentId: 'drinks' },
  { id: 'tea', name: 'الشاي', departmentId: 'drinks' },
  { id: 'juices', name: 'العصائر', departmentId: 'drinks' },

  // سناكس وحلويات
  { id: 'chocolate', name: 'الشوكولاتة', departmentId: 'snacks' },
  { id: 'chips', name: 'شيبسي ومقرمشات', departmentId: 'snacks' },
  { id: 'biscuits', name: 'البسكويت والويفر', departmentId: 'snacks' },
  { id: 'nuts', name: 'المكسرات والفواكه المجففة', departmentId: 'snacks' },

  // احتياجات المنزل
  { id: 'laundry', name: 'الغسيل', departmentId: 'household' },
  { id: 'cleaning', name: 'مستلزمات التنظيف', departmentId: 'household' },
  { id: 'dishwash', name: 'غسل الصحون', departmentId: 'household' },
  { id: 'foil-wrap', name: 'ورق الفويل والتغليف', departmentId: 'household' },
  { id: 'tissues', name: 'المناديل والمناشف', departmentId: 'household' },

  // الجمال والصحة
  { id: 'makeup', name: 'المكياج', departmentId: 'beauty' },
  { id: 'perfume', name: 'العطور', departmentId: 'beauty' },
  { id: 'bath', name: 'منتجات الاستحمام', departmentId: 'beauty' },
  { id: 'haircare', name: 'العناية بالشعر', departmentId: 'beauty' },
  { id: 'skincare', name: 'العناية بالبشرة', departmentId: 'beauty' },

  // مستلزمات الأطفال
  { id: 'diapers', name: 'حفاضات ومناديل', departmentId: 'baby' },
  { id: 'baby-cream', name: 'كريمات الأطفال', departmentId: 'baby' },
  { id: 'baby-bath', name: 'منتجات استحمام الأطفال', departmentId: 'baby' },
  { id: 'feeding', name: 'أدوات الرضاعة', departmentId: 'baby' },
  { id: 'baby-food', name: 'ألبان وأغذية الأطفال', departmentId: 'baby' },

  // الفواكه والخضروات
  { id: 'fruits', name: 'الفواكه', departmentId: 'produce' },
  { id: 'vegetables', name: 'الخضروات', departmentId: 'produce' },
  { id: 'salad-veg', name: 'خضروات السلطة', departmentId: 'produce' },
  { id: 'cut-fruits', name: 'فواكه مقطعة', departmentId: 'produce' },
  { id: 'herbs', name: 'أعشاب طازجة', departmentId: 'produce' },

  // البيض والألبان
  { id: 'eggs', name: 'البيض', departmentId: 'dairy' },
  { id: 'fresh-milk', name: 'حليب طازج', departmentId: 'dairy' },
  { id: 'long-milk', name: 'حليب طويل الأجل', departmentId: 'dairy' },
  { id: 'yogurt', name: 'اللبن وحليب النكهات', departmentId: 'dairy' },
  { id: 'cheese', name: 'أجبان وزبدة', departmentId: 'dairy' },

  // الملحمة
  { id: 'fresh-fish', name: 'سمك طازج', departmentId: 'butchery' },
  { id: 'poultry', name: 'دواجن طازجة', departmentId: 'butchery' },
  { id: 'lamb', name: 'لحم الضأن والماعز', departmentId: 'butchery' },
  { id: 'beef', name: 'لحم بقري', departmentId: 'butchery' },
  { id: 'processed-meat', name: 'مصنعات اللحوم', departmentId: 'butchery' },

  // منتجات تسويقة
  { id: 'daily-fresh', name: 'يُحضَّر يومياً', departmentId: 'ownbrand' },
  { id: 'own-bakery', name: 'مخبز تسويقة', departmentId: 'ownbrand' },
  { id: 'own-kitchen', name: 'مطبخ تسويقة', departmentId: 'ownbrand' },
  { id: 'roasted-nuts', name: 'مكسر��ت محمصة', departmentId: 'ownbrand' },
]

export function subCategoriesOf(departmentId: string) {
  return subCategories.filter((item) => item.departmentId === departmentId)
}

export function departmentsOf(groupId: string) {
  return departments.filter((item) => item.groupId === groupId)
}

export function getDepartment(id: string) {
  return departments.find((item) => item.id === id)
}

export function getSubCategory(id: string) {
  return subCategories.find((item) => item.id === id)
}
