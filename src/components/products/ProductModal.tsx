import React, { useEffect, useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import { ProductForm } from '../../types/product';
import ImageUpload from './ImageUpload';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { getCategoriesWithSubcategoriesApi, postImageUploadApi, postProductVariantSizesCreateApi, updateProductVariantSizesapi } from '../../Api-Service/Apis';
// import SizeSection from './SizeSection';
import { InvalidateQueryFilters, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import SizeSection from './SizeSection';

interface ProductModalProps {
  productForm: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (updates: Partial<ProductForm>) => void;
}


export const ProductSchema = Yup.object().shape({
  // 🔹 Basic Details
  name: Yup.string().required("Product name is required"),
  slug_name: Yup.string().required("Slug name is required"),
  description: Yup.string().required("Description is required"),

  // 🔹 Category and Brand
  category: Yup.number()
    .typeError("Category is required")
    .required("Category is required"),
  // subcategory: Yup.number()
  //   .typeError("Subcategory is required")
  //   .required("Subcategory is required"),
  brand_name: Yup.string().required("Brand name is required"),

  // 🔹 Pricing and Stock
  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .min(1, "Price must be greater than 0"),
  discount: Yup.number()
    .nullable()
    .min(0, "MRP price must be at least 0")
    .typeError("MRP price must be a number"),
  commission: Yup.number()
    .typeError("Commission must be a number")
    .required("Commission is required")
    .min(0, "Commission cannot be negative"),
  cost: Yup.number()
    .typeError("Cost must be a number")
    .required("Cost is required")
    .min(0, "Cost cannot be negative"),
  stock_quantity: Yup.number()
    .typeError("Stock quantity must be a number")
    .required("Stock quantity is required")
    .min(0, "Stock cannot be negative"),

  // 🔹 SKU
  sku: Yup.string().required("SKU is required"),

  // 🔹 Dimensions
  weight: Yup.number()
    .typeError("Weight must be a number")
    .required("Weight is required")
    .min(0, "Weight must be positive"),
  length: Yup.number()
    .typeError("Length must be a number")
    .required("Length is required")
    .min(0, "Length must be positive"),
  breadth: Yup.number()
    .typeError("Breadth must be a number")
    .required("Breadth is required")
    .min(0, "Breadth must be positive"),
  height: Yup.number()
    .typeError("Height must be a number")
    .required("Height is required")
    .min(0, "Height must be positive"),

  // 🔹 Image Upload
  // images: Yup.array()
  //   .min(1, "At least one product image is required")
  //   .of(Yup.mixed().required("Image is required")),

  // 🔹 Featured Product
  is_featured: Yup.boolean().default(false),

  // 🔹 Keywords & Meta Tags (converted to array)
  keywords: Yup.array()
    .nullable()
    .transform((_, originalValue) =>
      typeof originalValue === "string"
        ? originalValue
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
        : Array.isArray(originalValue)
          ? originalValue
          : []
    )
    .of(Yup.string().typeError("Invalid keyword")),

  meta_tax: Yup.array()
    .nullable()
    .transform((_, originalValue) =>
      typeof originalValue === "string"
        ? originalValue
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
        : Array.isArray(originalValue)
          ? originalValue
          : []
    )
    .of(Yup.string().typeError("Invalid meta tag")),

  // 🔹 Varieties (Dynamic Fields)
  varieties: Yup.array()
    .of(
      Yup.object().shape({
        product_variant_title: Yup.string().required(
          "Product variant title is required"
        ),
        product_variant_description: Yup.string().required(
          "Product variant description is required"
        ),
        product_variant_sku: Yup.string().required("Variant SKU is required"),
        product_variant_price: Yup.number()
          .typeError("Variant price must be a number")
          .required("Variant price is required")
          .min(1, "Variant price must be greater than 0"),
        product_variant_discount: Yup.number()
          .nullable()
          .min(0, "Variant discount cannot be negative")
          .typeError("Variant discount must be a number"),
        product_variant_weight: Yup.number()
          .typeError("Variant weight must be a number")
          .required("Variant weight is required")
          .min(0, "Variant weight must be positive"),
        product_variant_length: Yup.number()
          .typeError("Variant length must be a number")
          .required("Variant length is required")
          .min(0, "Variant length must be positive"),
        product_variant_breadth: Yup.number()
          .typeError("Variant breadth must be a number")
          .required("Variant breadth is required")
          .min(0, "Variant breadth must be positive"),
        product_variant_height: Yup.number()
          .typeError("Variant height must be a number")
          .required("Variant height is required")
          .min(0, "Variant height must be positive"),

        // Variant Images
        product_variant_images: Yup.array()
          .min(1, "At least one image is required for this variant")
          .of(Yup.mixed().required("Variant image is required")),

        // Sizes (if you have size section)
        sizes: Yup.array()
          .of(
            Yup.object().shape({
              size_label: Yup.string().required("Size label is required"),
              size_price: Yup.number()
                .typeError("Size price must be a number")
                .required("Size price is required")
                .min(1, "Size price must be greater than 0"),
              size_stock: Yup.number()
                .typeError("Size stock must be a number")
                .required("Size stock is required")
                .min(0, "Size stock cannot be negative"),
            })
          )
          .nullable(),
      })
    )
    .nullable(),
});


export default function ProductModal({
  productForm,
  onClose,
  // onSubmit,
  onChange,
}: ProductModalProps) {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [images, setImages] = useState<any[]>([]);
  const [variantImages, setVariantImages] = useState<any[]>([]);
  const [isLoadings, setIsLoading] = useState<any>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<any>({
    defaultValues: {
      name: '',
      price: 0,
      discountedPrice: undefined,
      description: '',
      images: [],
      varieties: [],
    },
  });

  const {
    fields: varietyFields,
    append: appendVariety,
    remove: removeVariety,
    replace
  } = useFieldArray({
    control,
    name: 'varieties',
  });

  const { data, isLoading } = useQuery({
    queryKey: ["getCategoriesWithSubcategoriesData", id],
    queryFn: () => getCategoriesWithSubcategoriesApi(`vendor/${id}/`),
  })

  const handleCategoryChange = (selectedOption: any) => {
    setValue('category', selectedOption?.value);
    // setValue('subcategory', null);
    const selectedCat = data?.data?.find((cat: any) => cat?.id === selectedOption?.value);
    setSubcategoryOptions(
      selectedCat?.subcategories?.map((sub: any) => ({
        value: sub?.id,
        label: sub?.name
      })) || []
    );
  };

  const categoryOptions = data?.data?.map((cat: any) => ({
    value: cat?.id,
    label: cat?.name
  })) || [];

  useEffect(() => {
    if (!subcategoryOptions.length && productForm?.category && data?.data?.length > 0) {
      handleCategoryChange({ value: productForm.category });
    }
  }, [productForm?.category, data]);


  useEffect(() => {
    if (productForm?.variants) {
      replace(productForm.variants.map((item: any) => ({
        id: item.id,
        product_variant_title: item.product_variant_title,
        product_variant_description: item.product_variant_description,
        product_variant_sku: item.product_variant_sku,
        product_variant_price: item.product_variant_price,
        product_variant_weight: item.product_variant_weight,
        product_variant_length: item.product_variant_length,
        product_variant_breadth: item.product_variant_breadth,
        product_variant_height: item.product_variant_height,
        product_variant_discount: item.product_variant_discount,
        product_variant_stock_quantity: item.product_variant_stock_quantity,
        product_variant_image_urls: item.product_variant_image_urls || [],
        sizes: item.sizes || []
      })));
    }
  }, [productForm]);


  useEffect(() => {
    setValue('name', productForm?.name);
    setValue('slug_name', productForm?.slug_name);
    setValue('price', productForm?.price);
    setValue('discount', productForm?.discount);
    setValue('category', productForm?.category);
    setValue('subcategory', productForm?.subcategory);
    setValue('brand_name', productForm?.brand_name);
    setValue('commission', productForm?.commission);

    setValue('cost', productForm?.cost);
    setValue('weight', productForm?.weight);
    setValue('length', productForm?.length);
    setValue('breadth', productForm?.breadth);
    setValue('height', productForm?.height);

    setValue('sku', productForm?.sku);
    setValue('stock_quantity', productForm?.stock_quantity);
    setValue('description', productForm?.description);
    setValue('description_2', productForm?.description_2);
    setValue('keywords', productForm?.keywords);
    setValue('meta_tax', productForm?.meta_tax);
    setValue('image_urls', setImages(productForm?.image_urls?.map((item: any) => { return item })));
    setValue('is_featured', productForm?.is_featured);

    if (productForm?.variants) {
      productForm.variants.forEach((item: any, index: number) => {
        setValue(`varieties.${index}.id`, item?.id);
        setValue(`varieties.${index}.product_variant_title`, item?.product_variant_title);
        setValue(`varieties.${index}.product_variant_description`, item?.product_variant_description);
        setValue(`varieties.${index}.product_variant_sku`, item?.product_variant_sku);
        setValue(`varieties.${index}.product_variant_price`, item?.product_variant_price);
        setValue(`varieties.${index}.product_variant_weight`, item?.product_variant_weight);
        setValue(`varieties.${index}.product_variant_length`, item?.product_variant_length);
        setValue(`varieties.${index}.product_variant_breadth`, item?.product_variant_breadth);
        setValue(`varieties.${index}.product_variant_height`, item?.product_variant_height);
        setValue(`varieties.${index}.product_variant_discount`, item?.product_variant_discount);
        setValue(`varieties.${index}.product_variant_stock_quantity`, item?.product_variant_stock_quantity);
        // setValue(`varieties.${index}.product_variant_image_urls`, setVariantImages(item?.product_variant_image_urls?.map((item: any) => { return item })));
        setValue(
          `varieties.${index}.product_variant_image_urls`,
          setVariantImages((prev) => ({
            ...prev,
            [index]: item?.product_variant_image_urls || [],
          }))
        );

        if (item?.sizes) {
          item.sizes.forEach((sizeItem: any, sizeIndex: number) => {
            setValue(`varieties.${index}.sizes.${sizeIndex}.id`, sizeItem?.id);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size`, sizeItem?.product_size);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_price`, sizeItem?.product_size_price);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_breadth`, sizeItem?.product_size_breadth);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_discount`, sizeItem?.product_size_discount);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_height`, sizeItem?.product_size_height);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_length`, sizeItem?.product_size_length);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_sku`, sizeItem?.product_size_sku);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_stock_quantity`, sizeItem?.product_size_stock_quantity);
            setValue(`varieties.${index}.sizes.${sizeIndex}.product_size_weight`, sizeItem?.product_size_weight);
          });
        }
      });
    }
  }, [productForm]);

  const onSubmit = async (data: any) => {
    console.log(data)
    // setIsLoading(true);
    setErrorMessage('');

    const payloadUpdate = {
      product: {
        ...(productForm ? '' : { vendor: id }),
        name: data?.name,
        slug_name: data?.slug_name,
        brand_name: data?.brand_name,
        description: data?.description,
        description_2: data?.description_2,
        // commission: data?.commission ? data?.commission : 1,
        // cost: data?.cost ? data?.cost : 1,
        commission: data?.price,
        cost: data?.price,
        sku: data?.sku,
        price: data?.price,
        weight: data?.weight,
        length: data?.length,
        breadth: data?.breadth,
        height: data?.height,
        discount: data?.discount,
        stock_quantity: data?.stock_quantity,
        ...(data?.category && { category: data?.category }),
        ...(data?.subcategory && { subcategory: data?.subcategory }),
        keywords: data.keywords,
        meta_tax: data.meta_tax,
        is_featured: true,
        ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),

        status: true,
        image_urls: images?.map((item: any) =>
          item?.url ? item?.url : item
        ),

        variant: data?.varieties?.map((item: any, index: number) => ({
          id: item?.id,
          product_variant_breadth: item?.product_variant_breadth,
          product_variant_description: item?.product_variant_description,
          product_variant_discount: item?.product_variant_discount,
          product_variant_height: item?.product_variant_height,
          product_variant_length: item?.product_variant_length,
          product_variant_price: item?.product_variant_price,
          product_variant_sku: item?.product_variant_sku,
          product_variant_stock_quantity: item?.product_variant_stock_quantity,
          product_variant_title: item?.product_variant_title,
          product_variant_weight: item?.product_variant_weight,
          ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),
          variant_image_urls: (variantImages[index] || []).map((img: any) =>
            img?.url ? img.url : img
          ),
          size: item?.sizes?.map((sizeItem: any) => ({
            id: sizeItem?.id,
            product_size: sizeItem?.product_size,
            product_size_price: sizeItem?.product_size_price,
            product_size_breadth: item?.product_variant_breadth,
            product_size_discount: item?.product_variant_discount,
            product_size_height: item?.product_variant_height,
            product_size_length: item?.product_variant_length,
            // product_size_sku: item?.product_variant_sku,
            product_size_stock_quantity: item?.product_variant_stock_quantity,
            product_size_weight: item?.product_variant_weight,
            ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),
          })),
        })),
      }
    };
    const payload = {
      product: {
        ...(productForm ? '' : { vendor: id }),
        name: data?.name,
        slug_name: data?.slug_name,
        brand_name: data?.brand_name,
        description: data?.description,
        description_2: data?.description_2,
        // commission: data?.commission,
        // cost: data?.cost,
        commission: data?.price,
        cost: data?.price,
        sku: data?.sku,
        price: data?.price,
        weight: data?.weight,
        length: data?.length,
        breadth: data?.breadth,
        height: data?.height,
        discount: data?.discount,
        stock_quantity: data?.stock_quantity,
        ...(productForm
          ? {}
          : {
            ...(data?.category && { category: data?.category }),
            ...(data?.subcategory && { subcategory: data?.subcategory }),
          }),
        keywords: data?.keywords,
        meta_tax: data?.meta_tax,
        is_featured: !!data?.is_featured,
        ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),

        status: true,
        product_image_urls: images?.map((item: any) =>
          item?.url ? item?.url : item
        ),
        variant: data?.varieties?.map((item: any, index: number) => ({
          id: item?.id,
          product_variant_breadth: item?.product_variant_breadth,
          product_variant_description: item?.product_variant_description,
          product_variant_discount: item?.product_variant_discount,
          product_variant_height: item?.product_variant_height,
          product_variant_length: item?.product_variant_length,
          product_variant_price: item?.product_variant_price,
          product_variant_sku: item?.product_variant_sku,
          product_variant_stock_quantity: item?.product_variant_stock_quantity,
          product_variant_title: item?.product_variant_title,
          product_variant_weight: item?.product_variant_weight,
          ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),
          variant_image_urls: (variantImages[index] || []).map((img: any) =>
            img?.url ? img.url : img
          ),
          size: item?.sizes?.map((sizeItem: any) => ({
            id: sizeItem?.id,
            product_size: sizeItem?.product_size,
            product_size_price: sizeItem?.product_size_price,
            product_size_breadth: item?.product_variant_breadth,
            product_size_discount: item?.product_variant_discount,
            product_size_height: item?.product_variant_height,
            product_size_length: item?.product_variant_length,
            // product_size_sku: item?.product_variant_sku,
            product_size_stock_quantity: item?.product_variant_stock_quantity,
            product_size_weight: item?.product_variant_weight,
            ...(productForm ? { updated_by: "vendor" } : { created_by: "vendor" }),
          })),
        })),
      },
    };

    try {
      let updateApi;
      if (productForm) {
        updateApi = await updateProductVariantSizesapi(productForm?.id, payloadUpdate);
        toast.success("Product updated successfully!");
      } else {
        updateApi = await postProductVariantSizesCreateApi('', payload);
        toast.success("Product created successfully!");
      }

      if (updateApi) {
        queryClient.invalidateQueries(['getProductData'] as InvalidateQueryFilters);
        onClose();

      } else {
        throw new Error('Something went wrong. Please try again.');
      }
    } catch (error: any) {
      if (error?.response?.data?.error) {
        const errObj = error.response.data.error;

        // First key and its first message
        const [key, value] = Object.entries(errObj)[0] || [];
        const firstMessage = Array.isArray(value) ? value[0] : value;

        setErrorMessage(`${key}: ${firstMessage}`);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            <h1 className='font-bold'>{productForm ? 'Edit Products' : 'Products Create'}</h1>
            <div className='grid grid-cols-1 gap-2'>
              <div className='col-span-6 lg:col-span-6'>
                <Input label="Name" required {...register('name', { required: true })} />
              </div>
              <div className='col-span-6 lg:col-span-6'>
                <Input label="Slug Name" required {...register('slug_name', { required: true })} />
              </div>
              <div className='col-span-12 lg:col-span-12'>
                <ImageUpload images={images} onChange={setImages} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" label="Selling Price" {...register('price', { required: true })} />

              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" label="MRP Price" {...register('discount', { required: true })} />
              </div>

              {/* Category Dropdown */}
              <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6">
                <label className="block text-sm font-bold  mb-1">Category <span className="text-red-500 ml-1">*</span></label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={categoryOptions}
                      placeholder="Select Category"
                      onChange={handleCategoryChange}
                      value={categoryOptions.find((opt: any) => opt.value === field.value) || null}
                    />
                  )}
                />
              </div>

              {/* Subcategory Dropdown */}
              <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6">
                <label className="block text-sm font-bold  mb-1">subcategory</label>
                <Controller
                  name="subcategory"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={subcategoryOptions}
                      placeholder="Select Subcategory"
                      isDisabled={!subcategoryOptions.length}
                      value={subcategoryOptions.find((opt: any) => opt.value === field.value) || null}
                      onChange={(selected: any) => setValue('subcategory', selected?.value)}
                    />
                  )}
                />
              </div>
              {/* </div> */}
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required label="Brand Name" {...register('brand_name', { required: true })} />
              </div>
              {/* <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" label="Commission" {...register('commission', { required: true })} />
              </div> */}
              {/* <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" label="Cost" {...register('cost', { required: true })} />
              </div> */}
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" step="any" label="Weight (in KG)" {...register('weight', { required: true })} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" step="any" label="Length (in CM)" {...register('length', { required: true })} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" step="any" label="Breadth (in CM)" {...register('breadth', { required: true })} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" step="any" label="Height (in CM)" {...register('height', { required: true })} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required label="SKU" {...register('sku', { required: true })} />
              </div>
              <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                <Input required type="number" label="Stock Quantity" {...register('stock_quantity', { required: true })} />
              </div>
              <div className='col-span-12 lg:col-span-12'>
                <label className="block text-sm font-bold  mb-1">Description <span className="text-red-500 ml-1">*</span></label>
                <Controller
                  name="description"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <ReactQuill
                      {...field}
                      onChange={(value) => field.onChange(value)} // important
                      value={field.value}
                      theme="snow"
                    />
                  )}
                />
              </div>
              <div className='col-span-12 lg:col-span-12'>
                <label className="block text-sm font-bold  mb-1">Meta Description</label>
                <textarea
                  {...register("description_2", {
                    setValueAs: (value) =>
                      typeof value === "string" ? value.trim() : "", // ✅ always return string
                  })}
                  rows={3}
                  placeholder="Meta Description"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {/* description_2 */}
              <div className='col-span-12 lg:col-span-6'>
                <label className="block text-sm font-bold  mb-1">Keywords</label>
                <textarea
                  {...register('keywords', {
                    setValueAs: (value) =>
                      typeof value === 'string'
                        ? value.split(',').map((kw) => kw.trim()).filter(Boolean)
                        : Array.isArray(value)
                          ? value
                          : [],

                  })}
                  rows={3}
                  placeholder="e.g. dairy, milk"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className='col-span-12 lg:col-span-6'>
                <label className="block text-sm font-bold  mb-1">Meta Tag</label>
                <textarea
                  {...register('meta_tax', {
                    setValueAs: (value) =>
                      typeof value === 'string'
                        ? value.split(',').map((kw) => kw.trim()).filter(Boolean)
                        : Array.isArray(value)
                          ? value
                          : [],

                  })}
                  rows={3}
                  placeholder="e.g. dairy, milk"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

            </div>

            <div>

              {varietyFields?.map((variety, varietyIndex: number) => (
                <div key={variety.id} className="border rounded-lg p-4 mb-3 relative space-y-4">
                  <div className='flex justify-betweens'>
                    <div className="flex justify-between items-center mb-4">
                      <h1 className='font-bold'>Varieties {varietyIndex + 1}</h1>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariety(varietyIndex)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className='grid grid-cols-1 gap-2'>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Variant Title */}
                      <Input
                        required
                        label="Product Variant Title"
                        {...register(`varieties.${varietyIndex}.product_variant_title`, { required: true })}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_title && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_title?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 lg:col-span-12'>
                      {/* Image Upload */}
                      {/* <ImageUpload images={variantImages} onChange={setVariantImages} /> */}
                      <ImageUpload
                        required
                        images={variantImages[varietyIndex] || []}
                        onChange={(images) => {
                          setVariantImages((prev) => ({
                            ...prev,
                            [varietyIndex]: images,
                          }));
                        }}
                        multiple
                        label="Variety Images"
                      />

                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Variant Description */}
                      <Input
                        required
                        label="Product Variant Description"
                        {...register(`varieties.${varietyIndex}.product_variant_description`, { required: true })}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_description && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_description?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* SKU */}
                      <Input
                        required
                        label="SKU"
                        {...register(`varieties.${varietyIndex}.product_variant_sku`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_sku && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_sku?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Price */}
                      <Input
                        required
                        type="number"
                        step="0.01"
                        label="Price"
                        {...register(`varieties.${varietyIndex}.product_variant_price`, { required: true })}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_price && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_price?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Discount */}
                      <Input
                        required
                        type="number"
                        label="MRP Price"
                        {...register(`varieties.${varietyIndex}.product_variant_discount`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_discount && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_discount?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Weight */}
                      <Input
                        required
                        label="Weight (Kg)"
                        type="number"
                        step="0.01"
                        {...register(`varieties.${varietyIndex}.product_variant_weight`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_weight && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_weight?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Length */}
                      <Input
                        required
                        label="Length (Cm)"
                        type="number"
                        {...register(`varieties.${varietyIndex}.product_variant_length`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_length && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_length?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Breadth */}
                      <Input
                        required
                        label="Breadth (Cm)"
                        type="number"
                        {...register(`varieties.${varietyIndex}.product_variant_breadth`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_breadth && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_breadth?.message}
                          </p>
                        )
                      }
                    </div>
                    <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      {/* Height */}
                      <Input
                        required
                        label="Height (Cm)"
                        type="number"
                        {...register(`varieties.${varietyIndex}.product_variant_height`)}
                      />
                      {Array.isArray(errors?.varieties) &&
                        errors?.varieties[varietyIndex]?.product_variant_height && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.varieties[varietyIndex].product_variant_height?.message}
                          </p>
                        )
                      }
                    </div>
                    {/* <div className='col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6'>
                      <Input
                        type="number"
                        label="Stock Quantity"
                        {...register(`varieties.${varietyIndex}.product_variant_stock_quantity`, { required: true })}
                      />
                    </div> */}
                  </div>

                  <SizeSection
                    control={control}
                    register={register}
                    varietyIndex={varietyIndex}
                  />
                </div>
              ))}

              <div className="flex justify-between items-center mb-4">
                <Button
                  type="button"
                  onClick={() => appendVariety({ color: '' })}
                  // variant="outline"
                  className="text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variety
                </Button>
              </div>
            </div>

            {errorMessage && (
              <p className="text-red-500 mt-2 text-end">{errorMessage}</p>
            )}
            <div className="flex justify-end gap-3">
              <Button className='flex gap-2' type="submit" disabled={isLoadings}>{productForm ? 'Edit Product' : 'Create Product'}
                {isLoadings && (<Loader2 className='mt-auto mb-auto animate-spin' />)}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}