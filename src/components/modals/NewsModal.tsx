import { Text } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Newspaper, X, Plus, FilePdf, Trash } from 'phosphor-react-native';
import { useUser } from '@/utils/context/UserContext';
import { WebView } from 'react-native-webview';
import { fetchEPapers, deleteEPaper, EPaperRecord } from '@/lib/helpers/news/epaperAPI';
import { useTranslation } from 'react-i18next';
import Shimmer from '@/components/ui/Shimmer';
type Props = {
  visible: boolean;
  onClose: () => void;
};
export default function NewsModal({
  visible,
  onClose
}: Props) {
  const {
    t
  } = useTranslation("News");
  const {
    role,
    collegeId
  } = useUser();
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"epaper" | "news">("epaper");
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [epapers, setEpapers] = useState<EPaperRecord[]>([]);
  const [loadingEpapers, setLoadingEpapers] = useState(false);
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null);
  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GNEWS_KEY || process.env.GNEWS_KEY;
      if (!apiKey) {
        console.warn("GNews API Key is missing in env");
        setLoadingNews(false);
        return;
      }
      const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&apikey=${apiKey}`);
      const data = await res.json();
      setNews(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNews(false);
    }
  };
  const loadEpapers = async () => {
    if (!collegeId) return;
    setLoadingEpapers(true);
    try {
      const data = await fetchEPapers(collegeId);
      setEpapers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEpapers(false);
    }
  };
  const handleDeleteEpaper = (ePaperId: number) => {
    Alert.alert(t("Delete EPaper", "Delete EPaper"), t("Are you sure you want to delete this e-paper?", "Are you sure you want to delete this e-paper?"), [{
      text: t("Cancel", "Cancel"),
      style: "cancel"
    }, {
      text: t("Delete", "Delete"),
      style: "destructive",
      onPress: async () => {
        try {
          await deleteEPaper(ePaperId);
          loadEpapers();
        } catch (e) {
          console.error(e);
        }
      }
    }]);
  };
  useEffect(() => {
    if (visible) {
      if (activeTab === 'news' && news.length === 0) {
        loadNews();
      }
      if (activeTab === 'epaper' && epapers.length === 0) {
        loadEpapers();
      }
    } else {
      setSelectedArticleUrl(null);
    }
  }, [visible, activeTab]);
  const handleReadMore = (url: string) => {
    if (url) {
      setSelectedArticleUrl(url);
    }
  };
  const groupedEpapers = epapers.reduce<Record<string, EPaperRecord[]>>((acc, epaper) => {
    const dateStr = new Date(epaper.publish_date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(epaper);
    return acc;
  }, {});
  return <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"} transparent={Platform.OS === 'android'} onRequestClose={onClose}>
            <View style={{
      flex: 1,
      backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent',
      paddingTop: Platform.OS === 'android' ? 40 : 0
    }}>
                <SafeAreaView style={{
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden'
      }} edges={['top']}>
                {selectedArticleUrl ? <View className="flex-1 bg-white">
                        <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
                            <TouchableOpacity onPress={() => setSelectedArticleUrl(null)} className="mr-3 p-1 rounded-full bg-gray-50">
                                <X size={20} color="#111827" />
                            </TouchableOpacity>
                            <Text className="font-medium text-lg text-[#111827]">{t("Article", "Article")}</Text>
                        </View>
                        <WebView source={{
            uri: selectedArticleUrl
          }} className="flex-1" />
                    </View> : <View className="flex-1">
                        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
                            <View className="flex-row items-center gap-2">
                                <Newspaper size={24} weight="fill" color="#43C17A" />
                                <Text className="font-medium text-xl text-[#111827]">{t("News", "News")}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-50">
                                <X size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row border-b border-gray-100 bg-white">
                            <TouchableOpacity onPress={() => setActiveTab("epaper")} className={`flex-1 py-3 border-b-2 ${activeTab === 'epaper' ? 'border-[#43C17A]' : 'border-transparent'}`}>
                                <Text className={`text-center text-sm font-medium ${activeTab === 'epaper' ? 'text-[#43C17A]' : 'text-gray-500'}`}>
                                    {t("EPapers", "EPapers")}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveTab("news")} className={`flex-1 py-3 border-b-2 ${activeTab === 'news' ? 'border-[#43C17A]' : 'border-transparent'}`}>
                                <Text className={`text-center text-sm font-medium ${activeTab === 'news' ? 'text-[#43C17A]' : 'text-gray-500'}`}>
                                    {t("Current News", "Current News")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-1 bg-gray-50/50">
                            {activeTab === 'epaper' && <ScrollView contentContainerStyle={{
              padding: 16
            }}>
                                    {isAdmin && <TouchableOpacity className="w-full flex-row items-center justify-center gap-2 py-3 bg-white border border-[#43C17A] rounded-lg mb-4">
                                            <Plus size={18} color="#43C17A" />
                                            <Text className="text-[#43C17A] font-medium">{t("Add EPaper", "Add EPaper")}</Text>
                                        </TouchableOpacity>}

                                    {loadingEpapers ? <View>
                                            {[1, 2, 3].map(i => <View key={i} className="mb-4">
                                                    <Shimmer width={100} height={24} className="mb-3 rounded-md" />
                                                    {[1, 2].map(j => <View key={j} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex-row items-center justify-between mb-3">
                                                            <Shimmer width="60%" height={20} />
                                                            <Shimmer width={60} height={28} borderRadius={6} />
                                                        </View>)}
                                                </View>)}
                                        </View> : Object.keys(groupedEpapers).length === 0 ? <Text className="text-center text-gray-500 text-sm mt-8">{t("No EPapers available", "No EPapers available")}</Text> : Object.entries(groupedEpapers).map(([date, papers]) => <View key={date} className="mb-4">
                                                <View className="bg-gray-200 px-3 py-1.5 rounded-md self-start mb-3">
                                                    <Text className="text-xs font-semibold text-gray-900">{date}</Text>
                                                </View>
                                                <View className="space-y-3">
                                                    {papers.map(paper => {
                    return <View key={paper.ePaperId} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex-row items-center justify-between mb-3">
                                                            <Text className="text-[15px] font-medium text-gray-800 flex-1" numberOfLines={1}>
                                                                {paper.name}
                                                            </Text>
                                                            <View className="flex-row items-center gap-2 ml-2">
                                                                <TouchableOpacity onPress={() => {
                          if (paper.pdf_url) {
                            Linking.openURL(paper.pdf_url).catch(err => console.error(err));
                          }
                        }} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-[#43C17A]/10 rounded-md">
                                                                    <FilePdf size={14} color="#43C17A" weight="fill" />
                                                                    <Text className="text-[#43C17A] text-xs font-medium">{t("View", "View")}</Text>
                                                                </TouchableOpacity>
                                                                {isAdmin && <TouchableOpacity onPress={() => handleDeleteEpaper(paper.ePaperId)} className="p-1.5 bg-red-50 rounded-md">
                                                                        <Trash size={16} color="#EF4444" />
                                                                    </TouchableOpacity>}
                                                            </View>
                                                        </View>;
                  })}
                                                </View>
                                            </View>)}
                                </ScrollView>}

                            {activeTab === 'news' && <ScrollView contentContainerStyle={{
              padding: 16
            }}>
                                    {loadingNews ? <View className="space-y-4">
                                            <Shimmer width={150} height={20} className="mb-4" />
                                            {[1, 2, 3].map(i => <View key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                                                    <View className="flex-row items-center gap-2 mb-3">
                                                        <Shimmer width={120} height={16} />
                                                    </View>
                                                    <Shimmer width="100%" height={16} className="mb-2" />
                                                    <Shimmer width="80%" height={16} className="mb-4" />
                                                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                                        <Shimmer width={60} height={14} />
                                                        <Shimmer width={80} height={16} />
                                                    </View>
                                                </View>)}
                                        </View> : <View className="space-y-4">
                                            <Text className="text-sm text-[#414141] font-medium border-b border-gray-200 pb-2 mb-4">
                                                {new Date().toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                                            </Text>
                                            
                                            {news.map((item, index) => {
                  
                  return <View key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                                                    <View className="flex-row items-center gap-2 mb-2">
                                                        <Text className="text-sm font-medium text-[#111827]">
                                                            🗞️ {item.source?.name || t("News Source", "News Source")}
                                                        </Text>
                                                    </View>
                                                    
                                                    <Text className="text-sm leading-relaxed text-[#414141]">
                                                        {item.title}
                                                    </Text>
                                                    
                                                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                                        <Text className="text-[11px] text-gray-400">
                                                            {item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : t("Updated", "Updated")}
                                                        </Text>
                                                        
                                                        <TouchableOpacity onPress={() => handleReadMore(item.url)}>
                                                            <Text className="text-[#43C17A] text-xs font-medium">{t("Read More", "Read More")}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>;
                })}
                                        </View>}
                                </ScrollView>}
                        </View>
                    </View>}
                </SafeAreaView>
            </View>
        </Modal>;
}