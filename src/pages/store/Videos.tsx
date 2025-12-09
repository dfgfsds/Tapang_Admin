import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus } from 'lucide-react'
import Button from '../../components/Button'
import Search from '../../components/Search'
import { baseUrl } from "../../Api-Service/ApiUrls";
import AddVideoModal from '../../components/Videos/AddVideoModal'
import { InvalidateQueryFilters, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
// import AddVideoModal from '../../components/videos/AddVideoModal'
// import ManageVideoModal from '../../components/videos/ManageVideoModal'


export default function Videos() {
    const {id}=useParams();
    const vendorId:any = id ;
    const [videos, setVideos] = useState<any[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null)
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<any>(null);
    const [editVideo, setEditVideo] = useState<any | null>(null);
    const queryClient = useQueryClient();

    // 🔹 Fetch Videos
    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${baseUrl}/video/?vendorId=${vendorId}`)
            if (res.data.success) setVideos(res.data.videos)
        } catch (err) {
            console.error('Error fetching videos', err)
        }
    }

    useEffect(() => {
        fetchVideos()
    }, [])

    // 🔹 Update Video
    const handleUpdateVideo = async (id: number, updates: { updated_by: string }) => {
        try {
            const res = await axios.put(`${baseUrl}/video/${id}/`, updates)
            if (res.data.success) {
                setVideos(prev =>
                    prev.map(video =>
                        video.id === id ? { ...video, ...res.data.video } : video
                    )
                )
                setSelectedVideo(null)
            }
        } catch (err) {
            console.error('Error updating video', err)
        }
    }

    // 🔹 Delete Video
    // const handleDelete = async (id: number) => {
    //     try {
    //         const res = await axios.delete(`${baseUrl}/video/${id}/`)
    //         if (res.data.success) {
    //             setVideos(prev => prev.filter(v => v.id !== id))
    //             setSelectedVideo(null)
    //         }
    //     } catch (err) {
    //         console.error('Error deleting video', err)
    //     }
    // }

    const filteredVideos = videos.filter(video =>
        video.created_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.thumbnail_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = async () => {
        try {
            const updateApi = await axios.delete(`${baseUrl}/video/${deleteId}/`)
            if (updateApi) {
                fetchVideos();
                toast.success("Video deleted successfully!");
                setDeleteModal(false);
                setDeleteId('');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Something went wrong. Please try again.!");
        } finally {
            setDeleteModal(false);
        }

    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Videos</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage all uploaded videos for this vendor
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Video
                        </Button>
                    </div>
                </div>

                <div className="mt-4 max-w-md">
                    <Search
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by creator, title, or thumbnail..."
                    />
                </div>

                <div className="mt-8 flex flex-col">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle">
                            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                S.No
                                            </th>
                                            {/* <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Thumbnail
                                            </th> */}
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Created At
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                View
                                            </th>
                                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredVideos.map((video, index) => (
                                            <tr key={video.id}>
                                                {/* 🔹 S.No */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {index + 1}
                                                </td>

                                                {/* 🔹 Thumbnail */}
                                                {/* <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {video.thumbnail_url ? (
                                                        <img
                                                            src={video.thumbnail_url}
                                                            alt="Thumbnail"
                                                            className="w-16 h-16 rounded-md object-cover border"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td> */}

                                                {/* 🔹 Created At */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {new Date(video.created_at).toLocaleDateString()}
                                                </td>

                                                {/* 🔹 View */}
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {video.thumbnail_url ? (
                                                        <a
                                                            href={video.thumbnail_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-900 underline"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </td>

                                                {/* 🔹 Edit / Delete Buttons */}
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditVideo(video)
                                                            setIsAddModalOpen(true)
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setDeleteId(video.id)
                                                            setDeleteModal(true)
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredVideos.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-6 text-gray-500 text-sm">
                                                    No videos found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <AddVideoModal
                    onClose={() => setIsAddModalOpen(false)}
                    setIsAddModalOpen={setIsAddModalOpen}
                    editVideo={editVideo}
                    vendor={vendorId}
                    fetchVideos={fetchVideos}
                />
            )}

            {/* {selectedVideo && (
        <ManageVideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onUpdate={handleUpdateVideo}
          onDelete={handleDeleteVideo}
        />
      )} */}

            {deleteModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
                        <p className="text-sm text-gray-600 mb-4">Are you sure you want to Delete <span className='font-bold'></span>?</p>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
