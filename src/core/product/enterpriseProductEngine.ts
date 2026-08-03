/**
 * Enterprise Product Management Engine
 * Pi Business Market
 */

import { productService } from '../../services/productService';
import { searchService } from '../../services/searchService';
import { EnterpriseProductProfile, ProductVariant, BulkPricingTier } from './enterpriseProductTypes';
import { Product } from '../../types';

export class EnterpriseProductEngine {
  /**
   * Save or Update an Enterprise Product and re-index into search engine
   */
  static async saveProduct(
    productData: Partial<EnterpriseProductProfile>,
    isEdit: boolean = false,
    existingProductId?: string
  ): Promise<string> {
    let productId = existingProductId;

    const sanitizedPayload: any = {
      ...productData,
      type: productData.type || 'physical',
      status: productData.status || 'published',
      visibility: productData.visibility || 'public',
      featured: productData.featured || false,
      price: Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
      minOrderQty: Number(productData.minOrderQty) || 1,
      maxOrderQty: productData.maxOrderQty ? Number(productData.maxOrderQty) : 999,
      imageUrls: productData.imageUrls || (productData.mainImage ? [productData.mainImage] : []),
      images: productData.imageUrls || (productData.mainImage ? [productData.mainImage] : [])
    };

    if (isEdit && productId) {
      await productService.updateProduct(productId, sanitizedPayload);
    } else {
      productId = await productService.createProduct(sanitizedPayload);
    }

    // Automatically index into Search Engine
    try {
      if (productId) {
        await searchService.indexEntity({
          entityType: 'product',
          entityId: productId,
          businessId: productData.businessId || 'none',
          storeId: productData.storeId || 'none',
          title: productData.productName || 'Untitled Product',
          description: productData.description || productData.shortDescription || '',
          keywords: [
            (productData.productName || '').toLowerCase(),
            (productData.brand || '').toLowerCase(),
            (productData.category || '').toLowerCase(),
            (productData.subCategory || '').toLowerCase(),
            ...(productData.tags || []).map(t => t.toLowerCase())
          ].filter(Boolean),
          categoryIds: [productData.category || 'general'],
          location: 'Global',
          visibility: productData.visibility === 'public' ? 'public' : 'hidden',
          status: productData.status === 'published' ? 'active' : 'inactive',
          featured: productData.featured || false,
          metadata: {
            productId: productId,
            price: productData.price,
            currency: productData.currency || 'Pi',
            brand: productData.brand,
            category: productData.category,
            mainImage: productData.mainImage || (productData.imageUrls?.[0]),
            rating: productData.rating || 5.0,
            reviewCount: productData.reviewCount || 1,
            stockStatus: productData.stockStatus || (Number(productData.stock) > 0 ? 'in_stock' : 'out_of_stock')
          }
        });
      }
    } catch (searchErr) {
      console.warn('[EnterpriseProductEngine] Search index notification:', searchErr);
    }

    return productId || '';
  }

  /**
   * Duplicate existing product
   */
  static async duplicateProduct(productId: string): Promise<string> {
    const original: any = await productService.getProduct(productId);
    if (!original) {
      throw new Error('Original product not found');
    }

    const { id, productId: pid, createdAt, updatedAt, ...copyData } = original;
    copyData.productName = `${original.productName || 'Product'} (Copy)`;
    copyData.sku = original.sku ? `${original.sku}-COPY` : `SKU-${Date.now()}`;
    copyData.status = original.status || 'published';

    return await this.saveProduct(copyData, false);
  }

  /**
   * Quick update inventory stock with low-stock notification check
   */
  static async updateStock(productId: string, quantityChange: number): Promise<void> {
    await productService.updateStock(productId, quantityChange);
  }

  /**
   * Soft delete product
   */
  static async archiveProduct(productId: string): Promise<void> {
    await productService.archiveProduct(productId);
  }
}
