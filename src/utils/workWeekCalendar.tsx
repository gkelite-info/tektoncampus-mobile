import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

interface WorkWeekCalendarProps {
    style?: string;
    activeDate?: Date;
    onDateSelect?: (date: Date) => void;
}

export default function WorkWeekCalendar({
    style = "mt-5",
    activeDate,
    onDateSelect,
}: WorkWeekCalendarProps) {
    const initialDate = activeDate || new Date();

    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
    const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
    const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);

    useEffect(() => {
        if (activeDate) {
            setSelectedDate(activeDate);
            setCurrentMonth(activeDate.getMonth());
            setCurrentYear(activeDate.getFullYear());
        }
    }, [activeDate]);

    const getMonday = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        return d;
    };

    const weekStartDate = getMonday(selectedDate);
    const weekDays: Date[] = [];

    for (let i = 0; i < 6; i++) {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + i);
        weekDays.push(d);
    }

    const handleDateChange = (newDate: Date) => {
        setSelectedDate(newDate);
        setCurrentMonth(newDate.getMonth());
        setCurrentYear(newDate.getFullYear());
        if (onDateSelect) onDateSelect(newDate);
    };

    const prevWeek = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 7);
        if (d.getFullYear() < 2026) return;
        handleDateChange(d);
    };

    const nextWeek = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 7);
        handleDateChange(d);
    };

    const handleMonthSelect = (index: number) => {
        const d = new Date(selectedDate);
        d.setMonth(index);
        handleDateChange(d);
        setMonthOpen(false);
    };

    const handleYearSelect = (year: number) => {
        const d = new Date(selectedDate);
        d.setFullYear(year);
        handleDateChange(d);
        setYearOpen(false);
    };

    const startYear = 2026;
    const years = Array.from(
        { length: currentYear + 5 - startYear + 1 },
        (_, i) => startYear + i
    );

    return (
        <View className={`w-full p-4 bg-white rounded-xl shadow-md flex flex-col justify-center gap-4 h-[170px] ${style}`}>
            <View className="flex-row justify-between items-center relative z-20">
                <View className="flex-row items-center gap-1">
                    <TouchableOpacity
                        onPress={() => { setMonthOpen(true); setYearOpen(false); }}
                        className="px-2 py-1 rounded-lg active:bg-gray-100"
                    >
                        <Text className="text-black font-semibold text-sm">{months[currentMonth]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => { setYearOpen(true); setMonthOpen(false); }}
                        className="px-2 py-1 rounded-lg active:bg-gray-100"
                    >
                        <Text className="text-black font-semibold text-sm">{currentYear}</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-4 px-2">
                    <TouchableOpacity onPress={prevWeek}>
                        <CaretLeft size={16} color="#282828" weight="bold" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={nextWeek}>
                        <CaretRight size={16} color="#282828" weight="bold" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="h-[1px] bg-[#E4E5E7] w-full" />

            <View className="flex-row justify-between items-center w-full">
                {weekdays.map((day, idx) => {
                    const dateObj = weekDays[idx];
                    const isActive = dateObj.toDateString() === selectedDate.toDateString();
                    const isSaturday = day === "Saturday";

                    const CellContent = (
                        <View className="flex-col items-center justify-center gap-1.5 h-14 w-11 rounded-lg">
                            <Text style={{ color: isActive ? '#FFFFFF' : '#71717A' }} className="text-[11px] font-medium">
                                {day}
                            </Text>

                            {isActive ? (
                                <View className="flex items-center justify-center w-6 h-6 rounded-full bg-[#43C17A]">
                                    <Text className="text-xs font-bold text-white">
                                        {dateObj.getDate()}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-sm font-medium text-[#282828]">
                                    {dateObj.getDate()}
                                </Text>
                            )}
                        </View>
                    );

                    return (
                        <TouchableOpacity
                            key={day}
                            disabled={isSaturday}
                            onPress={() => handleDateChange(dateObj)}
                            className="overflow-hidden rounded-lg"
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={["#7ADAA4", "#43C17A"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                >
                                    {CellContent}
                                </LinearGradient>
                            ) : (
                                CellContent
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Modal visible={monthOpen} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setMonthOpen(false)}>
                    <View className="flex-1 bg-black/10 justify-center items-center">
                        <View className="bg-white rounded-xl shadow-xl w-64 max-h-60 p-2 overflow-hidden">
                            <ScrollView showsVerticalScrollIndicator={true}>
                                {months.map((month, index) => (
                                    <TouchableOpacity
                                        key={month}
                                        onPress={() => handleMonthSelect(index)}
                                        className="px-4 py-2.5 active:bg-gray-100 border-b border-gray-50"
                                    >
                                        <Text className="text-gray-800 text-sm font-medium">{month}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={yearOpen} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setYearOpen(false)}>
                    <View className="flex-1 bg-black/10 justify-center items-center">
                        <View className="bg-white rounded-xl shadow-xl w-48 max-h-60 p-2 overflow-hidden">
                            <ScrollView showsVerticalScrollIndicator={true}>
                                {years.map((year) => (
                                    <TouchableOpacity
                                        key={year}
                                        onPress={() => handleYearSelect(year)}
                                        className="px-4 py-2.5 active:bg-gray-100 border-b border-gray-50"
                                    >
                                        <Text className="text-gray-800 text-sm font-medium">{year}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}