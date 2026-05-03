import { Outlet } from "react-router-dom";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import TrendingHashtags from "../components/hashtag/TrendingHashtags";
import SuggestionPanel from "../components/suggestion/SuggestionPanel";
import CreatePostModal from "../components/post/CreatePostModal";
import NotificationPanel from "../components/notifications/NotificationPanel";
import { useNotifications } from "../hooks/useNotification";
import { useAuth } from "../contexts/AuthContext";
import { createPost } from "../services/postService";
import api from "../services/api";

function MainLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showPostModal, setShowPostModal] = useState(false);
    const { notifications, isOpen: showNotif, setIsOpen: setShowNotif, unreadCount, markAllRead } = useNotifications();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handlePost = useCallback(async (content: string, image?: File) => {
        if (!user) return;

        let imageUrl: string | undefined;
        if (image) {
            const form = new FormData();
            form.append("file", image);
            // KHÔNG set Content-Type thủ công — axios tự thêm boundary vào multipart/form-data
            const uploadResp = await api.post("/api/media/upload", form);
            // MediaController trả { success, message, url } — không có .data wrapper
            imageUrl = uploadResp.data?.url ?? uploadResp.data?.data?.url;
            if (!imageUrl) {
                console.error("[handlePost] Upload failed, response:", uploadResp.data);
                throw new Error("Tải ảnh lên thất bại");
            }
        }

        await createPost({
            userId: user.id,
            content: content,
            visibility: 0,
            mediaItems: imageUrl ? [{ url: imageUrl, mediaType: "image" }] : [],
        });

        window.dispatchEvent(new Event("post-created"));
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar
                onLogout={handleLogout}
                user={user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl } : { name: "", email: "" }}
                notificationCount={unreadCount}
                onSearch={(q) => navigate(`/search?q=${q}`)}
                onCreatePost={() => setShowPostModal(true)}
                onNotificationsClick={() => setShowNotif(v => !v)}
            />

            <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-10 flex gap-5 items-start">
                {/* Left Sidebar */}
                <aside className="w-[220px] shrink-0 sticky top-20">
                    <Sidebar currentUser={user ? { name: user.name, avatarUrl: user.avatarUrl } : undefined} />
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <Outlet />
                </main>

                {/* Right Sidebar */}
                <aside className="w-[260px] shrink-0 sticky top-20 flex flex-col gap-4">
                    <TrendingHashtags />
                    <SuggestionPanel />
                </aside>
            </div>

            <CreatePostModal
                isOpen={showPostModal}
                onClose={() => setShowPostModal(false)}
                onPost={handlePost}
                user={user ? { name: user.name, username: "@" + user.username, avatarUrl: user.avatarUrl } : undefined}
            />

            <NotificationPanel
                isOpen={showNotif}
                onClose={() => setShowNotif(false)}
                notifications={notifications}
                onMarkAllRead={markAllRead}
            />
        </div>
    );
}

export default MainLayout;