import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import TrendingHashtags from "../components/hashtag/TrendingHashtags";
import SuggestionPanel from "../components/suggestion/SuggestionPanel";
import CreatePostModal from "../components/post/CreatePostModal";
import NotificationPanel from "../components/notifications/NotificationPanel";
import { useNotifications } from "../hooks/useNotification";

function MainLayout() {
    const navigate = useNavigate();
    const [showPostModal, setShowPostModal] = useState(false);
    const { notifications, isOpen: showNotif, setIsOpen: setShowNotif, unreadCount, markAllRead } = useNotifications();
    const handleLogout = () => {
        localStorage.removeItem("token");  // hoặc authStore.logout()
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar
                onLogout={handleLogout}
                user={{ name: "Alex Kim", email: "demo@user.com" }}
                notificationCount={unreadCount}
                onSearch={(q) => navigate(`/search?q=${q}`)}
                onCreatePost={() => setShowPostModal(true)}
                onNotificationsClick={() => setShowNotif(v => !v)}  // ← thêm prop này vào Navbar
            />

            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-[220px_1fr_280px] gap-6 items-start">
                <aside className="sticky top-20"><Sidebar /></aside>
                <main className="flex flex-col gap-4 min-w-0"><Outlet /></main>
                <aside className="sticky top-20 flex flex-col gap-4">
                    <TrendingHashtags />
                    <SuggestionPanel />
                </aside>
            </div>

            <CreatePostModal
                isOpen={showPostModal}
                onClose={() => setShowPostModal(false)}
                onPost={(content, image) => console.log("post:", { content, image })}
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