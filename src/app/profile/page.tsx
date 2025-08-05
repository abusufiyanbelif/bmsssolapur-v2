
'use client';

import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Redirect to the default settings page
  redirect('/profile/settings');
}
