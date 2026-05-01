import { useState } from "react";
import PageHeader from "../layouts/PageHeader";
import PostCard from "../components/post/PostCard";
import ExploreReelCard from "../components/explore/ExploreReelCard";
import { SAVED_POSTS, EXPLORE_REELS } from "../constants/mock";
// Sample bookmark data — replace with real data from your store/API

function BookMarkPage() {
  const [view, setView] = useState<"grid" | "list">("list");

  const handleSave = (id: string) => {
    console.log("toggle save for post", id);
    // dispatch to your store or call your API here
  };

  return (
    <>
      <PageHeader
        title="Bookmarks"
        subtitle="5 saved posts"
        viewToggle={{ view, onChange: setView }}
      />

      {view === "list" && (
        <div className="flex flex-col gap-4 p-4">
          {SAVED_POSTS.map((post) => (
            <PostCard
              key={post.id}
              post={post}           // ✅ required prop
              onSave={handleSave}   // ✅ function, not a string
            />
          ))}
        </div>
      )}

      {view === "grid" && (
        <div className="grid grid-cols-3 gap-2">
          {EXPLORE_REELS.map((r) => (
            <ExploreReelCard key={r.title} {...r} />
          ))}
        </div>
      )}
    </>
  );
}

export default BookMarkPage;