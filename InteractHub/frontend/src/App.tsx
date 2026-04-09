import { Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/Friends";
import ExplorePage from "./pages/ExplorePage";
import MessagesPage from "./pages/Messages";
import BookMarkPage from "./pages/BookmarkPage";
import { LoginFormPreview } from "./components/auth/LoginForm";
import { Settings } from "lucide-react";
import SettingsPage from "./pages/Settings";
function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginFormPreview />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="bookmarks" element={<BookMarkPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;