import { Home, Code, Database, Cpu, BookOpen, GraduationCap } from "lucide-react";




export const menuItems = [
    {
        title: "Dashboard",
        icon: "Home", // Main Dashboard (former Dashboard 2 layout)
        href: "/dashboard",
        isActive: true,
    },
    {
        title: "Popular",
        icon: "TrendingUp", // Former Dashboard 1 layout
        href: "/popular",
    },
    {
        title: "All Notes",
        icon: "FileText",
        href: "/allNotes",
    },
    {
        title: "All Courses",
        icon: "BookOpen",
        href: "/allCourses",
    },
];


export const LibraryItems = [

    {
        title: "MCA Library",
        icon: "Code",
        href: "/library/mca",
    },
    {
        title: "BCA Library",
        icon: "Database",
        href: "/library/bca",
    },
    {
        title: "B.Tech Library",
        icon: "Cpu",
        href: "/library/btech",
    },


];

export const adminLibraryItems = [

    {
        title: "MCA Library",
        icon: "Code",
        href: "/admin/library/mca",
    },
    {
        title: "BCA Library",
        icon: "Database",
        href: "/admin/library/bca",
    },
    {
        title: "B.Tech Library",
        icon: "Cpu",
        href: "/admin/library/btech",
    },


];





export const adminMenuItems = [
    {
        title: "Dashboard",
        icon: "Home",
        href: "/admin/dashboard",
        isActive: false,
    },
    {
        title: "Library Manager",
        icon: "Upload",
        href: "/admin/library",
    },
    {
        title: "Popular Notes",
        icon: "TrendingUp",
        href: "/admin/popularNotes",
    },
    {
        title: "Analytics",
        icon: "BarChart",
        href: "/admin/analytics",
    },
    {
        title: "User Management",
        icon: "Users",
        href: "/admin/users",
    },
];
export const bottomMenuItems = [
    {
        title: 'Reviews',
        icon: "MessageSquare",
        href: '/reviews'
    },
    {
        title: 'Settings',
        icon: "Settings",
        // No href - opens UserProfile dialog
    },
    {
        title: 'Billing',
        icon: "CreditCard",
        href: '/billing'
    },
    {
        title: 'Join Us',
        icon: "Users",
        href: '/join-us'
    }
];
export const adminbottomMenuItems = [
    {
        title: 'Notifications',
        icon: "Bell",
        href: '/notifications',
        badge: 3
    },
    {
        title: "Reviews",
        icon: "MessageSquare",
        href: "/admin/reviews",
    },
    {
        title: 'Settings',
        icon: "Settings",
        // No href - opens UserProfile dialog
    },
    {
        title: 'Billing',
        icon: "CreditCard",
        href: '/billing'
    },
    {
        title: 'Team',
        icon: "Users",
        href: '/join-us'
    }
];