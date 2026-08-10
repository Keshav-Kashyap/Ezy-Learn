import { toast } from "sonner";

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
 * Instantly hands off downloading to Chrome natively using a hidden iframe.
 * Zero JS buffering, Chrome handles the download progress in browser download bar.
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
        // Use hidden iframe to trigger browser attachment download without tab jump or page reload
        let iframe = document.getElementById("ezy_download_iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "ezy_download_iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }
        iframe.src = directUrl;
        return true;
    } catch (e) {
        console.warn("Iframe download fallback", e);
    }

    // Anchor fallback
    const link = document.createElement("a");
    link.href = directUrl;
    link.download = finalFileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}

export const downloadFileDirectly = triggerDirectDownload;

/**
 * Consumes 1 credit and triggers file download/open.
 * If user has 0 credits (and is not admin), blocks download and displays "Needs credits" toast.
 */
export async function consumeCreditAndDownload({
    fileUrl,
    fileName,
    fileType = "pdf",
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
            description: "You can still view the document online.",
        });
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
            return false;
        }

        if (setUserDetail && data.user) {
            setUserDetail(data.user);
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
