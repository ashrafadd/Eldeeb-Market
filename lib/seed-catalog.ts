import { sql } from 'drizzle-orm'
import { catalogProducts } from '@/lib/catalog'
import { db } from '@/lib/db'
import { products as productsTable } from '@/lib/db/schema'

/**
 * ينقل منتجات الكاتالوج الثابت إلى قاعدة البيانات.
 * آمن للتكرار: الصفوف الموجودة لا تُلمس إلا إذا طُلب التحديث.
 */
export async function seedCatalog({ overwrite = false } = {}) {
  const rows = catalogProducts.map((product, index) => ({
    id: product.id,
    title: product.title,
    unit: product.unit,
    image: product.image,
    price: product.price.toFixed(2),
    oldPrice: product.oldPrice ? product.oldPrice.toFixed(2) : null,
    rating: product.rating.toFixed(2),
    reviews: product.reviews,
    brand: product.brand,
    stock: product.stock,
    description: product.description,
    subCategoryId: product.subCategoryId,
    isActive: true,
    sortOrder: index,
  }))

  if (!rows.length) return { inserted: 0 }

  // تُدرج على دفعات لتفادي حدود عدد الوسائط في عبارة واحدة
  const batchSize = 100
  let processed = 0

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize)
    const query = db.insert(productsTable).values(batch)

    if (overwrite) {
      await query.onConflictDoUpdate({
        target: productsTable.id,
        set: {
          title: sql`excluded.title`,
          unit: sql`excluded.unit`,
          image: sql`excluded.image`,
          price: sql`excluded.price`,
          oldPrice: sql`excluded."oldPrice"`,
          brand: sql`excluded.brand`,
          stock: sql`excluded.stock`,
          description: sql`excluded.description`,
          updatedAt: new Date(),
        },
      })
    } else {
      await query.onConflictDoNothing()
    }

    processed += batch.length
  }

  return { inserted: processed }
}
