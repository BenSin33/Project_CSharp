import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileTabs from "../components/Profile/ProfileTabs";

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <ProfileHeader
        displayName="You"
        username="yourname"
        bio="Living life one post at a time ✨"
        location="San Francisco, CA"
        website="website.com"
        joinedAt="March 2024"
        followingCount={180}
        followersCount={245}
        isOwner={true}
        onEditProfile={() => console.log("edit")}
      />
      <ProfileTabs />
    </div>
  );
}