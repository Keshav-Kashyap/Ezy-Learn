"use client"
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
import AppSidebar from "./_components/AppSidebar"
import WelcomeContainer from './_components/AppWelcomeContainer'
import Navbar from './_components/AppNavbar'
import GPTSidebar from '@/components/GPTSidebar'
// import MobileNavigation from './dashboard/_components/MobileNavigation'
// import BackgroundLines from '@/components/Background'
import { menuItems, bottomMenuItems } from '../../services/constant'
import { useUserProfile } from '@/hooks/useUser'

const DashboardProvider = ({ children }) => {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [aiSidebarOpen, setAISidebarOpen] = useState(false);
    const [aiMessages, setAIMessages] = useState([]);
    const [sidebarWidth, setSidebarWidth] = useState(450);

    // React Query user profile hook for deduplicated register query
    const { data: profileData } = useUserProfile({ enabled: isLoaded && !!user });

    useEffect(() => {
        if (!isLoaded || !user || !profileData) return;

        if (profileData.success && !profileData.hasProfile && !profileData.exists) {
            router.push('/create-profile');
        }
    }, [user, isLoaded, profileData, router]);

    React.useEffect(() => {
        const handleOpenAI = () => setAISidebarOpen(true);
        const handleCloseAI = () => setAISidebarOpen(false);
        const handleToggleAI = () => setAISidebarOpen(prev => !prev);

        window.addEventListener('open-ai-sidebar', handleOpenAI);
        window.addEventListener('close-ai-sidebar', handleCloseAI);
        window.addEventListener('toggle-ai-sidebar', handleToggleAI);

        return () => {
            window.removeEventListener('open-ai-sidebar', handleOpenAI);
            window.removeEventListener('close-ai-sidebar', handleCloseAI);
            window.removeEventListener('toggle-ai-sidebar', handleToggleAI);
        };
    }, []);

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-full overflow-hidden">
                {/* Sidebar */}
                <AppSidebar menuItems={menuItems} bottomMenuItems={bottomMenuItems} isAdmin={false} />

                {/* Main Content Area */}
                <div
                    className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-[rgb(38,38,36)]"
                    style={{
                        marginRight: aiSidebarOpen ? `${sidebarWidth}px` : '0',
                        transition: 'margin-right 0.1s ease-out'
                    }}
                >
                    {/* Fixed Navbar */}
                    <Navbar onOpenAI={() => setAISidebarOpen(true)} />

                    {/* Scrollable Content Area */}
                    <main className="flex-1 overflow-y-auto bg-white dark:bg-[rgb(38,38,36)]">
                        <div className="w-full">


                            {/* Children Content */}
                            <div className="w-full px-4 md:px-6 pb-6">
                                {children}
                            </div>
                        </div>
                    </main>


                </div>
            </div>

            {/* AI Sidebar */}
            <GPTSidebar
                open={aiSidebarOpen}
                onClose={() => setAISidebarOpen(false)}
                messages={aiMessages}
                onWidthChange={setSidebarWidth}
            />
        </SidebarProvider>
    )
}

export default DashboardProvider