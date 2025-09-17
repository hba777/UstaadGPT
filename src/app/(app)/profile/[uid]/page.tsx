import ProfileClientPage from './profile-client-page';

export default function ProfilePage({ params }: { params: { uid: string } }) {
  return <ProfileClientPage uid={params.uid} />;
}
