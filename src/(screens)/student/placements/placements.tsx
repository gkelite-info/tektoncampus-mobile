import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { fonts } from "@/constants/fonts";

import { useStudent } from "@/utils/context/student/useStudent";
import { fetchStudentPlacementCompanies, StudentPlacementCompany } from "@/lib/helpers/student/placements/getStudentPlacementCompanies";
import {
  applyForStudentPlacement,
  fetchStudentPlacementApplications,
  mapApplicationToAppliedPlacement,
  withdrawStudentPlacementApplication } from
"@/lib/helpers/student/placements/studentPlacementApplications";
import { fetchStudentPlacementFilterOptions } from "@/lib/helpers/placements/getPlacementFilterOptions";

import SharedPlacementCard from "@/components/SharedPlacements/components/SharedPlacementCard";
import SharedPlacementModal from "@/components/SharedPlacements/components/SharedPlacementModal";
import ConfirmActionModal from "@/components/SharedPlacements/components/ConfirmActionModal";
import SharedFilterBar, { FilterConfig } from "@/components/SharedPlacements/components/SharedFilterBar";
import { getPlacementCycle } from "@/components/SharedPlacements/utils/placementFormatters";
import { mapToSharedPlacement } from "@/components/SharedPlacements/types/sharedPlacement.types";

type TabType = "opportunities" | "applications";

type AppliedPlacement = {
  placementId: number;
  appliedOn: string;
};

export default function StudentPlacementsScreen() {const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const {
    loading: studentLoading,
    studentId,
    collegeId,
    collegeEducationId,
    collegeBranchId,
    collegeAcademicYearId
  } = useStudent();

  const [activeTab, setActiveTab] = useState<TabType>("opportunities");
  const [placements, setPlacements] = useState<StudentPlacementCompany[]>([]);
  const [appliedPlacements, setAppliedPlacements] = useState<AppliedPlacement[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [filterLoadingKey, setFilterLoadingKey] = useState<"cycle" | "eligibility" | "sort" | null>(null);
  const [serverCycles, setServerCycles] = useState<string[]>([]);

  const [cycle, setCycle] = useState<string>("");
  const [eligibility, setEligibility] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Recently Uploaded");

  const [selectedPlacement, setSelectedPlacement] = useState<StudentPlacementCompany | null>(null);
  const [placementToApply, setPlacementToApply] = useState<StudentPlacementCompany | null>(null);
  const [placementToWithdraw, setPlacementToWithdraw] = useState<StudentPlacementCompany | null>(null);

  const [applyingPlacementId, setApplyingPlacementId] = useState<number | null>(null);
  const [withdrawingPlacementId, setWithdrawingPlacementId] = useState<number | null>(null);

  useEffect(() => {
    if (studentLoading) return;
    if (!collegeId || !collegeEducationId || !collegeBranchId || !collegeAcademicYearId) {
      setPlacements([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadPlacements = async () => {
      setIsLoading(true);
      try {
        const data = await fetchStudentPlacementCompanies({
          collegeId,
          collegeEducationId,
          collegeBranchId,
          collegeAcademicYearId
        });
        if (isMounted) setPlacements(data);
      } catch (error) {
        console.error("Failed to load student placements", error);
        if (isMounted) setPlacements([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPlacements();
    return () => {isMounted = false;};
  }, [studentLoading, collegeId, collegeEducationId, collegeBranchId, collegeAcademicYearId]);

  const loadFilterOptions = useCallback(
    async (loadingKey: "cycle" | "eligibility" | "sort") => {
      if (!collegeId || !collegeEducationId) return;
      setFilterLoadingKey(loadingKey);
      try {
        const options = await fetchStudentPlacementFilterOptions({
          collegeId,
          collegeEducationId
        });
        setServerCycles(options.cycles);
      } catch (error) {
        console.error("Failed to refresh filter options:", error);
      } finally {
        setFilterLoadingKey(null);
      }
    },
    [collegeEducationId, collegeId]
  );

  useEffect(() => {
    if (studentLoading || !studentId) {
      setAppliedPlacements([]);
      return;
    }

    let isMounted = true;
    const loadApplications = async () => {
      try {
        const applications = await fetchStudentPlacementApplications(studentId);
        if (isMounted) {
          setAppliedPlacements(applications.map(mapApplicationToAppliedPlacement));
        }
      } catch (error) {
        console.error("Failed to load applications", error);
        if (isMounted) setAppliedPlacements([]);
      }
    };

    loadApplications();
    return () => {isMounted = false;};
  }, [studentId, studentLoading]);

  const cycles = useMemo(() => {
    const startYears = placements.map(getPlacementCycle).filter(Boolean);
    const currentYear = new Date().getFullYear();
    const defaultYears = ["2025", String(currentYear - 1), String(currentYear), String(currentYear + 1), String(currentYear + 2)];
    const uniqueYears = Array.from(new Set([...defaultYears, ...startYears])).sort((a, b) => Number(b) - Number(a));
    return uniqueYears;
  }, [placements, serverCycles]);

  useEffect(() => {
    const currentYear = String(new Date().getFullYear());
    if (!cycle && cycles.length > 0) {
      setCycle(cycles.includes(currentYear) ? currentYear : cycles[0]);
    }
  }, [cycle, cycles]);

  const appliedByPlacementId = useMemo(
    () => new Map(appliedPlacements.map((app) => [app.placementId, app.appliedOn])),
    [appliedPlacements]
  );

  const handleConfirmApply = async () => {
    if (!placementToApply || !studentId) return;

    setApplyingPlacementId(placementToApply.id);
    try {
      const application = await applyForStudentPlacement({
        studentId,
        placementCompanyId: placementToApply.id
      });
      const appliedPlacement = mapApplicationToAppliedPlacement(application);
      setAppliedPlacements((prev) => [...prev.filter((i) => i.placementId !== appliedPlacement.placementId), appliedPlacement]);
      setPlacementToApply(null);
      setActiveTab("applications");
    } catch (error) {
      console.error("Failed to apply", error);
    } finally {
      setApplyingPlacementId(null);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!placementToWithdraw || !studentId) return;

    setWithdrawingPlacementId(placementToWithdraw.id);
    try {
      await withdrawStudentPlacementApplication({
        studentId,
        placementCompanyId: placementToWithdraw.id
      });
      setAppliedPlacements((prev) => prev.filter((app) => app.placementId !== placementToWithdraw.id));
      setPlacementToWithdraw(null);
    } catch (error) {
      console.error("Failed to withdraw", error);
    } finally {
      setWithdrawingPlacementId(null);
    }
  };

  const visiblePlacements = useMemo(() => {
    let list = [...placements];

    if (activeTab === "applications") {
      list = list.filter((placement) => appliedByPlacementId.has(placement.id));
    }

    if (cycle) list = list.filter((placement) => getPlacementCycle(placement) === cycle);
    if (eligibility === "Eligible") list = list.filter((placement) => placement.isEligible);else
    if (eligibility === "Not Eligible") list = list.filter((placement) => !placement.isEligible);

    list.sort((a, b) => {
      switch (sortBy) {
        case "Recently Uploaded":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id;
        case "Oldest First":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id - b.id;
        case "Company Name A-Z":
          return a.companyName.localeCompare(b.companyName);
        case "Company Name Z-A":
          return b.companyName.localeCompare(a.companyName);
        default:
          return 0;
      }
    });

    return list;
  }, [activeTab, appliedByPlacementId, cycle, eligibility, placements, sortBy]);

  const filters: FilterConfig[] = [
  {
    id: 'cycle',
    label: 'Cycle',
    options: cycles.map((c) => ({ label: c, value: c })),
    selectedValue: cycle,
    onSelect: (v) => {setCycle(v);loadFilterOptions("cycle");},
    isLoading: filterLoadingKey === "cycle"
  },
  {
    id: 'eligibility',
    label: 'Eligibility',
    options: [
    { label: 'All', value: 'All' },
    { label: 'Eligible', value: 'Eligible' },
    { label: 'Not Eligible', value: 'Not Eligible' }],

    selectedValue: eligibility,
    onSelect: (v) => {setEligibility(v);loadFilterOptions("eligibility");},
    isLoading: filterLoadingKey === "eligibility"
  },
  {
    id: 'sort',
    label: 'Sort By',
    options: [
    { label: 'Recently Uploaded', value: 'Recently Uploaded' },
    { label: 'Oldest First', value: 'Oldest First' },
    { label: 'Company Name A-Z', value: 'Company Name A-Z' },
    { label: 'Company Name Z-A', value: 'Company Name Z-A' }],

    selectedValue: sortBy,
    onSelect: (v) => {setSortBy(v);loadFilterOptions("sort");},
    isLoading: filterLoadingKey === "sort"
  }];


  if (studentLoading || isLoading && !placements.length) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC] items-center justify-center">
                <ActivityIndicator size="large" color="#43C17A" />
            </SafeAreaView>);

  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <View style={{ paddingTop: headerHeight + 16 }} className="px-4 flex-1">
                <View className="mb-4">
                    <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Placements", "Placements")}

          </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.TrackManageandM", "Track, Manage, and Maintain Student Placement Status")}

          </Text>
                </View>

                <SharedFilterBar filters={filters} />

                <View className="flex-row mb-4 mt-2">
                    <TouchableOpacity
            onPress={() => setActiveTab("opportunities")}
            className="mr-4 pb-1"
            style={{ borderBottomWidth: activeTab === "opportunities" ? 2 : 0, borderBottomColor: "#43C17A" }}>
            
                        <Text
              className={`text-[16px] ${activeTab === "opportunities" ? "text-[#43C17A]" : "text-[#4B4B4B]"}`}
              style={{ fontFamily: activeTab === "opportunities" ? fonts.bold : fonts.medium }}>{t("Auto.Common.Opportunities", "Opportunities")}


            </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
            onPress={() => setActiveTab("applications")}
            className="pb-1"
            style={{ borderBottomWidth: activeTab === "applications" ? 2 : 0, borderBottomColor: "#43C17A" }}>
            
                        <Text
              className={`text-[16px] ${activeTab === "applications" ? "text-[#43C17A]" : "text-[#4B4B4B]"}`}
              style={{ fontFamily: activeTab === "applications" ? fonts.bold : fonts.medium }}>{t("Auto.Common.MyApplications", "My Applications")}


            </Text>
                    </TouchableOpacity>
                </View>

                {isLoading || filterLoadingKey ?
        <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="small" color="#43C17A" />
                    </View> :

        <FlatList
          data={visiblePlacements}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() =>
          <View className="py-16 items-center">
                                <Text className="text-sm text-gray-500" style={{ fontFamily: fonts.medium }}>
                                    {activeTab === "applications" ?
              "You have not applied to any opportunities yet" :
              `No placement drives found for ${cycle}`}
                                </Text>
                            </View>
          }
          renderItem={({ item }) => {
            const appliedOn = appliedByPlacementId.get(item.id);
            const isApplied = Boolean(appliedOn);
            return (
              <SharedPlacementCard
                company={mapToSharedPlacement(item, "student")}
                role="student"
                isApplied={isApplied}
                appliedOn={appliedOn}
                isApplying={applyingPlacementId === item.id}
                statusLabel={isApplied ? "Applied" : undefined}
                onApply={() => setPlacementToApply(item)}
                onWithdraw={() => setPlacementToWithdraw(item)}
                onClick={() => setSelectedPlacement(item)} />);


          }} />

        }
            </View>

            {selectedPlacement &&
      <SharedPlacementModal
        company={mapToSharedPlacement(selectedPlacement, "student")}
        role="student"
        visible={!!selectedPlacement}
        onClose={() => setSelectedPlacement(null)} />

      }

            {placementToApply &&
      <ConfirmActionModal
        title={t("Auto.Attr.Applyforplaceme", "Apply for placement?")}
        description={`Do you want to apply for ${placementToApply.companyName}?`}
        confirmLabel="Apply"
        loadingLabel="Applying"
        isLoading={applyingPlacementId === placementToApply.id}
        onCancel={() => setPlacementToApply(null)}
        onConfirm={handleConfirmApply} />

      }

            {placementToWithdraw &&
      <ConfirmActionModal
        title={t("Auto.Attr.Withdrawapplica", "Withdraw application?")}
        description={`Do you want to withdraw your application for ${placementToWithdraw.companyName}?`}
        confirmLabel="Withdraw"
        loadingLabel="Withdrawing"
        confirmClassName="bg-red-600"
        isLoading={withdrawingPlacementId === placementToWithdraw.id}
        onCancel={() => setPlacementToWithdraw(null)}
        onConfirm={handleConfirmWithdraw} />

      }
        </SafeAreaView>);

}