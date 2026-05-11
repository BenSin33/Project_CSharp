import { NavLink } from "react-router-dom";
import Avatar from "../common/Avatar";
import type { User } from "../../types";

const HomeIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const FriendsIcon  = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const ExploreIcon  = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>);
const MessagesIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
const BookmarksIcon= () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>);
const SettingsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const ShieldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3z"/></svg>);

interface SidebarProps {
  currentUser?: Pick<User, "name" | "avatarUrl" | "roles">;
}

interface NavItem {
  id:    string;
  label: string;
  path:  string;
  icon:  React.ReactNode;
}

export default function Sidebar({ currentUser }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: "home",      label: "Home",      path: "/",          icon: <HomeIcon /> },
    { id: "profile",   label: "Profile",   path: "/profile",   icon: currentUser
        ? <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size={22} />
        : null },
    { id: "friends",   label: "Friends",   path: "/friends",   icon: <FriendsIcon /> },
    { id: "explore",   label: "Explore",   path: "/explore",   icon: <ExploreIcon /> },
    { id: "messages",  label: "Messages",  path: "/messages",  icon: <MessagesIcon /> },
    { id: "bookmarks", label: "Bookmarks", path: "/bookmarks", icon: <BookmarksIcon /> },
    { id: "settings",  label: "Settings",  path: "/settings",  icon: <SettingsIcon /> },
  ];

  if (currentUser?.roles?.includes("Admin")) {
    navItems.splice(2, 0, { id: "admin", label: "Admin", path: "/admin", icon: <ShieldIcon /> });
  }

  return (
    <nav className="w-full bg-gray-50 py-2 px-1 flex flex-col gap-1">
      {navItems.map(({ id, label, path, icon }) => (
        <NavLink key={id} to={path}
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-xl text-[15px] font-medium transition-colors justify-center lg:justify-start ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-800 hover:bg-gray-100"
            }`
          }
          title={label}
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? "text-blue-600" : "text-gray-800"}>{icon}</span>
              <span className="hidden lg:inline">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}