import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native';
import tw from "twrnc";
import Toast from "react-native-toast-message";
import { getFacultyClubMembersAPI, getFacultyClubRequestsAPI, processClubRequestsAPI, removeClubMembersAPI } from "@/lib/helpers/clubActivity/facultyRequestsAPI";
import { Avatar } from "@/components/Avatar";
import { MagnifyingGlass } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
export default function RequestsList({
  clubId,
  currentFilter,
  onChangeFilter
}: {
  clubId: any;
  currentFilter: string;
  onChangeFilter: (f: string) => void;
}) {
  const {
    t
  } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const {
    userId: facultyId
  } = useUser();
  const ITEMS_PER_PAGE = 20;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInput) {
        setSearchQuery(searchInput);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);
  useEffect(() => {
    setCurrentPage(1);
    setSearchInput("");
    setSearchQuery("");
  }, [currentFilter]);
  const fetchRequests = async () => {
    if (!clubId) return;
    try {
      setIsLoading(true);
      let response;
      if (currentFilter === "accepted") {
        response = await getFacultyClubMembersAPI(parseInt(clubId, 10), currentPage, ITEMS_PER_PAGE, searchQuery);
      } else {
        response = await getFacultyClubRequestsAPI(parseInt(clubId, 10), currentFilter, currentPage, ITEMS_PER_PAGE, searchQuery);
      }
      setRequests(response.requests);
      setTotalItems(response.totalCount);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load data."
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchRequests();
  }, [clubId, currentFilter, currentPage, searchQuery]);
  const handleExecuteAction = async (type: "accept" | "reject" | "remove", reqItem: any) => {
    if (!facultyId) return Toast.show({
      type: "error",
      text1: "User not authenticated"
    });
    setIsActionLoading(true);
    try {
      const studentsData = [{
        clubId: parseInt(clubId, 10),
        studentId: reqItem.studentId
      }];
      const numericIds = [parseInt(reqItem.id, 10)];
      if (type === "remove") {
        await removeClubMembersAPI(studentsData, facultyId);
      } else {
        await processClubRequestsAPI(type as "accept" | "reject", numericIds, studentsData, facultyId);
      }
      Toast.show({
        type: "success",
        text1: `Successfully ${type}ed!`
      });
      fetchRequests();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message || "An error occurred"
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  return <View style={tw`flex-1 px-4`}>
            {}
            <View style={tw`flex-row gap-2 mb-4`}>
                {["all", "pending", "accepted"].map(filter => <TouchableOpacity key={filter} onPress={() => onChangeFilter(filter)} style={tw`rounded-full px-5 py-2 ${currentFilter === filter ? "bg-[#16284F]" : "bg-[#E7E7E7]"}`}>
          
                        <Text style={tw`text-sm font-semibold capitalize ${currentFilter === filter ? "text-white" : "text-[#000000]"}`}>
                            {filter}
                        </Text>
                    </TouchableOpacity>)}
            </View>

            {/* Search */}
            <View style={tw`flex-row items-center rounded-full bg-[#EAEAEA] px-4 py-2.5 mb-4`}>
                <TextInput placeholder={t("Auto.Attr.SearchClubMembe", "Search Club Member.....")} value={searchInput} onChangeText={setSearchInput} style={tw`flex-1 text-sm text-[#282828] p-0`} placeholderTextColor="#9ca3af" />
        
                <MagnifyingGlass size={20} color="#43C17A" />
            </View>

            <Text style={tw`text-sm font-semibold text-gray-500 mb-4`}>
                {totalItems} {currentFilter === 'all' ? 'Total' : currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}{t("Auto.Common.Requests", "Requests")}
      </Text>

            {isLoading ? <ActivityIndicator size="large" color="#43C17A" style={tw`mt-10`} /> : requests.length > 0 ? <FlatList data={requests} keyExtractor={item => item.id} contentContainerStyle={tw`pb-10`} renderItem={({
      item: req
    }) => {
      const {
        t
      } = useTranslation();
      return <View style={tw`flex-row items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-gray-100 mb-3`}>
                            <View style={tw`flex-row items-center flex-1 pr-2`}>
                                <Avatar src={req.avatar} size={40} />
                                <View style={tw`ml-3 flex-1`}>
                                    <Text style={tw`font-bold text-gray-900`} numberOfLines={1}>{req.name}</Text>
                                    <Text style={tw`text-xs text-gray-500`} numberOfLines={1}>{req.details}</Text>
                                </View>
                            </View>

                            <View style={tw`flex-row gap-2`}>
                                {req.status === "pending" ? <>
                                        <TouchableOpacity disabled={isActionLoading} onPress={() => handleExecuteAction("reject", req)} style={tw`rounded-md bg-[#FF2A2A] px-4 py-1.5 ${isActionLoading ? 'opacity-50' : ''}`}>
                
                                            <Text style={tw`text-xs font-semibold text-white`}>{t("Auto.Common.Reject", "Reject")}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity disabled={isActionLoading} onPress={() => handleExecuteAction("accept", req)} style={tw`rounded-md bg-[#43C17A] px-4 py-1.5 ${isActionLoading ? 'opacity-50' : ''}`}>
                
                                            <Text style={tw`text-xs font-semibold text-white`}>{t("Auto.Common.Accept", "Accept")}</Text>
                                        </TouchableOpacity>
                                    </> : req.status === "accepted" ? <TouchableOpacity disabled={isActionLoading} onPress={() => handleExecuteAction("remove", req)} style={tw`rounded-md bg-[#16284F] px-4 py-1.5 ${isActionLoading ? 'opacity-50' : ''}`}>
              
                                        <Text style={tw`text-xs font-semibold text-white`}>{t("Auto.Common.Remove", "Remove")}</Text>
                                    </TouchableOpacity> : null}
                            </View>
                        </View>;
    }} /> : <View style={tw`items-center py-12`}>
                    <Text style={tw`text-gray-500`}>{t("Auto.Common.Norequestsfound", "No requests found")}
          {searchInput ? "matching your search" : "in this category"}.
                    </Text>
                </View>}
        </View>;
}