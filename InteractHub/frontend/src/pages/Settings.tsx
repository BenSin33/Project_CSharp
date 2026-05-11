import { useState, useEffect } from "react";
import SettingsTabs, { type SettingsTab } from "../components/settings/SettingsTabs";
import SettingsField, { inputCls } from "../components/settings/SettingFields";
import ToggleRow from "../components/settings/ToggleRow";
import DangerZone from "../components/settings/DangerZone";
import AvatarUpload from "../components/settings/AvatarUpload";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import { authService } from "../services/authService";

const PREF_ITEMS = [
  { key: "likes",    label: "Likes",           desc: "When someone likes your post" },
  { key: "comments", label: "Comments",        desc: "When someone comments on your post" },
  { key: "mentions", label: "Mentions",        desc: "When someone mentions you" },
  { key: "friends",  label: "Friend Requests", desc: "When someone sends you a friend request" },
  { key: "shares",   label: "Shares",          desc: "When someone shares your post" },
];

export default function SettingsPage() {
  const { user: currentUser, } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");

  // Profile — seeded from current user
  const [profile, setProfile] = useState({
    name: currentUser?.name ?? "",
    username: currentUser?.username ?? "",
    bio: "",
    website: "",
    location: "",
    avatarUrl: currentUser?.avatarUrl ?? "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load full profile from backend on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    userService.getMyProfile().then(prof => {
      setProfile({
        name: prof.name ?? "",
        username: prof.username ?? "",
        bio: prof.bio ?? "",
        website: "",
        location: prof.location ?? "",
        avatarUrl: prof.avatarUrl ?? "",
      });
    }).catch(() => { /* keep defaults */ });
  }, [currentUser?.id]);

  const handleAvatarUpload = async (file: File) => {
    try {
      const { avatarUrl } = await userService.uploadAvatar(file);
      setProfile(p => ({ ...p, avatarUrl }));
    } catch {
      setProfileMsg({ type: "error", text: "Tải ảnh lên thất bại. Vui lòng thử lại." });
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await userService.updateProfile(currentUser.id, {
        fullName:  profile.name,
        location:  profile.location,
        bio:       profile.bio,
        avatarUrl: profile.avatarUrl,
      });
      // Refresh AuthContext so Navbar/avatar updates immediately
      try {
        const updated = await authService.getMe();
        const cached = localStorage.getItem("user");
        if (cached) {
          const parsed = JSON.parse(cached);
          localStorage.setItem("user", JSON.stringify({ ...parsed, ...updated }));
        }
        // Trigger re-render by dispatching event
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: updated }));
      } catch { /* ignore */ }
      setProfileMsg({ type: "success", text: "✅ Thông tin cá nhân đã được cập nhật!" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Có lỗi xảy ra";
      setProfileMsg({ type: "error", text: "❌ " + msg });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // Account
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif]   = useState(true);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREF_ITEMS.map(p => [p.key, true]))
  );

  // Privacy
  const [privateAcc, setPrivateAcc]     = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [whoComment, setWhoComment]     = useState("Everyone");
  const [whoFriend, setWhoFriend]       = useState("Everyone");
  const [whoFriendList, setWhoFriendList] = useState("Everyone");
  const whoOptions = ["Everyone", "Friends only", "Friends of friends", "No one"];

  const savBtn = (label: string, onClick?: () => void, loading?: boolean) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-2 h-[38px] px-5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-[14px] font-medium rounded-lg transition-colors"
    >
      {loading ? "Đang lưu..." : label}
    </button>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-5">Settings</h1>
      <SettingsTabs active={tab} onChange={setTab} />

      {tab === "profile" && (
        <div>
          <AvatarUpload name={profile.name} avatarUrl={profile.avatarUrl} onUpload={handleAvatarUpload} />
          <SettingsField label="Full Name">
            <input className={inputCls} value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </SettingsField>
          <SettingsField label="Bio">
            <textarea className={inputCls} rows={3} value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
          </SettingsField>
          <SettingsField label="Website">
            <input className={inputCls} type="url" placeholder="https://example.com"
              value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} />
          </SettingsField>
          <SettingsField label="Location">
            <input className={inputCls} placeholder="Thành phố, Quốc gia"
              value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
          </SettingsField>

          {profileMsg && (
            <p className={`text-sm mt-2 ${profileMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {profileMsg.text}
            </p>
          )}

          {savBtn("Save Changes", handleSaveProfile, profileLoading)}
        </div>
      )}

      {tab === "account" && (
        <div>
          <SettingsField label="Email">
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </SettingsField>
          <hr className="border-gray-100 my-5" />
          <SettingsField label="Current Password">
            <input className={inputCls} type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          </SettingsField>
          <SettingsField label="New Password">
            <input className={inputCls} type="password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} />
          </SettingsField>
          <SettingsField label="Confirm New Password">
            <input className={inputCls} type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          </SettingsField>
          {savBtn("Change Password")}
          <hr className="border-gray-100 my-6" />
          <DangerZone onDelete={() => console.log("delete")} />
        </div>
      )}

      {tab === "notifications" && (
        <div>
          <ToggleRow label="Email Notifications" description="Receive email notifications about your activity" checked={emailNotif} onChange={setEmailNotif} />
          <ToggleRow label="Push Notifications" description="Receive push notifications on your devices" checked={pushNotif} onChange={setPushNotif} />
          <div className="mt-5">
            <h3 className="text-[16px] font-medium text-gray-900 mb-2">Notification Preferences</h3>
            {PREF_ITEMS.map(p => (
              <ToggleRow key={p.key} label={p.label} description={p.desc} checked={prefs[p.key]} onChange={v => setPrefs(prev => ({ ...prev, [p.key]: v }))} />
            ))}
          </div>
          {savBtn("Save Preferences")}
        </div>
      )}

      {tab === "privacy" && (
        <div>
          <ToggleRow label="Private Account" description="Only approved followers can see your posts" checked={privateAcc} onChange={setPrivateAcc} />
          <ToggleRow label="Show Online Status" description="Let others see when you're active" checked={onlineStatus} onChange={setOnlineStatus} />
          <hr className="border-gray-100 my-5" />
          <h3 className="text-[16px] font-medium text-gray-900 mb-3">Who can...</h3>
          {[
            { label: "Comment on your posts",    val: whoComment,    set: setWhoComment },
            { label: "Send you friend requests", val: whoFriend,     set: setWhoFriend },
            { label: "See your friends list",    val: whoFriendList, set: setWhoFriendList },
          ].map(f => (
            <SettingsField key={f.label} label={f.label}>
              <select className={inputCls + " cursor-pointer"} value={f.val} onChange={e => f.set(e.target.value)}>
                {whoOptions.map(o => <option key={o}>{o}</option>)}
              </select>
            </SettingsField>
          ))}
          <hr className="border-gray-100 my-5" />
          <h3 className="text-[16px] font-medium text-gray-900 mb-2">Blocked Users</h3>
          <p className="text-[13px] text-gray-500 mb-4">You haven't blocked anyone yet</p>
          {savBtn("Save Settings")}
        </div>
      )}
    </div>
  );
}