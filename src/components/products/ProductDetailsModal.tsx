import { Trash2, X } from 'lucide-react';
import Button from '../Button';
import { InvalidateQueryFilters, useQuery, useQueryClient } from '@tanstack/react-query';
// import { deleteSizesApi, DeleteVariantsProductApi, getProductWithVariantSizeApi} from '../../Api-Service/Apis';
import { useParams } from 'react-router-dom';
import { deleteSizesApi, DeleteVariantsProductApi, getProductWithVariantSizeApi } from '../../Api-Service/Apis';

interface ProductDetailsModalProps {
  product: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetailsModal({ product, onClose, onEdit }: ProductDetailsModalProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const getProductWithVariantSizeData: any = useQuery({
    queryKey: ['getProductWithVariantSizeData', product?.id],
    queryFn: () => getProductWithVariantSizeApi(`${product?.id}`)
  });

  const handleDeleteSize = async (size: any) => {
    try {
      const updateApi = await deleteSizesApi(`/${size?.id}`, { deleted_by: "admin" });
      if (updateApi) {
        queryClient.invalidateQueries(['getProductWithVariantSizeData'] as InvalidateQueryFilters);
      }
    } catch (error) {

    }
  }

  const handleDeleteVariant = async (variantId: any) => {
    try {
      const response = await DeleteVariantsProductApi(`/${variantId}`, { deleted_by: "admin" });
      if (response) {
        queryClient.invalidateQueries(['getProductWithVariantSizeData'] as InvalidateQueryFilters);
      }
    } catch (error) {

    }
  }
  const productData = getProductWithVariantSizeData?.data?.data;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div>
            <div className="aspect-w-3 aspect-h-2 mb-4">
              <img
                src={productData?.image_urls[0] ? productData?.image_urls[0] : "https://media.istockphoto.com/id/1222357475/vector/image-preview-icon-picture-placeholder-for-website-or-ui-ux-design-vector-illustration.jpg?s=612x612&w=0&k=20&c=KuCo-dRBYV7nz2gbk4J9w1WtTAgpTdznHu55W9FjimE="}
                // src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                alt={productData?.name}
                className="h-64 w-full object-cover rounded-lg"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">{productData?.name} <span className='text-slate-600 ml-3'>
              {/* {product?.weight} g */}
              {/* {productData?.brand_name} */}
            </span></h3>
                      <div className="mt-1 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: product?.description }} />

            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">₹{productData?.price}</span>
                {productData?.discount && (
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    ₹{productData?.discount}
                  </span>
                )}
              </div>
            </div>

            {/* <div className="mt-6">
              {productData?.variants?.length  ? (
                <div>
                <h4 className="text-sm font-medium text-gray-900">Available Varieties</h4>

                <div className="mt-2 space-y-4">
                {productData?.variants?.map((variety: any, index: any) => (
                  <div key={index} className="border rounded-lg p-2">
                    <div className="flex items-center">
                      {variety?.product_variant_image_urls && (
                        <img
                          src={variety?.product_variant_image_urls[0]}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      <div className="ml-4">
                        <h5 className="text-sm font-medium text-gray-900">{variety?.product_variant_title}</h5>
                        <h5 className="text-sm font-medium text-gray-500 gap-2">stock_quantity: {variety?.product_variant_stock_quantity
                        }</h5>

                        <div className="mt-1 flex flex-wrap gap-2">
                          {variety?.sizes?.map((size: any, sizeIndex: any) => (
                            <span
                              key={sizeIndex}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {size.product_size} ({size.product_size_stock_quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
                </div>
              ) : ''}

             
            </div> */}
            <div className="mt-6">
              {productData?.variants?.length ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Available Varieties</h4>

                  <div className="mt-2 space-y-4">
                    {productData?.variants?.map((variety: any, index: number) => (
                      <div key={index} className="border rounded-lg p-2 relative">
                        {/* 🗑️ Delete Variant */}
                        <button
                          onClick={() => handleDeleteVariant(variety?.id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Delete Variant"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="flex items-center">
                          {variety?.product_variant_image_urls?.[0] && (
                            <img
                              src={variety.product_variant_image_urls[0]}
                              className="h-16 w-16 rounded object-cover"
                              alt="variant"
                            />
                          )}
                          <div className="ml-4">
                            <h5 className="text-sm font-medium text-gray-900">
                              {variety?.product_variant_title}
                            </h5>
                            <h5 className="text-sm font-medium text-gray-500 gap-2">
                              stock_quantity: {variety?.product_variant_stock_quantity}
                            </h5>

                            <div className="mt-1">
                              {variety?.sizes?.length ? (
                                <>
                                  <h4 className="text-sm font-medium text-black mb-1">Available Sizes</h4>
                                  {variety?.sizes?.map((size: any, sizeIndex: number) => (
                                    <div
                                      key={sizeIndex}
                                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                                    >
                                      {size.product_size} ({size.product_size_stock_quantity})
                                      {/* ❌ Delete Size */}
                                      <button
                                        onClick={() => handleDeleteSize(size)}
                                        className="ml-1 text-red-400 hover:text-red-600 p-1"
                                        title="Remove Size"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </>
                              ) : ""}

                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={onEdit}>Edit Product</Button>
          </div>
        </div>
      </div>
    </div>
  );
}