// layouts/MainLayout.tsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import TrendingHashtags from "../components/hashtag/TrendingHashtags";
import SuggestionPanel from "../components/suggestion/SuggestionPanel";


function MainLayout() {
    const navigate = useNavigate();
    const [showPostModal, setShowPostModal] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <Navbar
                notificationCount={3}
                onSearch={(q) => navigate(`/search?q=${q}`)}
                onCreatePost={() => setShowPostModal(true)}
            />

            {/* Main 3-column grid */}
            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-[220px_1fr_280px] gap-6 items-start">

                {/* Left sidebar */}
                <aside className="sticky top-20">
                    <Sidebar />
                </aside>

                {/* Center feed */}
                <main className="flex flex-col gap-4 min-w-0">
                    <Outlet />
                </main>

                {/* Right panel */}
                <aside className="sticky top-20 flex flex-col gap-4">
                    <TrendingHashtags />
                    <SuggestionPanel />
                </aside>

            </div>
        </div>
    );
}

export default MainLayout;