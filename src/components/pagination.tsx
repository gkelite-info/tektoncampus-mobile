import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react-native";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    roundedBottom?: string;
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    roundedBottom
}: PaginationProps) {
    if (totalItems <= itemsPerPage) return null;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }
        return pages;
    };

    const visiblePages = getPageNumbers();

    return (
        <View className={`p-4 bg-white border-t border-gray-200 mt-auto items-center ${roundedBottom || ""}`}>
            <View className="flex-col gap-y-3 w-full items-center">

                <View className="flex-row justify-center w-full">
                    <Text className="text-xs text-gray-700">
                        Showing <Text className="font-semibold">{startIndex + 1}</Text> to{" "}
                        <Text className="font-semibold">{endIndex}</Text> of{" "}
                        <Text className="font-semibold">{totalItems}</Text> results
                    </Text>
                </View>

                <View className="w-full flex-row justify-center max-w-full">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ alignItems: 'center' }}
                        className="flex-row rounded-xl border border-gray-300"
                    >
                        <TouchableOpacity
                            onPress={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="p-2.5 border-r border-gray-300 justify-center items-center disabled:opacity-40"
                        >
                            <ChevronsLeft size={16} color={currentPage === 1 ? "#9CA3AF" : "#6B7280"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 border-r border-gray-300 justify-center items-center disabled:opacity-40"
                        >
                            <ChevronLeft size={16} color={currentPage === 1 ? "#9CA3AF" : "#6B7280"} />
                        </TouchableOpacity>

                        {visiblePages.map((page, index) => {
                            const isCurrent = currentPage === page;
                            const isEllipsis = page === "...";

                            if (isEllipsis) {
                                return (
                                    <View
                                        key={`ellipsis-${index}`}
                                        className="px-3 py-2 border-r border-gray-300 justify-center items-center h-full min-w-[38px]"
                                    >
                                        <Text className="text-xs font-semibold text-gray-400">...</Text>
                                    </View>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={page}
                                    onPress={() => onPageChange(page as number)}
                                    className={`px-3 py-2 border-r border-gray-300 justify-center items-center min-w-[38px] ${isCurrent ? "bg-[#16284F]" : "bg-white"
                                        }`}
                                >
                                    <Text className={`text-xs font-semibold text-center ${isCurrent ? "text-white" : "text-gray-900"}`}>
                                        {page}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 border-r border-gray-300 justify-center items-center disabled:opacity-40"
                        >
                            <ChevronRight size={16} color={currentPage === totalPages ? "#9CA3AF" : "#6B7280"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2.5 justify-center items-center disabled:opacity-40"
                        >
                            <ChevronsRight size={16} color={currentPage === totalPages ? "#9CA3AF" : "#6B7280"} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

            </View>
        </View>
    );
}