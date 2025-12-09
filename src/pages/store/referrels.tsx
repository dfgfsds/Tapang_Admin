import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../Api-Service/ApiUrls";
import { useParams } from "react-router-dom";

interface Referral {
    id: number;
    referrer_data: {
        name: string;
        email: string;
        contact_number: string;
    };
    referee_data: {
        name: string;
        email: string;
        contact_number: string;
    };
    referral_code: string;
    referral_type: string;
    created_by: string;
    created_at: string;
}

const Referrals: React.FC = () => {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { id } = useParams<{ id: string }>(); // vendor_id

    // ✅ Fetch referrals from API
    const fetchReferrals = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await axios.get(`${baseUrl}/referral/?vendor_id=${id}`);
            setReferrals(res.data?.referrals || []);
        } catch (err) {
            setError("Failed to fetch referrals");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete referral
    const handleDelete = async (referralId: number) => {
        try {
            await axios.delete(`${baseUrl}/referral/${referralId}/`);
            fetchReferrals(); // refresh list
        } catch (err) {
            console.error("Failed to delete referral", err);
        }
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    return (
        <div className="mt-8 flex flex-col">
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle">
                    <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                        {loading ? (
                            <div className="text-center py-6 text-gray-500">Loading...</div>
                        ) : error ? (
                            <div className="text-center py-6 text-red-500">{error}</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">S.No</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referrer Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referrer Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referrer Contact</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referee Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referee Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referee Contact</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referral Code</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created By</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created At</th>
                                        <th className="px-3 py-3 text-sm font-semibold text-gray-900 text-center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {referrals.map((referral, index) => (
                                        <tr key={referral.id}>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{index + 1}</td>

                                            {/* Referrer */}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referrer_data?.name || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referrer_data?.email || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referrer_data?.contact_number || "-"}
                                            </td>

                                            {/* Referee */}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referee_data?.name || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referee_data?.email || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {referral.referee_data?.contact_number || "-"}
                                            </td>

                                            {/* Other Fields */}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{referral.referral_code}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-900">
                                                {referral.referral_type}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{referral.created_by}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {new Date(referral.created_at).toLocaleString()}
                                            </td>

                                            {/* Action */}
                                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                                <button
                                                    onClick={() => handleDelete(referral.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {referrals.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={12} className="text-center py-4 text-gray-500 text-sm">
                                                No referrals available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Referrals;
