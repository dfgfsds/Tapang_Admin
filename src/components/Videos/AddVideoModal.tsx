import React, { useEffect, useState } from "react";
import Button from "../Button";
import axios from "axios";
import { baseUrl } from "../../Api-Service/ApiUrls";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

// ✅ Validation Schema
const videoSchema = Yup.object().shape({
    thumbnail_url: Yup.string()
        .url("Enter a valid URL")
        .required("Thumbnail URL is required"),
});

interface AddVideoModalProps {
    onClose: () => void;
    vendor: number;
    setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editVideo: any;
    fetchVideos: any;
}

export default function AddVideoModal({
    onClose,
    vendor,
    setIsAddModalOpen,
    editVideo,
    fetchVideos,
}: AddVideoModalProps) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(videoSchema),
        defaultValues: {
            thumbnail_url: "",
        },
    });

    // 🔹 Set default values when editing
    useEffect(() => {
        if (editVideo) {
            setValue("thumbnail_url", editVideo.thumbnail_url || "");
        }
    }, [editVideo, setValue]);

    // 🔹 Create Video
    const handleAddVideo = async (data: any) => {
        setLoading(true);
        setErrorMessage("");

        try {
            if (editVideo) {
                const res = await axios.put(`${baseUrl}/video/${editVideo.id}/`, {
                    updated_by: "admin",
                    thumbnail_url: data.thumbnail_url,
                    vendor,
                });

                if (res?.data) {
                    setIsAddModalOpen(false);
                    reset();
                    fetchVideos();
                } else {
                    setErrorMessage(res.data.message || "Failed to update video");
                }
            } else {
                const res = await axios.post(`${baseUrl}/video/`, {
                    created_by: "admin",
                    thumbnail_url: data.thumbnail_url,
                    vendor,
                });

                if (res.data) {
                    setIsAddModalOpen(false);
                    reset();
                    fetchVideos();
                } else {
                    setErrorMessage(res.data.message || "Failed to create video");
                }
            }
        } catch (err: any) {
            setErrorMessage(
                err.response?.data?.message || "Something went wrong while saving."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Add New Video</h2>

                <form onSubmit={handleSubmit(handleAddVideo)}>
                    <label className="block text-sm font-medium mb-1">
                        Thumbnail URL
                    </label>
                    <input
                        {...register("thumbnail_url")}
                        className="w-full border rounded-lg px-3 py-2 mb-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="https://example.com/video-thumbnail.jpg"
                    />
                    {errors.thumbnail_url && (
                        <p className="text-red-500 text-sm mb-2">
                            {errors.thumbnail_url.message}
                        </p>
                    )}

                    {errorMessage && (
                        <div className="text-red-600 text-sm mb-2">{errorMessage}</div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
