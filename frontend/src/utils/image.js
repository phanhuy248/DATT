export function getImageUrl(image) {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `/uploads/${image}`
}
