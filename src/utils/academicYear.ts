export const extractAcademicYearNumber = (
    academicYear?: string | null
): number | null => {
    if (!academicYear) return null;

    const match = academicYear.match(/\d+/);
    return match ? Number(match[0]) : null;
};