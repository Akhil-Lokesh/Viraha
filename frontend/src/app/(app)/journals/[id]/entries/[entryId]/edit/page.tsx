'use client';

import { useParams, redirect } from 'next/navigation';

export default function EditEntryPage() {
  const params = useParams<{ id: string }>();
  redirect(`/journals/${params.id}`);
}
