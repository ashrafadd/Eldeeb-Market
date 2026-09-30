/** الحد الأقصى لأبعاد صورة المنتج بعد الضغط */
const MAX_DIMENSION = 560

/** جودة الضغط — تحفظ وضوح الصورة مع حجم صغير مناسب للتخزين */
const QUALITY = 0.82

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * يقرأ ملف صورة ويضغطه في المتصفح ثم يعيده بصيغة Base64
 * جاهزة للتخزين مباشرة في قاعدة البيانات.
 */
export async function fileToCompressedDataUrl(
  file: File,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('اختر صورة بصيغة JPG أو PNG أو WEBP')
  }

  const limit = options.maxDimension ?? MAX_DIMENSION
  const quality = options.quality ?? QUALITY

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('تعذر معالجة الصورة')
  }

  // خلفية بيضاء حتى لا تظهر الشفافية سوداء بعد التحويل إلى JPEG
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
