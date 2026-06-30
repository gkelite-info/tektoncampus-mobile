import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Calendar, MagnifyingGlass, CheckCircle, Clock, XCircle, X } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import { useUser } from "@/utils/context/UserContext";



import {
  fetchStudentLeaveCounts,
  fetchStudentLeaves,
} from "@/lib/helpers/student/leaveRequests/studentLeaveAPI";

import RequestLeaveModal from "./modals/RequestLeaveModal";
import StudentLeaveDetailsModal from "./modals/StudentLeaveDetailsModal";

export default function LeaveRequestsScreen() {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const { studentId } = useUser();

  const [counts, setCounts] = useState({ all: 0, approved: 0, pending: 0, rejected: 0 });
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!studentId) return;
    
    if (isRefresh) {
      setPage(1);
      setHasMore(true);
      if (!refreshing) setLoading(true);
    }

    try {
      const newCounts = await fetchStudentLeaveCounts(studentId, selectedDate);
      setCounts(newCounts);

      const currentPage = isRefresh ? 1 : page;
      const { data, totalCount } = await fetchStudentLeaves(
        studentId,
        currentPage,
        LIMIT,
        activeTab,
        debouncedQuery,
        selectedDate
      );

      if (isRefresh) {
        setLeaves(data);
      } else {
        setLeaves((prev) => [...prev, ...data]);
      }

      setHasMore(leaves.length + data.length < totalCount);
    } catch (err) {
      console.error("Failed to load leaves", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId, activeTab, debouncedQuery, selectedDate, page]);

  useEffect(() => {
    loadData(true);
  }, [activeTab, debouncedQuery, selectedDate, studentId]);

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      setPage((prev) => prev + 1);
      loadData();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const statsCards = [
    { type: "Total", count: counts.all, color: "#9CA3AF" },
    { type: "Approved", count: counts.approved, color: "#10B981" },
    { type: "Pending", count: counts.pending, color: "#F59E0B" },
    { type: "Rejected", count: counts.rejected, color: "#EF4444" }
  ];

  const renderStatsCard = () => (
    <View className="flex-row justify-between mb-5" style={{ gap: 8 }}>
      {statsCards.map((bal, idx) => (
        <View key={idx} className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 items-center">
          <Text className="text-[18px] text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
            {bal.count.toString().padStart(2, '0')}
          </Text>
          <Text className="text-slate-400 text-[9px] text-center mt-1 uppercase" style={{ fontFamily: fonts.bold }}>
            {t(bal.type, bal.type)}
          </Text>
          <View className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: bal.color }} />
        </View>
      ))}
    </View>
  );

  const renderFilters = () => (
    <View className="mb-4 space-y-3">
      {/* Search & Date Row */}
      <View className="flex-row gap-2">
        <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <MagnifyingGlass size={16} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("Search leaves...", "Search leaves...")}
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-xs text-slate-700 h-5 p-0"
            style={{ fontFamily: fonts.regular }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={14} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity 
          className="bg-white border border-slate-200 rounded-xl px-3 items-center justify-center"
          onPress={() => {
            setSelectedDate(selectedDate ? undefined : new Date().toISOString().split('T')[0]);
          }}
        >
          <Calendar size={18} color={selectedDate ? "#43C17A" : "#64748B"} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 pt-2 pb-1">
        {(["all", "approved", "pending", "rejected"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full border ${activeTab === tab ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
          >
            <Text 
              className={`text-[10px] capitalize ${activeTab === tab ? 'text-emerald-700' : 'text-slate-500'}`} 
              style={{ fontFamily: activeTab === tab ? fonts.bold : fonts.medium }}
            >
              {t(tab, tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLeaveCard = ({ item }: { item: any }) => {
    let icon, statusStyle, statusText;
    
    switch (item.status) {
      case "approved":
        icon = <CheckCircle size={14} color="#10B981" weight="fill" />;
        statusStyle = "bg-emerald-50 border-emerald-100 text-emerald-700";
        statusText = t("Approved", "Approved");
        break;
      case "rejected":
        icon = <XCircle size={14} color="#EF4444" weight="fill" />;
        statusStyle = "bg-red-50 border-red-100 text-red-700";
        statusText = t("Rejected", "Rejected");
        break;
      default:
        icon = <Clock size={14} color="#F59E0B" weight="fill" />;
        statusStyle = "bg-amber-50 border-amber-100 text-amber-700";
        statusText = t("Pending", "Pending");
        break;
    }

    return (
      <View className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Text className="text-slate-800 text-sm" style={{ fontFamily: fonts.bold }}>
                {item.fromDate} - {item.toDate}
              </Text>
              <View className="w-1 h-1 bg-slate-300 rounded-full" />
              <Text className="text-emerald-600 text-xs" style={{ fontFamily: fonts.bold }}>
                {item.days} {t("Days", "Days")}
              </Text>
            </View>
            <Text className="text-slate-500 text-[10px] uppercase" style={{ fontFamily: fonts.bold }}>
              {item.leaveType}
            </Text>
          </View>
          
          <View className={`flex-row items-center gap-1 px-2 py-1 rounded-md border ${statusStyle.split(" text-")[0]}`}>
            {icon}
            <Text className={`text-[9px] ${statusStyle.match(/text-\w+-\d+/)?.[0]}`} style={{ fontFamily: fonts.bold }}>
              {statusText}
            </Text>
          </View>
        </View>

        <Text className="text-slate-600 text-xs mb-3 line-clamp-2" style={{ fontFamily: fonts.medium }}>
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
          <View className="flex-1 pr-2">
            <Text className="text-slate-400 text-[9px] uppercase" style={{ fontFamily: fonts.bold }}>
              {t("Faculty", "Faculty")}
            </Text>
            <Text className="text-slate-700 text-xs" style={{ fontFamily: fonts.semiBold }} numberOfLines={1}>
              {item.facultyName}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setSelectedLeave(item)}
            className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <Text className="text-slate-600 text-[10px]" style={{ fontFamily: fonts.bold }}>
              {t("View Details", "View Details")}
            </Text>
          </TouchableOpacity>
        </View>

        {item.attachments && item.attachments.length > 0 && (
          <View className="mt-2 flex-row flex-wrap gap-1">
            {item.attachments.map((url: string, i: number) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => Linking.openURL(url)}
                className="bg-blue-50 px-2 py-1 rounded border border-blue-100"
              >
                <Text className="text-blue-600 text-[9px]" style={{ fontFamily: fonts.bold }}>
                  {t("Attachment", "Attachment")} {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
      <View className="px-4" style={{ paddingTop: headerHeight + 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
              {t("Leave Requests", "Leave Requests")}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>
              {t("Submit leave, track approvals", "Submit leave, track approvals")}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsRequestModalOpen(true)}
            className="bg-[#43C17A] px-3 py-2 rounded-xl"
          >
            <Text className="text-white text-xs" style={{ fontFamily: fonts.bold }}>
              {t("Request Leave", "Request Leave")}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={leaves}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {renderStatsCard()}
              {renderFilters()}
            </>
          }
          renderItem={renderLeaveCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#43C17A"]} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#43C17A" />
              </View>
            ) : (
              <View className="py-10 items-center justify-center">
                <Text className="text-slate-400 text-sm italic" style={{ fontFamily: fonts.medium }}>
                  {t("No leave requests found.", "No leave requests found.")}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            hasMore && !loading && leaves.length > 0 ? (
              <ActivityIndicator size="small" color="#9CA3AF" style={{ marginVertical: 10 }} />
            ) : null
          }
        />
      </View>

      <RequestLeaveModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        studentId={studentId as number}
        onSuccess={() => loadData(true)}
      />

      {selectedLeave && (
        <StudentLeaveDetailsModal
          isOpen={!!selectedLeave}
          onClose={() => setSelectedLeave(null)}
          leaveData={selectedLeave}
          currentStudentId={studentId as number}
        />
      )}
    </SafeAreaView>
  );
}
