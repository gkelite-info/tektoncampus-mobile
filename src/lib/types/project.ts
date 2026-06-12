export type ProjectCardProps = {
    projectId?: number;
    title: string;
    description: string;
    duration: string;
    techStack: string;
    mentors: { name: string; image: string }[];
    teamMembers: { name: string; image: string }[];
    marks: number;
    fileUrls: string[];
    subject?: string;
    status?: string;
    endDate?: string | null;
    collegeSubjectId?: number | null;
};
