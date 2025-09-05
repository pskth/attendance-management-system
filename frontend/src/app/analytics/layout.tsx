'use client';

import { AnalyticsRoute } from '@/components/ProtectedRoute';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalyticsRoute>
      {children}
    </AnalyticsRoute>
  );
}
