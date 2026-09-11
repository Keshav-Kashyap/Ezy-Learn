"use client"

import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const NotificationBell = ({ collapsed = false }) => {
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        browserPermission,
        requestBrowserPermission,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        if (notification.actionUrl) {
            setIsOpen(false);
            router.push(notification.actionUrl);
        }
    };

    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
    };

    const handleMarkAsRead = async (e, notificationId) => {
        e.stopPropagation();
        await markAsRead(notificationId);
    };

    const getNotificationIcon = (type) => {
        const icons = {
            course_created: '',
            semester_created: '📚',
            subject_created: '📖',
            material_uploaded: '📄',
            course_updated: '🔄',
            semester_updated: '🔄',
            subject_updated: '🔄',
        };
        return icons[type] || '🔔';
    };

    const formatTime = (date) => {
        try {
            const now = new Date();
            const notifDate = new Date(date);
            const diffMs = now - notifDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return notifDate.toLocaleDateString();
        } catch {
            return 'Just now';
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`
                    relative flex items-center rounded-xl 
                    transition-all duration-300 ease-in-out
                    ${collapsed
                        ? 'w-10 h-10 mx-auto p-0 justify-center'
                        : 'w-full mx-2 p-3 gap-3'
                    }
                    hover:bg-gray-100 dark:hover:bg-[rgb(45,45,44)] hover:shadow-md
                    text-gray-700 dark:text-gray-300
                `}
            >
                <div className="relative flex-shrink-0">
                    <Bell size={18} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-md px-1">
                            <span className="text-[10px] text-white font-bold">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-all duration-300 whitespace-nowrap">
                        Notifications
                    </span>
                )}
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl h-[80vh] p-0 bg-white dark:bg-[#181818]">
                    <DialogHeader className="p-6 pb-4 border-b dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Notifications
                                </DialogTitle>
                                <DialogDescription className="text-gray-500 dark:text-gray-400">
                                    {unreadCount > 0
                                        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                        : 'You\'re all caught up!'}
                                </DialogDescription>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="text-xs"
                            >
                                All ({notifications.length})
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('unread')}
                                className="text-xs"
                            >
                                Unread ({unreadCount})
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-xs ml-auto"
                                >
                                    <CheckCheck size={14} className="mr-1" />
                                    Mark all as read
                                </Button>
                            )}
                            {browserPermission !== 'granted' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={requestBrowserPermission}
                                    className="text-xs"
                                    title="Enable browser notifications"
                                >
                                    <SettingsIcon size={14} className="mr-1" />
                                    Enable
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                                <Bell size={48} className="mb-4 opacity-30" />
                                <p className="text-lg font-medium">No notifications yet</p>
                                <p className="text-sm">We'll notify you when something new arrives</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`
                                            p-4 rounded-lg cursor-pointer transition-all duration-200
                                            border dark:border-gray-800
                                            ${!notification.isRead
                                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                                                : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }
                                        `}
                                    >
                                        <div className="flex gap-3">
                                            <div className="text-2xl flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.isRead && (
                                                        <Badge variant="default" className="bg-blue-600 text-xs">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check size={14} className="text-green-600" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(e, notification.id)}
                                                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NotificationBell;
