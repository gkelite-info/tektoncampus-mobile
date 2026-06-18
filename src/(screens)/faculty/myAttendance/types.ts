export interface AttendanceRecord {
    date: string;
    checkIn: string;
    checkOut: string;
    totalHours: string;
    status: string;
    lateBy: string;
    earlyOut: string;
    classDetail: string;
    reason: string;
}

export interface AttendanceStats {
    todayStatus: string | null;
    totalWorkingDays: number;
    leavesTaken: number;
    remainingLeaves: number;
}

export interface FacultyProfile {
    name: string;
    image: string;
    facultyId: string | null;
    branch: string;
    mobile: string;
    email: string;
    joiningDate: string;
    experience: string;
    collegeEducationType?: string | null;
}

export interface AnalyticsFacultyProfile {
    name: string;
    department: string;
    employeeId: string;
    experience: string;
    leavesTaken: number;
    workingDays: number;
    collegeEducationType?: string | null;
}

export type ChartDataPoint = {
    month: string;
    performance: number;
    attendance: number;
};
