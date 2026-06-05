export function getImageUrl(image) {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/') || image.startsWith('data:') || image.startsWith('blob:')) return image
  return `/uploads/${image}`
}
