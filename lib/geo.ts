import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cities, villages } from '@/lib/db/schema'

export type City = {
  id: string
  branchId: string
  name: string
  active: boolean
}

export type Village = {
  id: string
  cityId: string
  name: string
  active: boolean
}

/** مدن فرع معيّن (كلها للوحة المدير، أو المفعّلة فقط للعميل) */
export async function getCities(branchId: string, activeOnly = false): Promise<City[]> {
  const where = activeOnly
    ? and(eq(cities.branchId, branchId), eq(cities.active, true))
    : eq(cities.branchId, branchId)

  const rows = await db.select().from(cities).where(where).orderBy(asc(cities.name))
  return rows.map((row) => ({
    id: row.id,
    branchId: row.branchId,
    name: row.name,
    active: row.active,
  }))
}

/** مناطق/قرى مدينة معيّنة */
export async function getVillages(cityId: string, activeOnly = false): Promise<Village[]> {
  const where = activeOnly
    ? and(eq(villages.cityId, cityId), eq(villages.active, true))
    : eq(villages.cityId, cityId)

  const rows = await db.select().from(villages).where(where).orderBy(asc(villages.name))
  return rows.map((row) => ({
    id: row.id,
    cityId: row.cityId,
    name: row.name,
    active: row.active,
  }))
}

/** كل مدن الفرع مع قراها — لعرض الشجرة في لوحة المدير */
export type CityWithVillages = City & { villages: Village[] }

export async function getGeoTree(branchId: string): Promise<CityWithVillages[]> {
  const cityRows = await getCities(branchId, false)
  const result: CityWithVillages[] = []
  for (const city of cityRows) {
    const villageRows = await getVillages(city.id, false)
    result.push({ ...city, villages: villageRows })
  }
  return result
}
