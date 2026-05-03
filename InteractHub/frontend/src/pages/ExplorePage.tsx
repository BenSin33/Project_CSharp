import { useState } from "react";
import ExploreTabs from "../components/explore/ExploreTabs";
import ExploreCategoryCard from "../components/explore/ExploreCard";
import ExploreHashtagRow from "../components/explore/ExploreHashtagRow";
import ExploreReelCard from "../components/explore/ExploreReelCard";
import PageHeader from "../layouts/PageHeader";
import { EXPLORE_CATEGORIES, EXPLORE_HASHTAGS, EXPLORE_REELS } from "../constants/mock";

type Tab = "posts" | "hashtags" | "reels";

export default function ExplorePage() {
    const [tab, setTab] = useState<Tab>("posts");

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <PageHeader
                title="Explore"
                subtitle="Discover trending posts, hashtags, and reels from the community"
            />

            <ExploreTabs active={tab} onChange={setTab} />

            {tab === "posts" && (
                <div className="grid grid-cols-3 gap-2.5">
                    {EXPLORE_CATEGORIES.map(c => (
                        <ExploreCategoryCard key={c.label} {...c} />
                    ))}
                </div>
            )}

            {tab === "hashtags" && (
                <div className="flex flex-col gap-2">
                    {EXPLORE_HASHTAGS.map(h => (
                        <ExploreHashtagRow key={h.tag} {...h} />
                    ))}
                </div>
            )}

            {tab === "reels" && (
                <div className="grid grid-cols-3 gap-2">
                    {EXPLORE_REELS.map(r => (
                        <ExploreReelCard key={r.title} {...r} />
                    ))}
                </div>
            )}
        </div>
    );
}