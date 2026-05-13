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
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");

  // Loading & Message states
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile
  const [profile, setProfile] = useState({
    name: currentUser?.name ?? "",
    username: currentUser?.username ?? "",
    bio: "",
    website: "",
    location: "",
    avatarUrl: currentUser?.avatarUrl ?? "",
  });

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

  // Load data on mount
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
      setEmail(prof.email ?? "");
      
      if (prof.settings) {
        setEmailNotif(prof.settings.emailNotifications);
        setPushNotif(prof.settings.pushNotifications);
        setPrivateAcc(prof.settings.privateAccount);
        setOnlineStatus(prof.settings.showOnlineStatus);
        setWhoComment(prof.settings.whoCanComment);
        setWhoFriend(prof.settings.whoCanSendFriendRequest);
        setWhoFriendList(prof.settings.whoCanSeeFriendsList);
      }
    }).catch(() => { /* keep defaults */ });
  }, [currentUser?.id]);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const { avatarUrl } = await userService.uploadAvatar(file);
      setProfile(p => ({ ...p, avatarUrl }));
    } catch {
      showMsg("error", "Tải ảnh lên thất bại.");
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      await userService.updateProfile(currentUser.id, {
        fullName:  profile.name,
        location:  profile.location,
        bio:       profile.bio,
        avatarUrl: profile.avatarUrl,
      });
      // Refresh Auth
      const updated = await authService.getMe();
      localStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: updated }));
      
      showMsg("success", "✅ Hồ sơ đã được cập nhật!");
    } catch (err: any) {
      showMsg("error", "❌ " + (err?.message ?? "Cập nhật hồ sơ thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.next) {
      return showMsg("error", "Vui lòng nhập đầy đủ mật khẩu.");
    }
    if (passwords.next !== passwords.confirm) {
      return showMsg("error", "Mật khẩu xác nhận không khớp.");
    }
    
    setLoading(true);
    try {
      await authService.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      showMsg("success", "✅ Mật khẩu đã được thay đổi!");
    } catch (err: any) {
      showMsg("error", "❌ " + (err?.message ?? "Đổi mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      await userService.updateSettings(currentUser.id, {
        emailNotifications: emailNotif,
        pushNotifications: pushNotif,
        privateAccount: privateAcc,
        showOnlineStatus: onlineStatus,
        whoCanComment: whoComment,
        whoCanSendFriendRequest: whoFriend,
        whoCanSeeFriendsList: whoFriendList
      });
      showMsg("success", "✅ Cài đặt đã được lưu!");
    } catch (err: any) {
      showMsg("error", "❌ " + (err?.message ?? "Lưu cài đặt thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const savBtn = (label: string, onClick?: () => void, isLoading?: boolean) => (
    <button
      onClick={onClick}
      disabled={isLoading || loading}
      className="mt-2 h-[38px] px-5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white text-[14px] font-medium rounded-lg transition-colors"
    >
      {isLoading || (loading && onClick) ? "Đang xử lý..." : label}
    </button>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-5">Settings</h1>
      <SettingsTabs active={tab} onChange={setTab} />

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {tab === "profile" && (
        <div className="animate-in fade-in duration-300">
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

          {savBtn("Save Changes", handleSaveProfile)}
        </div>
      )}

      {tab === "account" && (
        <div className="animate-in fade-in duration-300">
          <SettingsField label="Email">
            <input type="email" value={email} readOnly disabled className={inputCls + " bg-gray-50 text-gray-500"} />
            <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed currently.</p>
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
          {savBtn("Change Password", handleChangePassword)}
          <hr className="border-gray-100 my-6" />
          <DangerZone onDelete={() => console.log("delete")} />
        </div>
      )}

      {tab === "notifications" && (
        <div className="animate-in fade-in duration-300">
          <ToggleRow label="Email Notifications" description="Receive email notifications about your activity" checked={emailNotif} onChange={setEmailNotif} />
          <ToggleRow label="Push Notifications" description="Receive push notifications on your devices" checked={pushNotif} onChange={setPushNotif} />
          <div className="mt-5 opacity-50 pointer-events-none">
            <h3 className="text-[16px] font-medium text-gray-900 mb-2">Notification Preferences (Coming Soon)</h3>
            {PREF_ITEMS.map(p => (
              <ToggleRow key={p.key} label={p.label} description={p.desc} checked={prefs[p.key]} onChange={v => setPrefs(prev => ({ ...prev, [p.key]: v }))} />
            ))}
          </div>
          {savBtn("Save Preferences", handleSaveSettings)}
        </div>
      )}

      {tab === "privacy" && (
        <div className="animate-in fade-in duration-300">
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
          {savBtn("Save Settings", handleSaveSettings)}
        </div>
      )}
    </div>
  );
}