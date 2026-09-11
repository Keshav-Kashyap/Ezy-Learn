import { toast } from "sonner";
import { openBuyCreditModal } from "@/components/BuyCreditModal";

/**
 * Converts any Google Drive preview link to a direct export/download URL.
 */
export function getGoogleDriveDirectUrl(url) {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
        const match = url.match(/[-\w]{25,}/);
        if (match) {
            return `https://drive.google.com/uc?export=download&id=${match[0]}&confirm=t`;
        }
    }
    return url;
}

/**
 * Triggers file download in browser reliably.
 * Google Drive links are opened in new tab/download bar due to X-Frame-Options restrictions on iframes.
 */
export function triggerDirectDownload(fileUrl, fileName, fileType = "pdf") {
    if (!fileUrl) return false;

    const directUrl = getGoogleDriveDirectUrl(fileUrl);
    const ext = (fileType || "pdf").toLowerCase();
    const cleanTitle = (fileName || "study_material")
        .replace(/[/\\?%*:|"<>]/g, "_")
        .trim();
    const finalFileName = cleanTitle.toLowerCase().endsWith(`.${ext}`)
        ? cleanTitle
        : `${cleanTitle}.${ext}`;

    try {
        const link = document.createElement("a");
        link.href = directUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 300);

        return true;
    } catch (e) {
        console.warn("Direct download failed, falling back to window.open", e);
        window.open(directUrl, "_blank");
        return true;
    }
}

export const downloadFileDirectly = triggerDirectDownload;

/**
 * Consumes 1 credit and triggers file download/open.
 * If user has 0 credits (and is not admin), blocks download and opens "Buy credit through email modal".
 */
export async function consumeCreditAndDownload({
    fileUrl,
    fileName,
    fileType = "pdf",
    materialId,
    user,             // Clerk user or null
    userDetail,       // DB userDetail object from UserDetailContext
    setUserDetail,    // Context setter
    router,           // Next.js router instance (optional)
    onSuccess,        // Optional custom download callback
}) {
    const isAdmin = userDetail?.role === "admin";
    const credits = userDetail?.credits ?? 0;

    if (!isAdmin && credits <= 0) {
        toast.error("You have 0 credits remaining to download.", {
            description: "Opening credit purchase modal...",
        });
        openBuyCreditModal();
        return false;
    }

    const toastId = toast.loading("Checking credits...");

    try {
        const response = await fetch("/api/users/consume-credit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            toast.error(data.error || "Needs credits to download", { id: toastId });
            openBuyCreditModal();
            return false;
        }

        if (setUserDetail && data.user) {
            setUserDetail(data.user);
        }

        // Track download count asynchronously if materialId provided
        if (materialId) {
            fetch("/api/download/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ materialId }),
            }).catch((e) => console.warn("Failed to track download", e));
        }

        toast.dismiss(toastId);

        if (onSuccess) {
            await onSuccess();
        } else if (fileUrl) {
            await triggerDirectDownload(fileUrl, fileName, fileType);
        }

        return true;
    } catch (error) {
        console.error("Error consuming credit:", error);
        toast.error("Failed to process download credit", { id: toastId });
        return false;
    }
}

