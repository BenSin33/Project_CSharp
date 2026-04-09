import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import StoryBar from "../components/story/StoryBar";
import { PostCardDemo } from "../components/post/PostCard";
import Sidebar from "../components/layout/Sidebar";
import TrendingHashtags from "../components/hashtag/TrendingHashtags";
import SuggestionPanel from "../components/suggestion/SuggestionPanel";

import heroImg from "../assets/hero.png";
import reactLogo from "../assets/react.svg";
import viteLogo from "../assets/vite.svg";
import PageHeader from "../layouts/PageHeader";
import ExploreReelCard from "../components/explore/ExploreReelCard";
const REELS = [
    { title: "Mountain Sunrise", color: "#374151" },
    { title: "Street Food Tour", color: "#78350f" },
    { title: "Morning Workout", color: "#1e3a5f" },
    { title: "City Lights", color: "#1a202c" },
    { title: "Ocean Waves", color: "#164e63" },
    { title: "Forest Walk", color: "#14532d" },
];

function BookMarkPage() {
    const [view, setView] = useState<"grid" | "list">("list");
    const [isReel, setIsReel] = useState<boolean>(false)
    return (
        <>
            <PageHeader
                title="Bookmarks"
                subtitle="5 saved posts"
                viewToggle={{ view, onChange: setView }}
            />
            {view === "list" && <PostCardDemo isSaved={true} />}
            {view === "grid" && <div className="grid grid-cols-3 gap-2">
                {REELS.map(r => (
                    <ExploreReelCard key={r.title} {...r} />
                ))}
            </div>}
        </>

    );
}

export default BookMarkPage;