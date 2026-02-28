import { UserProvider } from '@/shared/providers/UserProvider';
import { Sidebar } from '@/features/navigation/ui/Sidebar';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <UserProvider>
            <div className="flex h-screen w-full bg-transparent text-white overflow-hidden">
                <div className="w-0 lg:w-auto flex-shrink-0">
                    <Sidebar />
                </div>
                <div className="flex-1 flex flex-col min-w-0 w-full">
                    {children}
                </div>
            </div>
        </UserProvider>
    );
}
