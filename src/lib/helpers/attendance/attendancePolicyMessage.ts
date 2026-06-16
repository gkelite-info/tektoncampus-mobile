export type AttendancePolicyMessageInput = {
    studentName: string;
    attendedClasses: number;
    totalClasses: number;
    minAttendance?: number | null;
    audience?: "faculty" | "student";
};

export type AttendancePolicyMessageResult = {
    minAttendance: number;
    percentage: number;
    classesNeeded: number;
    message: string;
};

const DEFAULT_MIN_ATTENDANCE = 75;

export function calculateAttendancePercentage(
    attendedClasses: number,
    totalClasses: number,
) {
    if (totalClasses <= 0) return 0;
    return Math.floor((attendedClasses / totalClasses) * 100);
}

function getFirstName(name: string) {
    return name.trim().split(/\s+/)[0] || "This student";
}

export function calculateClassesNeeded(
    attendedClasses: number,
    totalClasses: number,
    minAttendance: number,
) {
    if (minAttendance <= 0) return 0;
    if (minAttendance >= 100) {
        return attendedClasses >= totalClasses ? 0 : Number.POSITIVE_INFINITY;
    }

    const required =
        (minAttendance * totalClasses - 100 * attendedClasses) /
        (100 - minAttendance);

    return Math.max(0, Math.ceil(required));
}

export function buildAttendancePolicyMessage({
    studentName,
    attendedClasses,
    totalClasses,
    minAttendance,
    audience = "faculty",
}: AttendancePolicyMessageInput): AttendancePolicyMessageResult {
    const safeAttended = Math.max(0, attendedClasses);
    const safeTotal = Math.max(0, totalClasses);
    const threshold =
        typeof minAttendance === "number" && Number.isFinite(minAttendance)
            ? minAttendance
            : DEFAULT_MIN_ATTENDANCE;
    const percentage = calculateAttendancePercentage(safeAttended, safeTotal);
    const classesNeeded = calculateClassesNeeded(
        safeAttended,
        safeTotal,
        threshold,
    );
    const name = getFirstName(studentName);

    if (safeTotal === 0) {
        return {
            minAttendance: threshold,
            percentage,
            classesNeeded: 0,
            
            message: `${name}'s minimum attendance is ${threshold}%. No attendance records yet. Start tracking from the next class.`,
        };
    }

    if (percentage >= threshold) {
        return {
            minAttendance: threshold,
            percentage,
            classesNeeded: 0,
            
            message:
                audience === "student"
                    ? `Hi ${name}, your attendance is ${percentage}%, safely above the ${threshold}%. Keep it up.`
                    : `${name} has ${percentage}% attendance, safely above the ${threshold}%. Eligibility looks safe.`,
        };
    }

    const classText = classesNeeded === 1 ? "class" : "classes";

    if (percentage >= threshold - 5) {
        return {
            minAttendance: threshold,
            percentage,
            classesNeeded,
            
            message: `${name}'s minimum attendance is ${threshold}%. Current attendance is ${percentage}%. Attend ${classesNeeded} more ${classText} to reach it.`,
        };
    }

    return {
        minAttendance: threshold,
        percentage,
        classesNeeded,
        
        message: `${name}'s minimum attendance is ${threshold}%. Current attendance is ${percentage}%. Attend ${classesNeeded} more ${classText} to become eligible.`,
    };
}
