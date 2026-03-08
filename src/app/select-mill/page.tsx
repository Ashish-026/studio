// This file is now redundant because selection is handled inline in the dashboard layout.
// We keep it as a redirect just in case old bookmarks exist.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}
