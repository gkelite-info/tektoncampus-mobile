import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/store/authStore";
import {
    MagnifyingGlass, CaretLeft, CaretRight
} from "phosphor-react-native";
import { getStudentListData, StudentRow } from "@/lib/helpers/collegeAdmin/getStudentListData";
import AdminProfileCard from "../dashboard/components/AdminProfileCard";

const ROWS_PER_PAGE = 10;

export default function StudentListScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const collegeId = user?.collegeId;

    const [rows, setRows] = useState<StudentRow[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const totalPages = Math.ceil(totalRecords / ROWS_PER_PAGE);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(async (page: number, searchTerm: string) => {
        if (!collegeId) return;
        setIsFetching(true);
        try {
            const result = await getStudentListData(
                collegeId,
                page,
                ROWS_PER_PAGE,
                { search: searchTerm || undefined }
            );
            setRows(result.students);
            setTotalRecords(result.totalCount);
        } catch (err) {
            console.error("Failed to load", err);
        } finally {
            setIsFetching(false);
        }
    }, [collegeId]);

    useEffect(() => {
        load(currentPage, debouncedSearch);
    }, [collegeId, currentPage, debouncedSearch]);

    const handleBack = () => {
        navigation.goBack();
    };

    const renderItem = ({ item }: { item: StudentRow }) => {
        const mappedData = {
            adminId: Number(item.studentId) || 0,
            fullName: item.fullName,
            email: item.email,
            mobile: item.mobile,
            gender: item.gender,
            dateOfJoining: "—",
            collegeEducationId: item.collegeEducationId,
            eduType: item.eduType,
            branchCount: item.branchCode ? 1 : 0, 
            isActive: item.isActive
        };

        return (
            <View style={styles.cardWrapper}>
                <AdminProfileCard data={mappedData} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <CaretLeft size={24} color="#282828" weight="bold" />
                </TouchableOpacity>
                <Text style={styles.title}>Students</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Student Name or ID"
                    value={search}
                    onChangeText={setSearch}
                />
                <MagnifyingGlass size={20} color="#43C17A" />
            </View>

            <FlatList
                data={rows}
                keyExtractor={(item, index) => String(item.studentId) + index}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
            />
            
            {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={styles.pageButton}
                    >
                        <CaretLeft size={16} />
                    </TouchableOpacity>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {totalPages}
                    </Text>
                    <TouchableOpacity
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={styles.pageButton}
                    >
                        <CaretRight size={16} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    backButton: { marginRight: 12 },
    title: { fontSize: 20, fontWeight: "bold", color: "#282828" },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#EAEAEA", borderRadius: 24, margin: 16, paddingHorizontal: 16, height: 48 },
    searchInput: { flex: 1, height: "100%", color: "#282828" },
    listContainer: { padding: 16, paddingBottom: 40, alignItems: "center" },
    cardWrapper: { marginBottom: 16, width: "100%" },
    emptyText: { textAlign: "center", color: "#6B7280", marginTop: 20 },
    paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
    pageButton: { padding: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, marginHorizontal: 16 },
    pageText: { fontSize: 14, color: "#374151" },
});
