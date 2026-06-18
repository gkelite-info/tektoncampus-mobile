export function formatDisplayDate(date?: string) {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function getClosingText(endDate: string | undefined, t?: (key: string, options?: any) => string) {
  if (!endDate) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const closingDate = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(closingDate.getTime())) return "";

  const dayDiff = Math.ceil(
    (closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  const translate = t || ((key: string, options?: any) => {
    if (key === "Closed") return "Closed";
    if (key === "Closes today") return "Closes today";
    if (key === "Closes in 1 day") return "Closes in 1 day";
    return `Closes in ${options?.days} days`;
  });

  if (dayDiff < 0) return translate("Closed");
  if (dayDiff === 0) return translate("Closes today");
  if (dayDiff === 1) return translate("Closes in 1 day");

  return translate("Closes in {days} days", { days: dayDiff.toString() });
}

export function getPlacementCycle(company: { startDate?: string }) {
  return company.startDate
    ? new Date(`${company.startDate}T00:00:00`).getFullYear().toString()
    : "";
}

export function getPackageValue(packageDetails: string) {
  const normalizedPackage = packageDetails.replace(/,/g, "").toLowerCase();
  const rawAmount = Number(normalizedPackage.match(/[\d.]+/)?.[0] ?? 0);

  if (Number.isNaN(rawAmount)) return 0;

  const amount = normalizedPackage.includes("k") ? rawAmount * 1000 : rawAmount;

  if (normalizedPackage.includes("month")) return (amount * 12) / 100000;

  return amount;
}

export function getAttachmentName(attachment: string) {
  const cleanAttachment = attachment.split("?")[0];
  return decodeURIComponent(cleanAttachment.split("/").pop() || attachment);
}

export function getWebsiteHref(website: string) {
  const trimmedWebsite = website.trim();
  if (!trimmedWebsite) return "";

  return /^https?:\/\//i.test(trimmedWebsite)
    ? trimmedWebsite
    : `https://${trimmedWebsite}`;
}
