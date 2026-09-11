"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, UserPlus, Shield, Mail, Calendar, Loader2 } from "lucide-react";
import { useAdminUsers } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsers() {
    const { data: usersData, isLoading, refetch } = useAdminUsers();
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleMakeAdminClick = (userId, userName, userEmail) => {
        setSelectedUser({ id: userId, name: userName, email: userEmail });
        setShowConfirmDialog(true);
    };

    const handleMakeAdmin = async () => {
        if (!selectedUser) return;

        setUpdatingUserId(selectedUser.id);
        setShowConfirmDialog(false);
        
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/make-admin`, {
                method: 'PATCH',
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Success!', {
                    description: `${selectedUser.name} is now an admin`,
                });
                refetch(); // Refresh the users list
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to update user role',
                });
            }
        } catch (error) {
            console.error('Error making user admin:', error);
            toast.error('Error', {
                description: 'Failed to update user role',
            });
        } finally {
            setUpdatingUserId(null);
            setSelectedUser(null);
        }
    };

    const users = usersData || [];

    const filteredUsers = searchTerm
        ? users.filter(user =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : users;

    const getUserRoleBadge = (role) => {
        const roleColors = {
            admin: "bg-red-100 text-red-800 border-red-200",
            student: "bg-blue-100 text-blue-800 border-blue-200",
            teacher: "bg-green-100 text-green-800 border-green-200"
        };

        return (
            <Badge className={roleColors[role] || "bg-gray-100 text-gray-800 border-gray-200"}>
                {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
            </Badge>
        );
    };

    const getStatusBadge = (status) => {
        return (
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                <div className={`w-2 h-2 rounded-full mr-2 ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
                        <p className="text-xs text-muted-foreground">Currently active</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
                        <p className="text-xs text-muted-foreground">Admin accounts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</div>
                        <p className="text-xs text-muted-foreground">Student accounts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-[rgb(45,45,44)]/50">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-medium text-lg">
                                                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-medium">{user.name || 'Unknown User'}</h3>
                                                {getUserRoleBadge(user.role)}
                                                {getStatusBadge(user.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email || 'No email'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.role !== 'admin' && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleMakeAdminClick(user.id, user.name, user.email)}
                                                disabled={updatingUserId === user.id}
                                                className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                                            >
                                                {updatingUserId === user.id ? (
                                                    <span className="flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Processing...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="w-3 h-3" />
                                                        Make Admin
                                                    </span>
                                                )}
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="mx-auto h-12 w-12 mb-4" />
                                <p className="text-lg font-medium mb-2">No users found</p>
                                <p>Try adjusting your search terms or add new users</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="bg-white dark:bg-[#2a2a28] border-gray-200 dark:border-[#3a3a38]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Promote to Admin
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to make <strong className="text-gray-900 dark:text-white">{selectedUser?.name}</strong> ({selectedUser?.email}) an admin?
                            <br /><br />
                            <span className="text-orange-600 dark:text-orange-400">
                                 Admins have full access to manage users, courses, and content.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 dark:border-gray-600">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleMakeAdmin}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Yes, Make Admin
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}