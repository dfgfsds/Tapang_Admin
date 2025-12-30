import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import Button from '../Button';
import OrderStatusBadge from './OrderStatusBadge';
import { getOrderItemsApi, patchOrderStatusApi } from '../../Api-Service/Apis';
import { InvalidateQueryFilters, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { baseUrl } from '../../Api-Service/ApiUrls';
import formatDateTime from '../../lib/utils';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  const queryClient = useQueryClient();
  const { id } = useParams()
  // getOrderItemsApi

  const [pdfLinks, setPdfLinks] = useState<{
    manifest?: string;
    label?: string;
    invoice?: string;
  }>({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [pickupDone, setPickupDone] = useState(false);

  // const vendorId = 63;

  const API_BASE_URL = baseUrl;

  const { data, isLoading, error } = useQuery({
    queryKey: ["getOrderItemsData", order?.user, order?.vendor, order?.id],
    queryFn: () => getOrderItemsApi(`?user_id=${order?.user}&vendor_id=${order?.vendor}&order_id=${order?.id}`),
  })

  // Format a Date → "YYYY-MM-DD" in local time (no UTC shift issues)
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Date range: today → today + 10 days
  const today = new Date();
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 10);

  const minDate = formatYMD(today);
  const maxDate = formatYMD(maxDateObj);

  const [pickupDate, setPickupDate] = useState<string>(minDate);


  const handleUpadteStatus = async (val: any) => {
    try {
      const updateApi = await patchOrderStatusApi(order?.id,
        {
          status: val,
          updated_by: "vendor"
        }
      )
      if (updateApi) {
        queryClient.invalidateQueries(['getProductData'] as InvalidateQueryFilters);
      }
    } catch (error) {

    }
  }

  /** ✅ Shiprocket API Action */
  const handleShiprocketAction = async (action: string, pickupDate?: string) => {
    try {
      setLoadingAction(true);
      let url = "";
      let payload: any = { vendor_id: id };

      if (action === "pickup") {
        // Enforce pickup date range safety
        if (!pickupDate) {
          alert("Please select a pickup date.");
          return;
        }
        // Validate within allowed window
        const picked = new Date(pickupDate + "T00:00:00"); // local-safety parse
        const min = new Date(minDate + "T00:00:00");
        const max = new Date(maxDate + "T23:59:59");

        if (picked < min || picked > max) {
          alert(`Pickup date must be between ${minDate} and ${maxDate}.`);
          return;
        }

        url = `${API_BASE_URL}/orders/${order?.id}/shiprocket-pickup-request/`;
        payload.pickup_date = pickupDate; // <-- use user selection
      } else if (action === "manifest") {
        url = `${API_BASE_URL}/orders/${order?.id}/shiprocket-generate-manifest/`;
      } else if (action === "manifest-print") {
        url = `${API_BASE_URL}/orders/${order?.id}/shiprocket-manifest/print/`;
      } else if (action === "label") {
        url = `${API_BASE_URL}/orders/${order?.id}/shiprocket-generate-label/`;
      } else if (action === "invoice") {
        url = `${API_BASE_URL}/orders/${order?.id}/shiprocket-generate-invoice/`;
      } else {
        alert("Invalid action");
        return;
      }

      const response = await axios.post(url, payload);

      if (action === "pickup" && response.data.success) {
        setPickupDone(true);
      }

      if (response.data?.data?.manifest_url) {
        setPdfLinks((prev) => ({ ...prev, manifest: response.data.data.manifest_url }));
      }
      if (response.data?.data?.label_url) {
        setPdfLinks((prev) => ({ ...prev, label: response.data.data.label_url }));
      }
      if (response.data?.data?.invoice_url) {
        setPdfLinks((prev) => ({ ...prev, invoice: response.data.data.invoice_url }));
      }

      alert(response.data.message);
    } catch (error: any) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoadingAction(false);
    }
  };



  const generateShippingAddressHTML = () => {
    const addr = data?.data?.consumer_address;

    const now = new Date();
    const formattedDate = now.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #111;
    }

    /* 🔥 TOP HEADER */
    .page-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .page-header .brand {
      font-size: 16px;
      font-weight: bold;
    }

    .page-header .datetime {
      font-size: 11px;
      color: #555;
      margin-top: 4px;
    }

    .invoice-box {
      border: 1px solid #ccc;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    .title {
      font-size: 18px;
      font-weight: bold;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 6px;
    }

    .footer {
      margin-top: 30px;
      font-size: 11px;
      text-align: center;
      color: #666;
    }
  </style>
</head>

<body>

  <!-- ✅ CENTER HEADER -->
  <div class="page-header">
    <div class="brand">Syed Gifts</div>
    <div class="datetime">${formattedDate}</div>
  </div>

  <div class="invoice-box">
    <div class="header">
      <div class="title">Shipping Address</div>
      <div>Order #${data?.data?.id}</div>
    </div>

    <div class="section-title">Deliver To</div>
    <p>
      <strong>${addr?.customer_name}</strong><br/>
      ${addr?.address_line1}<br/>
      ${addr?.city}, ${addr?.state} ${addr?.zipCode}<br/>
      ${addr?.country} - ${addr?.postal_code}<br/><br/>
      Phone: ${addr?.contact_number}<br/>
      Email: ${addr?.email_address}
    </p>

    <div class="footer">
      This is a system generated shipping document.
    </div>
  </div>

</body>
</html>
`;
  };



  const handleDownloadShippingAddress = () => {
    const html = generateShippingAddressHTML();

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
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
          {isLoading ? (
            <>
              <div className="sm:flex sm:items-start animate-pulse">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>

                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-6 w-20 bg-gray-300 rounded"></div>
                    </div>

                    <div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-300 rounded"></div>
                    </div>

                    <div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>

                    <div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>

                    <div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                      <div className="divide-y divide-gray-200">
                        {[...Array(3)].map((_, idx) => (
                          <div key={idx} className="py-3 flex justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-300 rounded mr-3"></div>
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-300 rounded w-32"></div>
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <div className="h-4 bg-gray-300 rounded w-12"></div>
                              <div className="h-4 bg-gray-300 rounded w-16"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-base font-medium">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Order #{data?.data?.id}
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <OrderStatusBadge status={data?.data?.status} />
                    </div>

                    {!(data?.data?.status === 'Cancelled/Refunded') && (
                      <div>
                        <label className="block text-md mb-2 font-medium text-black">Update Status</label>
                        <select
                          className="mt-1 block w-auto p-2 rounded-md border-black border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={data?.data?.status}
                          onChange={(e) => handleUpadteStatus(e.target.value)}
                        >
                          {["Pending", "Shipped", "Cancelled", "Delivered", "Out For Delivery", "Cancelled/Refunded", "Processing"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Customer Details</h4>
                      <div className="mt-2 text-sm">
                        <p>{data?.data?.consumer_address?.customer_name}</p>
                        <p>{data?.data?.consumer_address?.email_address}</p>
                        <p>{data?.data?.consumer_address?.contact_number}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      {/* HEADER */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">
                          Shipping Address
                        </h4>

                        <Button
                          variant="outline"
                          // size="sm"
                          onClick={handleDownloadShippingAddress}
                          className="flex items-center gap-2 text-xs"
                        >
                          ⬇ Download
                        </Button>
                      </div>

                      {/* ADDRESS */}
                      <div className="text-sm text-gray-700 leading-relaxed">
                        <p className="font-medium text-gray-900">
                          {data?.data?.consumer_address?.customer_name}
                        </p>

                        <p>
                          {data?.data?.consumer_address?.address_line1}
                          {data?.data?.consumer_address?.address_line2
                            ? `, ${data?.data?.consumer_address?.address_line2}`
                            : ""}
                        </p>

                        <p>
                          {data?.data?.consumer_address?.city},{" "}
                          {data?.data?.consumer_address?.state}{" "}
                          {data?.data?.consumer_address?.zipCode}
                        </p>

                        <p>
                          {data?.data?.consumer_address?.country} -{" "}
                          {data?.data?.consumer_address?.postal_code}
                        </p>

                        {/* CONTACT */}
                        <div className="mt-2 text-xs text-gray-500">
                          {data?.data?.consumer_address?.contact_number}
                        </div>
                      </div>
                    </div>


                    <div>
                      <h4 className="font-medium text-sm text-black">Order Items</h4>
                      <div className="mt-2 divide-y divide-gray-200">
                        {data?.data?.order_items?.map((item: any) => (
                          <div key={item.id} className="py-3 flex justify-between">
                            <div className="flex items-center">
                              {item.product_details?.image_urls[0] && (
                                <img src={item?.product_details.image_urls[0]} className="h-10 w-10 rounded object-cover mr-3" />
                              )}
                              <div className="text-sm">
                                <p className="font-medium">{item?.product_details?.name}</p>
                              </div>
                            </div>
                            <div className="text-sm text-right">
                              <p>₹{item.price} × {item.quantity}</p>
                              <p className="font-medium">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div>
                      {/* 💰 Price Summary Section */}
                      <div className="border-t pt-4 mt-4 bg-gray-50 p-4 rounded-lg shadow-sm space-y-2">
                        {/* Subtotal */}
                        <div className="flex justify-between text-sm md:text-base font-medium text-gray-700">
                          <p>Subtotal</p>
                          <p>
                            ₹
                            {data?.data?.order_items
                              ?.reduce(
                                (acc: number, item: any) => acc + parseFloat(item.price) * item.quantity,
                                0
                              )
                              ?.toFixed(2) || 0}
                          </p>
                        </div>



                        {/* Delivery Charge */}
                        {data?.data?.delivery_charge && (
                          <div className="flex justify-between text-sm md:text-base text-gray-600">
                            <p>Delivery Charge</p>
                            <p>₹{parseFloat(data?.data?.delivery_charge || "0").toFixed(2)}</p>
                          </div>
                        )}


                        {/* COD Charge */}
                        {parseFloat(data?.data?.cod_charges || "0") > 0 && (
                          <div className="flex justify-between text-sm md:text-base text-gray-600">
                            <p>COD Charges</p>
                            <p>₹{parseFloat(data?.data?.cod_charges || "0").toFixed(2)}</p>
                          </div>
                        )}

                        {/* Delivery Discount (if available) */}
                        {parseFloat(data?.data?.delivery_discount || "0") > 0 && (
                          <div className="flex justify-between text-sm md:text-base text-gray-600">
                            <p>Delivery Discount</p>
                            <p className="text-red-500">-₹{data?.data.delivery_discount}</p>
                          </div>
                        )}
                        {/* Discount */}
                        {data?.data?.discount && data?.data?.discount > 0 && (
                          <div className="flex justify-between text-sm md:text-base text-gray-600">
                            <p>Discount</p>
                            <p className="text-red-500">
                              -₹{parseFloat(data?.data?.discount || "0").toFixed(2)}
                            </p>
                          </div>
                        )}


                        <hr className="my-2 border-gray-300" />

                        {/* Total */}
                        <div className="flex justify-between text-base md:text-lg font-semibold text-gray-900">
                          <p>Total</p>
                          <p>₹{parseFloat(data?.data?.total_amount || "0").toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium">Payment Status</span>
                      <div className={`px-3 py-1 text-sm rounded-lg uppercase font-semibold tracking-wide 
            ${data?.data?.payment_status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {data?.data?.payment_status}
                      </div>
                    </div>


                    {/* Dates */}
                    <div className="flex justify-between gap-2 flex-wrap text-sm text-gray-500 mt-1 mb-2">
                      <p className='font-bold text-black'>Created: <span className='text-gray-500'>{formatDateTime(data?.data?.created_at)}</span></p>
                      <p className='font-bold text-black'>Updated: <span className='text-gray-500'>{formatDateTime(data?.data?.updated_at)}</span></p>
                    </div>

                  </div>
                </div>
              </div>
              {/* Shiprocket Actions */}
              {data?.data?.delivery_partner === 'shiprocket' && data?.data?.status === 'Pending' && (
                <>
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-sm text-gray-700">Shiprocket</h4>


                    <div className="flex items-center gap-2">
                      <label htmlFor="pickup-date" className="text-md text-gray-600">
                        Pickup Date
                      </label>
                      <input
                        id="pickup-date"
                        type="date"
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={pickupDate}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        onClick={() => handleShiprocketAction("pickup", pickupDate)}
                        disabled={loadingAction || data?.data?.status !== 'Pending'}
                      >
                        Request Pickup
                      </Button>
                      <Button
                        onClick={() => handleShiprocketAction("manifest")}
                        disabled={data?.data?.status === 'Pending' || loadingAction}
                      >
                        Generate Manifest
                      </Button>
                      <Button
                        onClick={() => handleShiprocketAction("label")}
                        disabled={data?.data?.status === 'Pending' || loadingAction}
                      >
                        Generate Label
                      </Button>
                      <Button
                        onClick={() => handleShiprocketAction("invoice")}
                        disabled={data?.data?.status === 'Pending' || loadingAction}
                      >
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </>)}
              {/* Show Links */}
              {(
                data?.data?.delivery_partner === 'shiprocket' &&
                (
                  data?.data?.status === 'Shipped' ||
                  data?.data?.status === 'Out For Delivery' ||
                  data?.data?.status === 'Processing'
                )
              ) && (
                  <>
                    <div className="mt-4">
                      {pdfLinks.manifest && (
                        <p>
                          Manifest:{" "}
                          <a
                            href={pdfLinks.manifest}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            Download
                          </a>
                        </p>
                      )}
                      {pdfLinks.label && (
                        <p>
                          Label:{" "}
                          <a
                            href={pdfLinks.label}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            Download
                          </a>
                        </p>
                      )}
                      {pdfLinks.invoice && (
                        <p>
                          Invoice:{" "}
                          <a
                            href={pdfLinks.invoice}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            Download
                          </a>
                        </p>
                      )}
                    </div>
                  </>)}
            </>
          )}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}