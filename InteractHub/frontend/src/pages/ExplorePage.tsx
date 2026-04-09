import { useState } from "react";
import ExploreTabs from "../components/explore/ExploreTabs";
import ExploreCategoryCard from "../components/explore/ExploreCard";
import ExploreHashtagRow from "../components/explore/ExploreHashtagRow";
import ExploreReelCard from "../components/explore/ExploreReelCard";
import PageHeader from "../layouts/PageHeader";

type Tab = "posts" | "hashtags" | "reels";

const CATEGORIES = [
    { label: "Travel", color: "#b0c4de", badgeColor: "#1d4ed8" },
    { label: "Technology", color: "#2d3748", badgeColor: "#2563eb" },
    { label: "Fitness", color: "#1a202c", badgeColor: "#7c3aed" },
    { label: "Food", color: "#92400e", badgeColor: "#d97706" },
    { label: "Fashion", color: "#78716c", badgeColor: "#f59e0b" },
    { label: "Nature", color: "#365314", badgeColor: "#16a34a" },
];
const HASHTAGS = [
    { tag: "#Technology", postCount: "34.5k posts", color: "#dbeafe" },
    { tag: "#Travel", postCount: "28.2k posts", color: "#d1fae5" },
    { tag: "#Photography", postCount: "19.8k posts", color: "#fce7f3" },
    { tag: "#Fitness", postCount: "15.3k posts", color: "#fef3c7" },
    { tag: "#Food", postCount: "12.1k posts", color: "#ffedd5" },
];
const REELS = [
    { title: "Mountain Sunrise", color: "#374151" },
    { title: "Street Food Tour", color: "#78350f" },
    { title: "Morning Workout", color: "#1e3a5f" },
    { title: "City Lights", color: "#1a202c" },
    { title: "Ocean Waves", color: "#164e63" },
    { title: "Forest Walk", color: "#14532d" },
];

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("posts");

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
            {/* Header */}
            <PageHeader
                title="Explore"
                subtitle="Discover trending posts, hashtags, and reels from the community"
            />

            <ExploreTabs active={tab} onChange={setTab} />

            {tab === "posts" && (
                <div className="grid grid-cols-3 gap-2.5">
                    {CATEGORIES.map(c => (
                        <ExploreCategoryCard key={c.label} {...c} />
                    ))}
                </div>
            )}

            {tab === "hashtags" && (
                <div className="flex flex-col gap-2">
                    {HASHTAGS.map(h => (
                        <ExploreHashtagRow key={h.tag} {...h} />
                    ))}
                </div>
            )}

            {tab === "reels" && (
                <div className="grid grid-cols-3 gap-2">
                    {REELS.map(r => (
                        <ExploreReelCard key={r.title} {...r} />
                    ))}
                </div>
            )}
        </div>
    );
}