import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { fonts } from "@/constants/fonts";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { getPlacementCompanies, PlacementCompany } from "@/lib/helpers/placements/getPlacementCompanies";
import { fetchAdminPlacementFilterOptions } from "@/lib/helpers/placements/getPlacementFilterOptions";
import SharedPlacementCard from "@/components/SharedPlacements/components/SharedPlacementCard";
import SharedPlacementModal from "@/components/SharedPlacements/components/SharedPlacementModal";
import SharedFilterBar, { FilterConfig } from "@/components/SharedPlacements/components/SharedFilterBar";
import { mapToSharedPlacement } from "@/components/SharedPlacements/types/sharedPlacement.types";
const PAGE_SIZE = 10;
export default function FacultyPlacementsScreen() {
  const {
    t
  } = useTranslation();
  const headerHeight = useHeaderHeight();
  const {
    loading: facultyLoading,
    collegeId
  } = useFaculty();
  const [placements, setPlacements] = useState<PlacementCompany[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filterLoadingKey, setFilterLoadingKey] = useState<"cycle" | "branch" | "status" | "sort" | null>(null);
  const [serverCycles, setServerCycles] = useState<string[]>([]);
  const [serverBranches, setServerBranches] = useState<string[]>([]);
  const [cycle, setCycle] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("All");
  const [status, setStatus] = useState<"All" | "Open" | "Completed">("All");
  const [sortBy, setSortBy] = useState<string>("Recently Uploaded");
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementCompany | null>(null);
  const loadFilterOptions = useCallback(async (loadingKey: "cycle" | "branch" | "status" | "sort") => {
    if (!collegeId) return;
    setFilterLoadingKey(loadingKey);
    try {
      const options = await fetchAdminPlacementFilterOptions(collegeId);
      setServerCycles(options.cycles);
      setServerBranches(options.branches);
    } catch (error) {
      console.error("Failed to refresh filter options:", error);
    } finally {
      setFilterLoadingKey(null);
    }
  }, [collegeId]);
  const fetchPlacements = async (pageNum: number, isInitial: boolean = false) => {
    if (!collegeId) return;
    if (isInitial) setIsLoading(true);else setIsFetchingMore(true);
    try {
      const result = await getPlacementCompanies({
        collegeId,
        page: pageNum,
        pageSize: PAGE_SIZE,
        includeExpired: true,
        cycle: cycle || undefined,
        branchName,
        status,
        sortBy: sortBy as any
      });
      if (isInitial) {
        setPlacements(result.data);
      } else {
        setPlacements(prev => [...prev, ...result.data]);
      }
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch faculty placements:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };
  useEffect(() => {
    if (facultyLoading || !collegeId) return;
    loadFilterOptions("cycle"); // initial load
  }, [facultyLoading, collegeId]);
  useEffect(() => {
    if (serverCycles.length > 0 && !cycle) {
      const currentYear = String(new Date().getFullYear());
      setCycle(serverCycles.includes(currentYear) ? currentYear : serverCycles[0]);
    }
  }, [serverCycles, cycle]);
  useEffect(() => {
    if (facultyLoading || !collegeId || !cycle) return;
    setPage(1);
    fetchPlacements(1, true);
  }, [facultyLoading, collegeId, cycle, branchName, status, sortBy]);
  const handleLoadMore = () => {
    if (isFetchingMore || isLoading || placements.length >= totalCount) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPlacements(nextPage, false);
  };
  const filters: FilterConfig[] = [{
    id: 'cycle',
    label: 'Cycle',
    options: serverCycles.map(c => ({
      label: c,
      value: c
    })),
    selectedValue: cycle,
    onSelect: v => setCycle(v),
    isLoading: filterLoadingKey === "cycle"
  }, {
    id: 'branch',
    label: 'Branch',
    options: [{
      label: 'All',
      value: 'All'
    }, ...serverBranches.map(b => ({
      label: b,
      value: b
    }))],
    selectedValue: branchName,
    onSelect: v => setBranchName(v),
    isLoading: filterLoadingKey === "branch"
  }, {
    id: 'status',
    label: 'Status',
    options: [{
      label: 'All',
      value: 'All'
    }, {
      label: 'Open',
      value: 'Open'
    }, {
      label: 'Completed',
      value: 'Completed'
    }],
    selectedValue: status,
    onSelect: v => setStatus(v as any),
    isLoading: filterLoadingKey === "status"
  }, {
    id: 'sort',
    label: 'Sort By',
    options: [{
      label: 'Recently Uploaded',
      value: 'Recently Uploaded'
    }, {
      label: 'Oldest First',
      value: 'Oldest First'
    }, {
      label: 'Company Name A-Z',
      value: 'Company Name A-Z'
    }, {
      label: 'Company Name Z-A',
      value: 'Company Name Z-A'
    }, {
      label: 'CTC (High to Low)',
      value: 'CTC (High to Low)'
    }, {
      label: 'CTC (Low to High)',
      value: 'CTC (Low to High)'
    }],
    selectedValue: sortBy,
    onSelect: v => setSortBy(v),
    isLoading: filterLoadingKey === "sort"
  }];
  if (facultyLoading || isLoading && placements.length === 0) {
    return <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC] items-center justify-center">
                <ActivityIndicator size="large" color="#43C17A" />
            </SafeAreaView>;
  }
  return <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <View style={{
      paddingTop: headerHeight + 16
    }} className="px-4 flex-1">
                <View className="mb-4">
                    <Text className="text-2xl text-[#1E293B]" style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.Placements", "Placements")}

          </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{
          fontFamily: fonts.regular
        }}>{t("Auto.Common.ManagePlacement", "Manage Placement Opportunities")}

          </Text>
                </View>

                <SharedFilterBar filters={filters} />

                <FlatList data={placements} keyExtractor={item => item.id.toString() + item.name} showsVerticalScrollIndicator={false} contentContainerStyle={{
        paddingBottom: 100
      }} onEndReached={handleLoadMore} onEndReachedThreshold={0.5} ListEmptyComponent={() => {
        const {
          t
        } = useTranslation();
        return <View className="py-16 items-center">
                            <Text className="text-sm text-gray-500" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.Noplacementdriv", "No placement drives found")}

            </Text>
                        </View>;
      }} ListFooterComponent={() => isFetchingMore ? <View className="py-4 items-center">
                                <ActivityIndicator size="small" color="#43C17A" />
                            </View> : null} renderItem={({
        item
      }) => <SharedPlacementCard company={mapToSharedPlacement(item, "faculty")} role="faculty" onClick={() => setSelectedPlacement(item)} />} />
        
            </View>

            {selectedPlacement && <SharedPlacementModal company={mapToSharedPlacement(selectedPlacement, "faculty")} role="faculty" visible={!!selectedPlacement} onClose={() => setSelectedPlacement(null)} />}
        </SafeAreaView>;
}