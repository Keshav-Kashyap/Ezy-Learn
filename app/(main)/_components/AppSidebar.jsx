"use client"

import React, { useContext, useState } from 'react';
import SettingsDialog from './SettingDialog'
import {
    BookOpen,
    Settings,
    CreditCard,
    Users,
    Code,
    Database,
    Cpu,
    GraduationCap,
    Home,
    Bell,
    Upload,
    FileText,
    ChevronRight,
    TrendingUp,
    MessageSquare,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailContext';
import { UserButton, UserProfile } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import NotificationBell from '@/components/NotificationBell';
import { LibraryItems, adminLibraryItems } from '@/services/constant';

const AppSidebar = ({ menuItems, bottomMenuItems, isAdmin = false }) => {
    const libraryItems = isAdmin ? adminLibraryItems : LibraryItems;
    const pathname = usePathname();
    const { userDetail } = useContext(UserDetailContext);
    const { open, setOpen } = useSidebar();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Icon mapping for string-based icons
    const iconMap = {
        Home,
        Code,
        Database,
        Cpu,
        BookOpen,
        GraduationCap,
        Bell,
        Settings,
        CreditCard,
        Users,
        Upload,
        FileText,
        TrendingUp,
        MessageSquare,
        Sparkles,
        'trending-up': TrendingUp
    };

    // Update menu items with active status based on current pathname
    const updatedMenuItems = menuItems.map(item => ({
        ...item,
        isActive: pathname === item.href
    }));

    return (
        <Sidebar
            collapsible="icon"
            className="
                bg-white dark:bg-[#181818] 
                border-r border-gray-200 dark:border-[rgb(45,45,44)]
                text-gray-900 dark:text-white
                transition-all duration-300 ease-in-out
                shadow-lg
                z-40
            "
        >
            {/* Header - Logo hides on hover when collapsed, trigger appears */}
            <SidebarHeader className="border-b bg-white dark:bg-[#181818] border-gray-200 dark:border-[rgb(45,45,44)] p-1 pt-3 pb-3">
                <div className="flex items-center gap-3 w-full min-h-[40px]">
                    {/* When Expanded - Show full header */}
                    {open ? (
                        <>
                            <img
                                src="/image.jpeg"
                                alt="Ezy Learn Logo"
                                className="w-8 h-8 rounded-xl flex-shrink-0"
                            />
                            <div className="flex-1 overflow-hidden">
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    EzyLearn
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Learning Hub</p>
                            </div>
                            <SidebarTrigger className="rounded-lg h-8 w-8 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white  hover:cursor-w-resize" >
                                <ChevronRight size={5} className="rotate-180" />
                            </SidebarTrigger>
                        </>
                    ) : (
                        /* When Collapsed - Logo shows, trigger on hover */
                        <div className="relative w-8 h-8 mx-auto group/logo">
                            {/* Logo - visible by default */}
                            <img
                                src="/image.jpeg"
                                alt="Ezy Learn Logo"
                                className="absolute inset-0 w-8 h-8 rounded-xl transition-opacity duration-300 group-hover/logo:opacity-0"
                            />

                            {/* Trigger - appears on hover */}
                            <SidebarTrigger className="absolute inset-0 h-8 w-8  rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] transition-all duration-300 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover/logo:opacity-100 hover:cursor-w-resize">
                                <ChevronRight size={5} />
                            </SidebarTrigger>
                        </div>
                    )}
                </div>
            </SidebarHeader>

            {/* Main Navigation */}
            <SidebarContent className="overflow-y-auto bg-white dark:bg-[#181818] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent py-3 pr-3">
                <SidebarGroup>
                    {open && (
                        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 mb-2">
                            Main Menu
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {updatedMenuItems.map((item, index) => {
                                const IconComponent = iconMap[item.icon] || Home;

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.isActive}
                                            tooltip={!open ? item.title : undefined}
                                            className={`flex items-center rounded-xl transition-all duration-300 ease-in-out group relative ${open ? 'w-full mx-3 p-3' : 'w-10 h-10 mx-auto p-0 justify-center'} ${item.isActive ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30 text-white' : 'hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] hover:shadow-md text-gray-700 dark:text-gray-400'}`}
                                        >
                                            <Link href={item.href} className={`flex items-center w-full ${open ? 'gap-3' : 'justify-center'}`}>
                                                <IconComponent
                                                    size={20}
                                                    className={`flex-shrink-0 transition-all duration-300 ease-in-out ${item.isActive ? 'text-white drop-shadow-md' : 'text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}
                                                />

                                                {open && (
                                                    <span className={`
                                                        text-sm font-medium transition-all duration-300 ease-in-out
                                                        whitespace-nowrap
                                                        ${item.isActive
                                                            ? 'text-white drop-shadow-sm'
                                                            : 'text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                                                        }
                                                    `}>
                                                        {item.title}
                                                    </span>
                                                )}

                                                {item.isActive && open && (
                                                    <div className="ml-auto">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-md"></div>
                                                    </div>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Library Section */}
                <SidebarGroup>
                    {open && (
                        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 mb-2">
                            Library
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {libraryItems.map((item, index) => {
                                const IconComponent = iconMap[item.icon] || BookOpen;
                                const isActive = pathname === item.href;

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={!open ? item.title : undefined}
                                            className={`flex items-center rounded-xl transition-all duration-300 ease-in-out group relative ${open ? 'w-full mx-3 p-3' : 'w-10 h-10 mx-auto p-0 justify-center'} ${isActive ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg shadow-purple-500/30 text-white' : 'hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] hover:shadow-md text-gray-700 dark:text-gray-400'}`}
                                        >
                                            <Link href={item.href} className={`flex items-center w-full ${open ? 'gap-3' : 'justify-center'}`}>
                                                <IconComponent
                                                    size={20}
                                                    className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isActive ? 'text-white drop-shadow-md' : 'text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300'}`}
                                                />

                                                {open && (
                                                    <span className={`
                                                        text-sm font-medium transition-all duration-300 ease-in-out
                                                        whitespace-nowrap
                                                        ${isActive
                                                            ? 'text-white drop-shadow-sm'
                                                            : 'text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                                                        }
                                                    `}>
                                                        {item.title}
                                                    </span>
                                                )}

                                                {isActive && open && (
                                                    <div className="ml-auto">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-md"></div>
                                                    </div>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Bottom Menu */}
                <SidebarGroup className="mt-auto">
                    {open && (
                        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 mb-2">
                            Account
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {bottomMenuItems.map((item, index) => {
                                const IconComponent = iconMap[item.icon] || Settings;
                                const isSettings = item.title === 'Settings';
                                const isNotifications = item.title === 'Notifications';

                                // Render NotificationBell for Notifications item
                                // if (isNotifications) {
                                //     return (
                                //         <SidebarMenuItem key={index}>
                                //             <NotificationBell collapsed={!open} />
                                //         </SidebarMenuItem>
                                //     );
                                // }

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            onClick={isSettings ? () => setIsSettingsOpen(true) : undefined}
                                            asChild={!isSettings}
                                            tooltip={!open ? item.title : undefined}
                                            className={`
                                                flex items-center rounded-xl 
                                                transition-all duration-300 ease-in-out group relative
                                                ${open
                                                    ? 'w-full mx-2 p-3'
                                                    : 'w-10 h-10 mx-auto p-0 justify-center'
                                                }
                                                hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] hover:shadow-md text-gray-700 dark:text-gray-300
                                                ${isSettings ? 'cursor-pointer' : ''}
                                            `}
                                        >
                                            {isSettings ? (
                                                <div className={`flex items-center w-full ${open ? 'gap-3' : 'justify-center'}`}>
                                                    <div className="relative flex-shrink-0">
                                                        <IconComponent
                                                            size={18}
                                                            className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 ease-in-out"
                                                        />
                                                        {item.badge && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
                                                                <span className="text-[8px] text-white font-bold">{item.badge}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {open && (
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 whitespace-nowrap">
                                                            {item.title}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link href={item.href} className={`flex items-center w-full ${open ? 'gap-3' : 'justify-center'}`}>
                                                    <div className="relative flex-shrink-0">
                                                        <IconComponent
                                                            size={18}
                                                            className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 ease-in-out"
                                                        />
                                                        {item.badge && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
                                                                <span className="text-[8px] text-white font-bold">{item.badge}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {open && (
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300 whitespace-nowrap">
                                                            {item.title}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* User Profile Footer */}
            <SidebarFooter className="p-3 border-t bg-white dark:bg-[#181818] border-gray-200 dark:border-[rgb(45,45,44)]">
                <div className={`
                    flex items-center rounded-xl hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] 
                    transition-all duration-300 cursor-pointer group
                    ${open ? 'gap-3 p-2 ' : 'justify-center '}
                `}>
                    <div className="flex-shrink-0">
                        <UserButton />
                    </div>

                    {open && (
                        <>
                            <div className="flex-1 overflow-hidden min-w-0">
                                {userDetail === undefined ? (
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 max-w-[120px] rounded-md" />
                                        <Skeleton className="h-3 max-w-[160px] rounded-md" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {userDetail?.name || 'User'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {userDetail?.email || 'user@email.com'}
                                        </div>
                                    </>
                                )}
                            </div>

                        </>
                    )}
                </div>
            </SidebarFooter>

            {/* Custom Styles */}
            <style jsx>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: rgb(209, 213, 219);
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: rgb(75, 75, 74);
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: rgb(156, 163, 175);
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: rgb(95, 95, 94);
                }
            `}</style>

            {/* Settings Dialog with UserProfile */}

            <SettingsDialog isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen} />




        </Sidebar>
    );
};

export default AppSidebar;