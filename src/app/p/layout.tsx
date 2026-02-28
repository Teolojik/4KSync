import { UserProvider } from '@/shared/providers/UserProvider';
import { Sidebar } from '@/features/navigation/ui/Sidebar';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <UserProvider>
            <div className="flex h-screen w-full bg-transparent text-white overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>
            </div>
        </UserProvider>
    );
}
