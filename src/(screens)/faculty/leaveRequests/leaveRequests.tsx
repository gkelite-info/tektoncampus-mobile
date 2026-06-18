import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MagnifyingGlass, CalendarBlank, Users, User, Paperclip, PencilSimple } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import { useUser } from '@/utils/context/UserContext';
import { getFacultyIdByUserId } from '@/lib/helpers/faculty/facultyAPI';
import { fetchFacultyLeaves, fetchStudentLeavesForFaculty, fetchStudentLeaveCounts, fetchFacultyLeaveCounts, fetchTaggedLeaves, fetchTaggedLeaveCounts } from '@/lib/helpers/faculty/leaveRequests/facultyLeaveAPI';
import RequestLeaveModal from './modals/RequestLeaveModal';
import { Avatar } from '@/components/Avatar';
import ConfirmStatusModal from './modals/ConfirmStatusModal';
import FacultyLeaveDetailsModal from './modals/FacultyLeaveDetailsModal';
export default function LeaveRequestsScreen() {
  const {
    t
  } = useTranslation();
  const {
    userId
  } = useUser();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [mainTab, setMainTab] = useState<'students' | 'my_leaves' | 'tagged'>('students');
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    leaveId: number | null;
    action: "Approved" | "Rejected" | null;
  }>({
    isOpen: false,
    leaveId: null,
    action: null
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [tableData, setTableData] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLeaveData, setSelectedLeaveData] = useState<any>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    if (!userId) return;
    getFacultyIdByUserId(userId as number).then(id => setFacultyId(id)).catch(() => Toast.show({
      type: 'error',
      text1: 'Faculty context not found'
    }));
  }, [userId]);
  const loadData = async (loadingIndicator = true) => {
    if (!facultyId) return;
    if (loadingIndicator) setIsLoading(true);
    try {
      if (mainTab === 'students') {
        const [tableRes, countRes] = await Promise.all([fetchStudentLeavesForFaculty(facultyId, page, 10, activeTab, debouncedSearch), fetchStudentLeaveCounts(facultyId)]);
        setTableData(page === 1 ? tableRes.data : [...tableData, ...tableRes.data]);
        setTotalItems(tableRes.totalCount);
        setCounts(countRes);
      } else if (mainTab === 'tagged') {
        const [tableRes, countRes] = await Promise.all([fetchTaggedLeaves(facultyId, page, 10, activeTab, debouncedSearch), fetchTaggedLeaveCounts(facultyId)]);
        setTableData(page === 1 ? tableRes.data : [...tableData, ...tableRes.data]);
        setTotalItems(tableRes.totalCount);
        setCounts(countRes);
      } else {
        const [tableRes, countRes] = await Promise.all([fetchFacultyLeaves(facultyId, page, 10, activeTab, debouncedSearch), fetchFacultyLeaveCounts(facultyId)]);
        setTableData(page === 1 ? tableRes.data : [...tableData, ...tableRes.data]);
        setTotalItems(tableRes.totalCount);
        setCounts(countRes);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load data'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [mainTab, facultyId, activeTab, debouncedSearch, page]);
  const handleRefresh = () => {
    setPage(1);
    setIsRefreshing(true);
    loadData(false);
  };
  const handleLoadMore = () => {
    if (tableData.length < totalItems && !isLoading) {
      setPage(prev => prev + 1);
    }
  };
  const renderStatsCard = (id: string, label: string, value: number, icon: any, activeBg: string, faintBg: string) => {
    const isActive = activeTab === id;
    let textColor = isActive ? 'text-white' : 'text-gray-500';
    let valueColor = isActive ? 'text-white' : 'text-[#282828]';
    let iconColor = isActive ? '#FFF' : '#6B7280';
    let iconBg = isActive ? 'bg-white/20' : 'bg-white/60';
    return <TouchableOpacity onPress={() => {
      setActiveTab(id as any);
      setPage(1);
    }} className={`flex-1 min-w-[80px] p-3 rounded-xl border border-white/50 ${isActive ? activeBg : faintBg}`}>
        
        <View className="flex-row items-center justify-between mb-2">
           <View className={`p-1.5 rounded-full ${iconBg}`}>
              {icon(iconColor)}
           </View>
        </View>
        <Text className={`text-[10px] font-medium mb-0.5 ${textColor}`}>{label}</Text>
        <Text className={`text-xl font-bold ${valueColor}`}>
          {String(value).padStart(2, '0')}
        </Text>
      </TouchableOpacity>;
  };
  const renderStudentLeaveCard = ({
    item
  }: {
    item: any;
  }) => {
    
    return <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-col">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row gap-3 flex-1">
           <Avatar src={item.photo} size={40} />
           <View className="flex-1">
              <Text className="text-[#282828] font-bold text-sm">{item.name}</Text>
              <Text className="text-gray-500 text-xs">{t("Auto.Common.ID", "ID:")}<Text className="font-semibold text-gray-700">{item.rollNo}</Text> • {item.branch}</Text>
              <Text className="text-gray-500 text-xs">{item.semester}</Text>
           </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${item.status === 'approved' ? 'bg-[#E7F8EE]' : item.status === 'rejected' ? 'bg-[#FFE5E5]' : 'bg-[#FFF4EB]'}`}>
          <Text className={`text-[10px] font-bold ${item.status === 'approved' ? 'text-[#43C17A]' : item.status === 'rejected' ? 'text-[#FF4B4B]' : 'text-[#FFB874]'}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View className="bg-gray-50 p-3 rounded-lg flex-row justify-between mb-3 border border-gray-100">
        <View>
          <Text className="text-xs text-gray-500 mb-0.5">{t("Auto.Common.DateRange", "Date Range")}</Text>
          <Text className="text-xs text-[#282828] font-semibold">{item.fromDate} - {item.toDate}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-500 mb-0.5">{t("Auto.Common.Days", "Days")}</Text>
          <Text className="text-xs text-[#282828] font-semibold">{item.days}{t("Auto.Common.Days", "Day(s)")}</Text>
        </View>
      </View>

      <Text className="text-xs text-gray-700 mb-3" numberOfLines={2}>
        <Text className="font-bold">{t("Auto.Common.Reason", "Reason:")}</Text>
        {item.description}
      </Text>

      {item.attachments && item.attachments.length > 0 && <View className="flex-row gap-2 mb-3">
          {item.attachments.map((url: string, idx: number) => {
          
          return <TouchableOpacity key={idx} onPress={() => Linking.openURL(url)} className="flex-row items-center bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                <Paperclip size={12} color="#2563EB" />
                <Text className="text-[10px] text-blue-600 font-medium ml-1">{t("Auto.Common.Attach", "Attach")}{idx + 1}</Text>
             </TouchableOpacity>;
        })}
        </View>}

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
         <TouchableOpacity onPress={() => {
          setSelectedLeaveData(item);
          setIsDetailsModalOpen(true);
        }} className="px-2">
        
           <Text className="text-blue-600 text-xs font-bold">{t("Auto.Common.ViewDetails", "View Details")}</Text>
         </TouchableOpacity>
         
         {item.status === 'pending' ? <View className="flex-row gap-2">
             <TouchableOpacity onPress={() => setConfirmModal({
            isOpen: true,
            leaveId: item.id,
            action: "Rejected"
          })} className="bg-[#FFE5E5] px-3 py-1.5 rounded-full">
               <Text className="text-[#FF4B4B] text-[10px] font-bold">{t("Auto.Common.Reject", "Reject")}</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setConfirmModal({
            isOpen: true,
            leaveId: item.id,
            action: "Approved"
          })} className="bg-[#E7F8EE] px-3 py-1.5 rounded-full">
               <Text className="text-[#43C17A] text-[10px] font-bold">{t("Auto.Common.Approve", "Approve")}</Text>
             </TouchableOpacity>
           </View> : <TouchableOpacity onPress={() => setConfirmModal({
          isOpen: true,
          leaveId: item.id,
          action: item.status === 'approved' ? "Rejected" : "Approved"
        })} className="flex-row items-center bg-gray-100 px-2 py-1.5 rounded-full border border-gray-200">
             <PencilSimple size={12} color="#6B7280" />
             <Text className="text-gray-600 text-[10px] font-bold ml-1">{t("Auto.Common.ChangeStatus", "Change Status")}</Text>
           </TouchableOpacity>}
      </View>
    </View>;
  };
  const renderMyLeaveCard = ({
    item
  }: {
    item: any;
  }) => {
    
    return <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-col">
       <View className="flex-row justify-between items-start mb-2">
         <View className="flex-row gap-2 items-center">
           <View className="bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
             <Text className="text-[10px] text-blue-600 font-bold uppercase">{item.leaveType}</Text>
           </View>
         </View>
         <View className={`px-2.5 py-1 rounded-full ${item.status === 'approved' ? 'bg-[#E7F8EE]' : item.status === 'rejected' ? 'bg-[#FFE5E5]' : 'bg-[#FFF4EB]'}`}>
          <Text className={`text-[10px] font-bold ${item.status === 'approved' ? 'text-[#43C17A]' : item.status === 'rejected' ? 'text-[#FF4B4B]' : 'text-[#FFB874]'}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
       </View>
       
       <View className="flex-row justify-between my-2">
        <View>
          <Text className="text-[10px] text-gray-400 font-medium">{t("Auto.Common.From", "From")}</Text>
          <Text className="text-xs text-gray-700 font-bold">{item.fromDate}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-gray-400 font-medium">{t("Auto.Common.To", "To")}</Text>
          <Text className="text-xs text-gray-700 font-bold">{item.toDate}</Text>
        </View>
       </View>

       <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-2">
         <Text className="text-[10px] text-gray-400 font-medium mb-1">{t("Auto.Common.Reason", "Reason")}</Text>
         <Text className="text-xs text-[#282828] font-medium" numberOfLines={2}>{item.description}</Text>
       </View>
       <View className="flex-row justify-between items-center mt-1">
         <Text className="text-gray-400 text-[10px]">{t("Auto.Common.TotalDays", "Total Days:")}</Text>
         <Text className="text-[#282828] text-xs font-bold">{item.days}</Text>
       </View>
    </View>;
  };
  const renderTaggedLeaveCard = ({
    item
  }: {
    item: any;
  }) => {
    
    return <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex-col">
       <View className="flex-row justify-between items-start mb-3">
         <View className="flex-row gap-3 flex-1 items-center">
            <Avatar src={item.requesterPhoto} size={40} />
            <View>
              <Text className="text-sm font-bold text-[#282828]">{item.requesterName}</Text>
              <Text className="text-xs text-blue-600 font-medium">{item.leaveType}</Text>
            </View>
         </View>
         <View className={`px-2 py-1 rounded border ${item.status === 'approved' ? 'bg-[#E7F8EE] border-[#43C17A]' : item.status === 'rejected' ? 'bg-[#FFE5E5] border-[#FF4B4B]' : 'bg-[#FFF4EB] border-[#FFB874]'}`}>
           <Text className={`text-[10px] font-bold ${item.status === 'approved' ? 'text-[#43C17A]' : item.status === 'rejected' ? 'text-[#FF4B4B]' : 'text-[#FFB874]'}`}>{item.status.toUpperCase()}</Text>
         </View>
       </View>

       <View className="bg-[#F5F7FA] rounded-lg p-3 mb-3">
         <View className="flex-row justify-between mb-2">
            <Text className="text-[11px] text-gray-500 font-medium">{t("Auto.Common.Duration", "Duration")}</Text>
            <Text className="text-[11px] font-bold text-[#282828]">{item.fromDate} - {item.toDate}</Text>
         </View>
         <View className="flex-row justify-between">
            <Text className="text-[11px] text-gray-500 font-medium">{t("Auto.Common.TotalDays", "Total Days")}</Text>
            <Text className="text-[11px] font-bold text-[#43C17A]">{item.days}{t("Auto.Common.Days", "Days")}</Text>
         </View>
       </View>
       
       <Text className="text-xs text-gray-600 italic mb-2" numberOfLines={2}>"{item.description}"</Text>
    </View>;
  };
  return <View className="flex-1 bg-[#F5F7FA]" style={{
    paddingTop: insets.top + 120
  }}>
      <View className="px-4 pt-2 pb-2">
        <View className="mb-4">
          <Text className="text-[#282828] font-bold text-2xl mb-1">
            {mainTab === 'students' ? 'Student Leaves' : mainTab === 'tagged' ? 'Tagged Leaves' : 'My Leaves'}
          </Text>
          <Text className="text-[#525252] text-xs">
            {mainTab === 'students' ? 'Manage and track leave requests from your students' : mainTab === 'tagged' ? 'Leave requests where you have been tagged by peers' : 'Track and manage your own leave requests'}
          </Text>
        </View>

        <View className="flex-row bg-gray-100 rounded-full p-1 mb-4 relative">
          <View style={[StyleSheet.absoluteFill, {
          padding: 4,
          zIndex: 0
        }]}>
            <MotiView style={{
            width: '33.33%',
            height: '100%',
            backgroundColor: '#43C17A',
            borderRadius: 9999
          }} animate={{
            translateX: mainTab === 'students' ? '0%' : mainTab === 'tagged' ? '100%' : '200%'
          }} transition={{
            type: 'spring',
            damping: 75,
            stiffness: 800
          }} />
            
          </View>

          <TouchableOpacity onPress={() => setMainTab('students')} className="flex-1 py-2 rounded-full items-center z-10">
            
            <Text className={`text-[10px] sm:text-xs font-bold ${mainTab === 'students' ? 'text-white' : 'text-gray-500'}`}>{t("Auto.Common.Students", "Students")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMainTab('tagged')} className="flex-1 py-2 rounded-full items-center z-10">
            
            <Text className={`text-[10px] sm:text-xs font-bold ${mainTab === 'tagged' ? 'text-white' : 'text-gray-500'}`}>{t("Auto.Common.Tagged", "Tagged")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMainTab('my_leaves')} className="flex-1 py-2 rounded-full items-center z-10">
            
            <Text className={`text-[10px] sm:text-xs font-bold ${mainTab === 'my_leaves' ? 'text-white' : 'text-gray-500'}`}>{t("Auto.Common.MyLeaves", "My Leaves")}</Text>
          </TouchableOpacity>
        </View>

        {mainTab === 'my_leaves' && <TouchableOpacity onPress={() => setIsRequestModalOpen(true)} className="bg-[#16284F] w-full py-3 rounded-lg items-center justify-center mb-4">
          
              <Text className="text-white text-sm font-bold">{t("Auto.Common.RequestLeave", "Request Leave")}</Text>
           </TouchableOpacity>}

        <View className="flex-row gap-2 mb-4 w-full">
           {renderStatsCard('all', 'Total', counts.all, (c: string) => <Users size={16} color={c} weight="fill" />, 'bg-[#5C98FF]', 'bg-[#EFF5FF]')}
           {renderStatsCard('approved', 'Approved', counts.approved, (c: string) => <User size={16} color={c} weight="fill" />, 'bg-[#48C37C]', 'bg-[#E7F8EE]')}
           {renderStatsCard('pending', 'Pending', counts.pending, (c: string) => <User size={16} color={c} weight="fill" />, 'bg-[#FFB874]', 'bg-[#FFF4EB]')}
           {renderStatsCard('rejected', 'Rejected', counts.rejected, (c: string) => <User size={16} color={c} weight="fill" />, 'bg-[#FF4242]', 'bg-[#FFE5E5]')}
        </View>

        <View className="flex-row items-center bg-white rounded-full px-4 h-[42px] border border-gray-200">
          <MagnifyingGlass size={18} color="#9CA3AF" />
          <TextInput className="flex-1 ml-2 text-sm text-[#282828]" placeholder={t("Auto.Attr.Searchbydescrip", "Search by description...")} placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
          
        </View>
      </View>

      {isLoading && page === 1 ? <View className="flex-1 items-center justify-center">
           <ActivityIndicator size="large" color="#43C17A" />
        </View> : <FlatList data={tableData} keyExtractor={(item, index) => `${item.id}-${index}`} renderItem={mainTab === 'students' ? renderStudentLeaveCard : mainTab === 'my_leaves' ? renderMyLeaveCard : renderTaggedLeaveCard} contentContainerStyle={{
      padding: 16,
      paddingBottom: 100
    }} showsVerticalScrollIndicator={false} onRefresh={handleRefresh} refreshing={isRefreshing} onEndReached={handleLoadMore} onEndReachedThreshold={0.5} ListEmptyComponent={<View className="items-center justify-center pt-10">
              <CalendarBlank size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4 font-medium text-sm">{t("Auto.Common.Noleaverequests", "No leave requests found.")}</Text>
            </View>} />}

      {isRequestModalOpen && <RequestLeaveModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} facultyId={facultyId!} onSuccess={() => {
      setIsRequestModalOpen(false);
      handleRefresh();
    }} />}

      {confirmModal.isOpen && <ConfirmStatusModal isOpen={confirmModal.isOpen} action={confirmModal.action!} leaveId={confirmModal.leaveId!} onClose={() => setConfirmModal({
      isOpen: false,
      leaveId: null,
      action: null
    })} onSuccess={() => {
      setConfirmModal({
        isOpen: false,
        leaveId: null,
        action: null
      });
      loadData(false);
    }} />}

      {isDetailsModalOpen && selectedLeaveData && <FacultyLeaveDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} leaveData={selectedLeaveData} facultyId={facultyId!} />}

    </View>;
}