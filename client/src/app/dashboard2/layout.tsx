'use client';

import { SelectedElementsProvider } from '../../components/context/SelectedElementsContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SelectedElementsProvider>
      {children}
    </SelectedElementsProvider>
  );
}
