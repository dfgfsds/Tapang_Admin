import { Trash2, X } from 'lucide-react';
import Button from '../Button';
import { InvalidateQueryFilters, useQuery, useQueryClient } from '@tanstack/react-query';
// import { deleteSizesApi, DeleteVariantsProductApi, getProductWithVariantSizeApi} from '../../Api-Service/Apis';
import { useParams } from 'react-router-dom';
import { deleteSizesApi, DeleteVariantsProductApi, getProductWithVariantSizeApi } from '../../Api-Service/Apis';
import axios from 'axios';
import ApiUrls from '../../Api-Service/ApiUrls';
import { toast } from 'react-toastify';

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

  const handleUpdateVariantStatus = async (variant: any) => {
    try {
      const res = await axios.put(
        `${ApiUrls?.variants}/${variant.id}/`,
        {
          product_variant_status: !variant.product_variant_status,
          updated_by: "admin",
        }
      );

      if (res) {
        queryClient.invalidateQueries([
          "getProductWithVariantSizeData",
        ] as InvalidateQueryFilters);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        "Failed to update variant status"
      );
    }
  };

  const handleUpdateSizeStatus = async (size: any) => {
    try {
      const res = await axios.put(
        `${ApiUrls?.sizes}/${size.id}/`,
        {
          product_size_status: !size.product_size_status,
          updated_by: "admin",
        }
      );

      if (res) {
        queryClient.invalidateQueries([
          "getProductWithVariantSizeData",
        ] as InvalidateQueryFilters);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        "Failed to update size status"
      );
    }
  };

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


            <div className="mt-6">
              {productData?.variants?.length ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Available Varieties</h4>

                  <div className="mt-2 space-y-4">
                    {productData?.variants?.map((variety: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                      >
                        {/* HEADER */}
                        <div className="flex items-center justify-between">
                          <h5 className="text-lg font-semibold text-gray-900 capitalize">
                            {variety?.product_variant_title}
                          </h5>

                          <div className="flex items-center gap-4">
                            {/* STATUS TOGGLE */}
                            <div
                              onClick={() => handleUpdateVariantStatus(variety)}
                              className={`relative w-11 h-6 rounded-full cursor-pointer transition
          ${variety?.product_variant_status
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                                }`}
                            >
                              <span
                                className={`absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full transition-transform
            ${variety?.product_variant_status
                                    ? "translate-x-5"
                                    : ""
                                  }`}
                              />
                            </div>

                            {/* DELETE VARIANT */}
                            <button
                              onClick={() => handleDeleteVariant(variety?.id)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Delete Variant"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* BODY */}
                        <div className="mt-4 flex gap-4">
                          {/* IMAGE */}
                          <div className="h-20 w-20 rounded-xl overflow-hidden border bg-gray-100 flex-shrink-0">
                            {variety?.product_variant_image_urls?.[0] ? (
                              <img
                                src={variety.product_variant_image_urls[0]}
                                alt="variant"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>

                          {/* INFO */}
                          <div className="flex-1">
                            {/* STOCK */}
                            <span className="inline-block mb-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              Stock: {variety?.product_variant_stock_quantity}
                            </span>

                            {/* SIZES */}
                            {variety?.sizes?.length > 0 && (
                              <>
                                <h4 className="text-sm font-medium text-gray-800 mb-2">
                                  Available Sizes
                                </h4>

                                <div className="flex flex-wrap gap-2">
                                  {variety?.sizes?.map((size: any, sizeIndex: number) => (
                                    <div
                                      key={sizeIndex}
                                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                                    >
                                      <span>
                                        {size.product_size}
                                        <span className="text-gray-500">
                                          {" "}
                                          ({size.product_size_stock_quantity})
                                        </span>
                                      </span>

                                      {/* SIZE STATUS TOGGLE */}
                                      <div
                                        onClick={() => handleUpdateSizeStatus(size)}
                                        className={`relative w-8 h-4 rounded-full cursor-pointer transition
                    ${size?.product_size_status
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                          }`}
                                      >
                                        <span
                                          className={`absolute top-[2px] left-[2px] h-3 w-3 bg-white rounded-full transition-transform
                      ${size?.product_size_status
                                              ? "translate-x-4"
                                              : ""
                                            }`}
                                        />
                                      </div>
                                      {/* DELETE SIZE */}
                                      <button
                                        onClick={() => handleDeleteSize(size)}
                                        className="text-red-400 hover:text-red-600 transition"
                                        title="Delete Size"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
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