import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AttendanceTable from "../tables/AttendanceTable";
import { AttendanceRecord, AttendanceStats, FacultyProfile } from "../types";
import AttendanceStatusCard from "../components/AttendanceStatusCard";
import FacultyInfoCard from "../components/FacultyInfoCard";
import FacultyInfoCardShimmer from "../shimmers/FacultyInfoCardShimmer";
import AttendanceStatusCardShimmer from "../shimmers/AttendanceStatusCardShimmer";
import AttendanceTableShimmer from "../shimmers/AttendanceTableShimmer";
import { useUser } from "@/utils/context/UserContext";
import { getAttendanceData } from "@/lib/helpers/faculty/myAttendance/getAttendanceData";
import { getAttendanceMonthlyStats } from "@/lib/helpers/faculty/myAttendance/getAttendanceMonthlyStats";

const mockProfile: FacultyProfile = {
  name: "Harsha Sharma",
  image: "",
  facultyId: null,
  branch: "CSE",
  mobile: "9876432134",
  email: "harshasharma@gmail.com",
  joiningDate: "12 July 2019",
  experience: "6 years",
};

export const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function AttendancePage() {
  const { facultyId, email, collegeBranchCode, profilePhoto, mobile, fullName, dateOfJoining,
    professionalExperienceYears, collegeEducationType, userId, identifierId } = useUser()
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const itemsPerPage = 15;

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await getAttendanceMonthlyStats({
            userId: Number(userId),
            month: selectedMonth,
            year: selectedYear
          });
        setStats({
          todayStatus: res.todayStatus,
          totalWorkingDays: res.totalWorkingDays,
          leavesTaken: 0,
          remainingLeaves: 0
        });

      } catch (err) {
        setStats({
          todayStatus: null,
          totalWorkingDays: 0,
          leavesTaken: 0,
          remainingLeaves: 0
        });
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!userId) return;

    const fetchAttendance = async () => {
      setTableLoading(true);
      try {
        const res = await getAttendanceData({
          userId: Number(userId),
          month: selectedMonth,
          year: selectedYear,
          page: currentPage,
          limit: itemsPerPage,
        });

        setRecords(res.records);
        setTotalItems(res.total);
      } catch (err) {
        setRecords([]);
        setTotalItems(0);
      } finally {
        setTableLoading(false);
      }
    };

    fetchAttendance();
  }, [userId, selectedMonth, selectedYear, currentPage]);

  useEffect(() => {
    if (!facultyId || !identifierId) return;
    setInfoLoading(true);
    try {
      const updatedProfile: FacultyProfile = {
        ...mockProfile,
        name: fullName!,
        mobile: mobile!,
        facultyId: identifierId!,
        branch: collegeBranchCode ?? mockProfile.branch,
        email: email ?? mockProfile.email,
        joiningDate: formatDate(dateOfJoining),
        image: profilePhoto ?? "",
        experience: professionalExperienceYears ? `${professionalExperienceYears} ${Number(professionalExperienceYears) > 1 ? 'years' : 'year'} ` : "—"
      };

      setProfile(updatedProfile);
    } finally {
      setInfoLoading(false);
    }
  }, [facultyId, collegeBranchCode, email, profilePhoto, fullName, dateOfJoining, mobile, professionalExperienceYears]);

  return (
    <View className="flex-col w-full flex-1 max-md:px-2">
      <View className="flex-col md:flex-row mb-4 w-full">
        {infoLoading || !profile ? (
          <FacultyInfoCardShimmer />
        ) : (
          <FacultyInfoCard
            profile={{ ...profile, collegeEducationType }}
            loading={false}
          />
        )}

        {(statsLoading || !stats) ? (
          <AttendanceStatusCardShimmer />
        ) : (
          <AttendanceStatusCard stats={stats} />
        )}
      </View>

      {tableLoading ? (
        <AttendanceTableShimmer />
      ) : (
        <AttendanceTable
          records={records}
          month={
            [
              "JAN", "FEB", "MAR", "APR",
              "MAY", "JUN", "JUL", "AUG",
              "SEP", "OCT", "NOV", "DEC"
            ][selectedMonth - 1]
          }
          year={String(selectedYear)}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onMonthYearChange={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
            setCurrentPage(1);
          }}
        />
      )}
    </View>
  );
}
