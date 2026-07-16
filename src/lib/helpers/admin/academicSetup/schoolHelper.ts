export const SCHOOL_BOARDS = ["CBSE", "SSC", "ICSE", "ISC", "IB"];

export const isSchoolEducation = (type: string | null | undefined): boolean => {
    if (!type) return false;
    return SCHOOL_BOARDS.includes(type.trim().toUpperCase());
};
