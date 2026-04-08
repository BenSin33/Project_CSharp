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

function Home() {
    const navigate = useNavigate();
    const [showPostModal, setShowPostModal] = useState(false);

    return (
        <>
            <StoryBar
                onAddStory={() => navigate("/stories/create")}
                onViewStory={(s) => navigate(`/stories/${s.id}`)}
            />
            <PostCardDemo />
        </>

    );
}

export default Home;