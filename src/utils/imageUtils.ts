export const getProductImageUrl = (prod: any): string => {
  if (!prod) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60';
  
  return prod.featuredImage ||
    prod.thumbnail ||
    prod.imageUrl ||
    prod.image ||
    (prod.images && prod.images.length > 0 ? prod.images[0] : null) || 
    (prod.gallery && prod.gallery.length > 0 ? prod.gallery[0] : null) ||
    (prod.media && prod.media.length > 0 && prod.media[0].url ? prod.media[0].url : null) ||
    prod.mainImage || 
    (prod.imageUrls && prod.imageUrls.length > 0 ? prod.imageUrls[0] : null) || 
    prod.coverImage ||
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60';
};
