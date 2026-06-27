export interface WellbeingIssue {
  id: string;
  title: string;
  subCategory: string;
  branch: string;
  description: string;
  dateReported: string;
  status: "Resolved" | "Rejected" | "Pending";
  attachments: { name: string; size: string }[];
}

export const wellbeingCards = [
  {
    id: "raised",
    value: "15",
    label: "Total Raised",
    bg: "#DDD4FF",
    iconColor: "#6F4EF6",
  },
  {
    id: "pending",
    value: "02",
    label: "In Pending",
    bg: "#FFE7C9",
    iconColor: "#FF9F3F",
  },
  {
    id: "resolved",
    value: "10",
    label: "Resolved",
    bg: "#DDF3E7",
    iconColor: "#009B55",
  },
  {
    id: "rejected",
    value: "13",
    label: "Rejected",
    bg: "#FFDCDD",
    iconColor: "#FF2A2A",
  },
];


