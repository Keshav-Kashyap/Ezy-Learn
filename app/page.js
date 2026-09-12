"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import JsonLd from '@/components/JsonLd';
import {
  generateOrganizationJsonLd,
  generateWebsiteJsonLd,
  generateEducationalPlatformJsonLd,
  siteConfig
} from '@/lib/seo-config';
import { usePopularNotes, usePopularCourses } from '@/hooks/useCourses';
import { useUserProfile } from '@/hooks/useUser';
import PopularNotesSection from '@/components/sections/PopularNotesSection';

// Landing page components
import Navbar from './_components/landing/Navbar';
import HeroSection from './_components/landing/HeroSection';
import FeaturesSection from './_components/landing/FeaturesSection';
import CoursesSection from './_components/landing/CoursesSection';
import SearchSection from './_components/landing/SearchSection';
import ReviewsSection from './_components/landing/ReviewsSection';
import BillingSection from './_components/landing/BillingSection';
import AboutSection from './_components/landing/AboutSection';
import CTASection from './_components/landing/CTASection';
import Footer from './_components/landing/Footer';

export default function HomePage() {
  const { isSignedIn, user } = useUser();
  const { userDetail } = useContext(UserDetailContext);
  const router = useRouter();

  // Fetch user profile status
  const { data: userProfileData } = useUserProfile({ enabled: Boolean(user) });
  const hasProfile = Boolean(userProfileData?.hasProfile || userProfileData?.exists);

  // Fetch popular notes and courses
  const { data: popularNotesData, isLoading: notesLoading } = usePopularNotes(3);
  const { data: popularCoursesData, isLoading: coursesLoading } = usePopularCourses(3);

  const popularNotes = popularNotesData?.notes?.slice(0, 3) || [];
  const courses = Array.isArray(popularCoursesData) ? popularCoursesData : [];

  const onDashboard = () => {
    if (user) {
      if (hasProfile) {
        router.push('/dashboard');
      } else {
        router.push('/create-profile');
      }
    } else {
      router.push('/sign-in');
    }
  };

  // Structured data for SEO
  const organizationData = generateOrganizationJsonLd();
  const websiteData = generateWebsiteJsonLd();
  const platformData = generateEducationalPlatformJsonLd();

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Ezy Learn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ezy Learn is a free educational platform providing comprehensive study materials, notes, and PDF documents for MCA, BCA, and BTech courses. We offer 500+ materials with proper study structure and YouTube channel recommendations."
        }
      },
      {
        "@type": "Question",
        "name": "Is Ezy Learn free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Ezy Learn is completely free. You can access all study materials, download PDFs, and use all features without any payment."
        }
      },
      {
        "@type": "Question",
        "name": "What courses are available on Ezy Learn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We currently offer study materials for MCA (Master of Computer Applications), BCA (Bachelor of Computer Applications), and BTech (Bachelor of Technology) courses with semester-wise organized content."
        }
      },
      {
        "@type": "Question",
        "name": "How do I download study materials?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply sign up for a free account, browse to your course and semester, select the subject, and click the download button for any study material you need."
        }
      }
    ]
  };

  return (
    <div className="relative bg-white dark:bg-[rgb(38,38,36)] min-h-screen">
      {/* JSON-LD Structured Data for SEO */}
      <JsonLd data={organizationData} />
      <JsonLd data={websiteData} />
      <JsonLd data={platformData} />
      <JsonLd data={faqData} />

      {/* SEO Meta Tags */}
      <head>
        <title>{siteConfig.title}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="keywords" content={siteConfig.keywords.join(', ')} />
        <link rel="canonical" href={siteConfig.url} />
      </head>

      <Navbar onDashboard={onDashboard} />
      <HeroSection onDashboard={onDashboard} />
      <FeaturesSection />
      <PopularNotesSection notes={popularNotes} loading={notesLoading} isSignedIn={isSignedIn} />
      <CoursesSection courses={courses} loading={coursesLoading} />
      <SearchSection isSignedIn={isSignedIn} />
      <ReviewsSection />
      <BillingSection />
      <AboutSection />
      <CTASection onDashboard={onDashboard} />
      <Footer />
    </div>
  );
}
