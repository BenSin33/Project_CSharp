import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/Friends";
import ExplorePage from "./pages/ExplorePage";
import MessagesPage from "./pages/Messages";
import BookMarkPage from "./pages/BookmarkPage";
import SettingsPage from "./pages/Settings";
import AuthPage from "./pages/AuthPage";
import SearchPage from "./pages/SearchPage";
import { useAuth } from "./contexts/AuthContext";
import AdminPage from "./pages/AdminPage";

// Guard route: chỉ cho vào nếu đã login
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // Chờ khôi phục session
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!user?.roles?.includes("Admin")) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage />} />
      <Route path="auth"  element={<AuthPage />} />
      <Route path="/" element={
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      }>
        <Route index element={<Home />} />
        <Route path="profile"   element={<ProfilePage />} />
        <Route path="friends"   element={<FriendsPage />} />
        <Route path="explore"   element={<ExplorePage />} />
        <Route path="messages"  element={<MessagesPage />} />
        <Route path="bookmarks" element={<BookMarkPage />} />
        <Route path="settings"  element={<SettingsPage />} />
        <Route path="search"    element={<SearchPage />} />
        <Route path="admin/*"   element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      </Route>
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;