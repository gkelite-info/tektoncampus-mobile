import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarHeader from "./components/CalendarHeader";
import CalendarGrid from "./components/CalendarGrid";
import CalendarToolbar from "./components/CalendarToolbar";
import AddEventModal from "./components/AddEventModal";
import EventDetailsModal from "./modal/EventDetailsModal";
import ConfirmConflictModal from "./modal/ConfirmConflictModal";
import ConfirmDeleteModal from "./modal/ConfirmDeleteModal";
import { CalendarEvent } from "./types";
import { getWeekDays } from "./utils";

import { useUser } from "@/utils/context/UserContext";
import { useHeaderHeight } from '@react-navigation/elements';
import {
  deleteCalendarEvent,
  fetchCalendarEvents,
  notifyStudentsOfEvent,
  saveCalendarEvent
} from "@/lib/helpers/calendar/calendarEventAPI";
import {
  fetchCalendarEventSections,
  saveCalendarEventSections,
  softDeleteCalendarEventSection
} from "@/lib/helpers/calendar/calendarEventSectionsAPI";
import { fetchAcademicDropdowns } from "@/lib/helpers/faculty/academicDropdown.helper";
import { getFacultyIdByUserId } from "@/lib/helpers/faculty/facultyAPI";
import { checkSectionConflict, ConflictingSection } from "@/lib/helpers/calendar/checkSectionConflict";
import HolidayCalendar from "./components/HolidayCalendar";
import HolidayCalendarShimmer from "./components/HolidayCalendarShimmer";
import { fetchCollegeHolidays, CollegeHoliday } from "@/lib/helpers/Hr/holidays/holidayAPI";

export type CalendarEventPayload = {
  facultyId: number;
  subjectId: number | null;
  eventTitle: string;
  eventTopic: number | null;
  type: "class" | "meeting" | "exam" | "quiz";
  date: string;
  fromTime: string;
  toTime: string;
  roomNo: string;
  collegeRoomId?: number | null;
  meetingLink?: string | null;
  meetingId?: string | null;
  meetingPassword?: string | null;
  collegeEducationId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
  collegeSemesterId: number;
  sectionIds: number[];
};

const convertTo24Hour = (time12h: string) => {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}:00`;
};

export default function CalendarScreen() {
  const { t } = useTranslation();
  
  const [mainTab, setMainTab] = useState<"Faculty" | "Holidays">("Faculty");
  const [holidays, setHolidays] = useState<CollegeHoliday[]>([]);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [isFetchingHolidays, setIsFetchingHolidays] = useState(false);

  const [activeTab, setActiveTab] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const fetchIdRef = useRef(0);
  
  const [pendingEvent, setPendingEvent] = useState<CalendarEventPayload | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<any | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [degreeOptions, setDegreeOptions] = useState<any[]>([]);

  const { userId, role, collegeId } = useUser();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [conflictDetails, setConflictDetails] = useState<ConflictingSection[]>([]);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const weekDays = getWeekDays(currentDate);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const headerHeight = useHeaderHeight();

  useEffect(() => {
    if (!userId || role !== "Faculty") return;

    const loadFacultyId = async () => {
      try {
        const id = await getFacultyIdByUserId(userId);
        setFacultyId(id);
      } catch (err) {
        Toast.show({ type: 'error', text1: t("Calendar.faculty.facultyNotFound", "Faculty record not found") });
      }
    };
    loadFacultyId();
  }, [userId, role]);

  const loadHolidays = async () => {
    if (!collegeId) return;
    setIsFetchingHolidays(true);
    try {
      const data = await fetchCollegeHolidays(collegeId, holidayYear);
      setHolidays(data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
      setIsFetchingHolidays(false);
    }
  };

  useEffect(() => {
    if (mainTab === "Holidays") {
      loadHolidays();
    }
  }, [mainTab, holidayYear, collegeId]);

  const loadCalendarEvents = async (month: number, year: number) => {
    if (!facultyId) return;
    const currentFetchId = ++fetchIdRef.current;
    try {
      setLoading(true);
      const startStr = new Date(year, month, -7).toISOString().split("T")[0];
      const endStr = new Date(year, month + 1, 7).toISOString().split("T")[0];
      const rows = await fetchCalendarEvents({ facultyId, startDate: startStr, endDate: endStr });
      if (currentFetchId !== fetchIdRef.current) return;
      if (!rows || rows.length === 0) {
        setEvents([]);
        return;
      }
      const firstEventSections = await fetchCalendarEventSections(rows[0].calendarEventId);
      if (!firstEventSections || firstEventSections.length === 0) {
        setEvents([]);
        return;
      }
      const educationId = firstEventSections[0].collegeEducationId;
      const branchId = firstEventSections[0].collegeBranchId;
      const academicYearId = firstEventSections[0].collegeAcademicYearId;
      const branches = await fetchAcademicDropdowns({ type: "branch", collegeId: collegeId!, educationId });
      const academicYears = await fetchAcademicDropdowns({ type: "academicYear", collegeId: collegeId!, educationId, branchId });
      const allSections = await fetchAcademicDropdowns({ type: "section", collegeId: collegeId!, educationId, branchId, academicYearId });
      const branchMap = new Map<number, string>(branches.map((b: any) => [b.collegeBranchId, b.collegeBranchCode]));
      const yearMap = new Map<number, string>(academicYears.map((y: any) => [y.collegeAcademicYearId, y.collegeAcademicYear]));
      const sectionNameMap = new Map<number, string>(allSections.map((s: any) => [s.collegeSectionsId, s.collegeSections]));
      const sectionMap = new Map<number, number[]>();
      await Promise.all(rows.map(async (row: any) => {
        const sections = await fetchCalendarEventSections(row.calendarEventId);
        sectionMap.set(row.calendarEventId, (sections ?? []).map((s: any) => s.collegeSectionId));
      }));
      const expandedEvents: CalendarEvent[] = [];
      rows.forEach((row: any) => {
        const startTime = `${row.date}T${row.fromTime}`;
        const endTime = `${row.date}T${row.toTime}`;
        const sectionIds = sectionMap.get(row.calendarEventId) ?? [];
        const safelyExtractedTopic = row.college_subject_unit_topics?.topicTitle || (Array.isArray(row.college_subject_unit_topics) ? row.college_subject_unit_topics[0]?.topicTitle : null);
        sectionIds.forEach((sectionId) => {
          expandedEvents.push({
            id: `${row.calendarEventId}-${sectionId}`,
            title: row.type === "meeting" ? row.meetingTitle || t("Calendar.faculty.meeting", "Meeting") : safelyExtractedTopic ?? "",
            type: row.type,
            subjectName: row.college_subjects?.subjectName ?? "-",
            subjectKey: row.college_subjects?.subjectKey ?? "",
            day: [t("Calendar.faculty.sun", "SUN"), t("Calendar.faculty.mon", "MON"), t("Calendar.faculty.tue", "TUE"), t("Calendar.faculty.wed", "WED"), t("Calendar.faculty.thu", "THU"), t("Calendar.faculty.fri", "FRI"), t("Calendar.faculty.sat", "SAT")][new Date(row.date).getDay()],
            startTime,
            endTime,
            branch: branchMap.get(branchId) ?? "",
            year: yearMap.get(academicYearId) ?? "",
            section: sectionNameMap.get(sectionId) ?? "",
            calendarEventId: row.calendarEventId,
            sectionId: sectionId,
            rawFormData: {
              subjectId: row.subject,
              topicId: row.eventTopic,
              topicTitle: safelyExtractedTopic,
              roomNo: row.college_rooms?.roomNo ?? (Array.isArray(row.college_rooms) ? row.college_rooms[0]?.roomNo : ""),
              collegeRoomId: row.collegeRoomId,
              meetingLink: row.meetingLink,
              meetingId: row.meetingId,
              meetingPassword: row.meetingPassword
            }
          });
        });
      });
      setEvents(expandedEvents);
    } catch (error) {
      console.error("Failed to load calendar events", error);
      Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToLoadEvents", "Failed to load calendar events") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!facultyId) return;
    loadCalendarEvents(currentMonth, currentYear);
  }, [facultyId, currentMonth, currentYear]);

  const hasDbConflict = async (payload: CalendarEventPayload, ignoreEventId?: number): Promise<boolean> => {
    if (!facultyId || !collegeId) return false;
    const conflicts = await checkSectionConflict({
      collegeId,
      date: payload.date,
      fromTime: payload.fromTime,
      toTime: payload.toTime,
      collegeEducationId: payload.collegeEducationId,
      collegeBranchId: payload.collegeBranchId,
      collegeAcademicYearId: payload.collegeAcademicYearId,
      collegeSemesterId: payload.collegeSemesterId,
      sectionIds: payload.sectionIds,
      ignoreEventId
    });
    if (conflicts.length > 0) {
      setConflictDetails(conflicts);
      return true;
    }
    setConflictDetails([]);
    return false;
  };

  const handleSaveEvent = async (payload: CalendarEventPayload): Promise<{ success: boolean }> => {
    if (!facultyId) {
      Toast.show({ type: 'error', text1: t("Calendar.faculty.facultyNotFound", "Faculty record not found") });
      return { success: false };
    }
    const conflict = await hasDbConflict(payload, editingEventId ? Number(editingEventId) : undefined);
    if (conflict) {
      setPendingEvent(payload);
      setShowConflictModal(true);
      return { success: false };
    }

    setIsSaving(true);
    try {
      const eventRes = await saveCalendarEvent({
        calendarEventId: editingEventId ? Number(editingEventId) : undefined,
        facultyId,
        subjectId: payload.subjectId ?? null,
        eventTopic: payload.eventTopic,
        eventTitle: payload.eventTitle,
        type: payload.type,
        date: payload.date,
        collegeRoomId: payload.collegeRoomId ?? 0,
        fromTime: payload.fromTime,
        toTime: payload.toTime,
        meetingLink: payload.meetingLink ?? null,
        meetingId: payload.meetingId ?? null,
        meetingPassword: payload.meetingPassword ?? null
      });
      if (!eventRes.success) {
        Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToSaveEvent", "Failed to save event") });
        return { success: false };
      }
      const calendarEventId = eventRes.calendarEventId;
      if (editingEventId) {
        const existingSections = await fetchCalendarEventSections(calendarEventId);
        await Promise.all((existingSections ?? []).map((s: any) => softDeleteCalendarEventSection(calendarEventId, s.collegeSectionId)));
      }
      await saveCalendarEventSections(calendarEventId, {
        collegeEducationId: payload.collegeEducationId,
        collegeBranchId: payload.collegeBranchId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        collegeSemesterId: payload.collegeSemesterId,
        sectionIds: payload.sectionIds
      });
      if (!editingEventId) {
        await notifyStudentsOfEvent(calendarEventId, payload as any);
      }
      setIsModalOpen(false);
      setEditingEventId(null);
      setEventForm(null);
      setFormMode("create");
      await loadCalendarEvents(currentMonth, currentYear);
      return { success: true };
    } catch (err) {
      console.error("handleSaveEvent failed", err);
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  };

  const handleConflictCancel = () => {
    setPendingEvent(null);
    setShowConflictModal(false);
  };

  const confirmAddEvent = async () => {
    if (!pendingEvent || !facultyId) return;
    setShowConflictModal(false);
    setIsSaving(true);
    try {
      const eventRes = await saveCalendarEvent({
        calendarEventId: editingEventId ? Number(editingEventId) : undefined,
        facultyId,
        subjectId: pendingEvent.subjectId ?? null,
        eventTopic: pendingEvent.eventTopic,
        eventTitle: pendingEvent.eventTitle,
        type: pendingEvent.type,
        date: pendingEvent.date,
        collegeRoomId: pendingEvent.collegeRoomId ?? 0,
        fromTime: pendingEvent.fromTime,
        toTime: pendingEvent.toTime,
        meetingLink: pendingEvent.meetingLink ?? null,
        meetingId: pendingEvent.meetingId ?? null,
        meetingPassword: pendingEvent.meetingPassword ?? null
      });
      if (!eventRes.success) {
        Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToSaveEvent", "Failed to save event") });
        return;
      }
      const calendarEventId = eventRes.calendarEventId;
      if (editingEventId) {
        const existingSections = await fetchCalendarEventSections(calendarEventId);
        await Promise.all((existingSections ?? []).map((s: any) => softDeleteCalendarEventSection(calendarEventId, s.collegeSectionId)));
      }
      await saveCalendarEventSections(calendarEventId, {
        collegeEducationId: pendingEvent.collegeEducationId,
        collegeBranchId: pendingEvent.collegeBranchId,
        collegeAcademicYearId: pendingEvent.collegeAcademicYearId,
        collegeSemesterId: pendingEvent.collegeSemesterId,
        sectionIds: pendingEvent.sectionIds
      });
      Toast.show({ type: 'success', text1: t("Calendar.faculty.eventSavedConflict", "Event saved despite conflict") });
      setPendingEvent(null);
      setIsModalOpen(false);
      setEditingEventId(null);
      setEventForm(null);
      setFormMode("create");
      await loadCalendarEvents(currentMonth, currentYear);
    } catch (err) {
      Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToSaveEvent", "Failed to save event") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    setIsDeleteLoading(true);
    try {
      const calendarEventId = event.calendarEventId;
      const sectionId = event.sectionId;
      await softDeleteCalendarEventSection(calendarEventId, sectionId);
      const remaining = await fetchCalendarEventSections(calendarEventId);
      if (!remaining || remaining.length === 0) {
        await deleteCalendarEvent(calendarEventId);
      }
      await loadCalendarEvents(currentMonth, currentYear);
      setShowDetails(false);
      Toast.show({ type: 'success', text1: t("Calendar.faculty.sectionDeleted", "Section deleted successfully") });
    } catch (err) {
      Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToDeleteSection", "Failed to delete section") });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleEditEvent = async (event: CalendarEvent) => {
    setEditingEventId(String(event.calendarEventId));
    setFormMode("edit");
    const startDate = event.startTime.split("T")[0];
    const start24 = event.startTime.split("T")[1].slice(0, 5);
    const end24 = event.endTime.split("T")[1].slice(0, 5);

    const parse24To12 = (time24: string) => {
      const [hStr, mStr] = time24.split(":");
      let h = Number(hStr);
      const period = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return { hour: String(h).padStart(2, "0"), minute: mStr, period };
    };
    const start = parse24To12(start24);
    const end = parse24To12(end24);

    let dbSectionIds: number[] = [];
    let semesterId: number | null = null;
    try {
      const rows = await fetchCalendarEventSections(event.calendarEventId);
      dbSectionIds = (rows ?? []).map((r: any) => r.collegeSectionId);
      semesterId = rows?.[0]?.collegeSemesterId ?? null;
    } catch (err) {}

    setEventForm({
      title: event.title ?? "",
      subjectId: event.rawFormData?.subjectId ?? null,
      topicId: event.rawFormData?.topicId ?? null,
      roomNo: event.rawFormData?.roomNo ?? "",
      collegeRoomId: event.rawFormData?.collegeRoomId ?? null,
      meetingLink: event.rawFormData?.meetingLink ?? "",
      meetingId: event.rawFormData?.meetingId ?? "",
      meetingPassword: event.rawFormData?.meetingPassword ?? "",
      date: startDate,
      startHour: start.hour,
      startMinute: start.minute,
      startPeriod: start.period,
      endHour: end.hour,
      endMinute: end.minute,
      endPeriod: end.period,
      sectionIds: dbSectionIds,
      semesterId,
      type: event.type
    });
    setIsModalOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: headerHeight }}>
      <View className="px-4 py-2 flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-xl text-gray-900" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.CalendarEvents", "Calendar & Events")}</Text>
          <Text className="text-xs text-gray-500" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Stayorganizedwi", "Stay organized with your schedule")}</Text>
        </View>
      </View>

      <View className="px-4 mb-3 flex-row gap-2">
        <TouchableOpacity
          onPress={() => setMainTab("Faculty")}
          className={`px-4 py-2 rounded-lg border shadow-sm ${mainTab === "Faculty" ? "bg-[#43C17A] border-[#43C17A]" : "bg-white border-gray-200"}`}
        >
          <Text className={`text-sm font-semibold ${mainTab === "Faculty" ? "text-white" : "text-gray-600"}`}>
            {t("Calendar.faculty.academicsCalendar", "Academics Calendar")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMainTab("Holidays")}
          className={`px-4 py-2 rounded-lg border shadow-sm ${mainTab === "Holidays" ? "bg-[#43C17A] border-[#43C17A]" : "bg-white border-gray-200"}`}
        >
          <Text className={`text-sm font-semibold ${mainTab === "Holidays" ? "text-white" : "text-gray-600"}`}>
            {t("Calendar.faculty.holidayCalendar", "Holiday Calendar")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 mb-2">
        {mainTab === "Faculty" && (
          <>
            <CalendarToolbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <CalendarHeader
              currentDate={currentDate}
              onMonthYearChange={(month, year) => setCurrentDate(new Date(year, month, 1))}
              onAddClick={() => {
                setEditingEventId(null);
                setFormMode("create");
                setEventForm(null);
                setIsModalOpen(true);
              }} />
          </>
        )}
      </View>

      <View className="flex-1 bg-gray-50 px-2 pb-2">
        {mainTab === "Holidays" ? (
          isFetchingHolidays ? (
            <HolidayCalendarShimmer />
          ) : (
            <HolidayCalendar
              holidays={holidays}
              year={holidayYear}
              setYear={setHolidayYear}
              onRefresh={loadHolidays}
            />
          )
        ) : loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#10B981" />
          </View> 
        ) : (
          <CalendarGrid
            events={events}
            weekDays={weekDays}
            activeTab={activeTab}
            onPrevWeek={() => {
              const prev = new Date(currentDate);
              prev.setDate(prev.getDate() - 7);
              setCurrentDate(prev);
            }}
            onNextWeek={() => {
              const next = new Date(currentDate);
              next.setDate(next.getDate() + 7);
              setCurrentDate(next);
            }}
            onDeleteRequest={(event) => setEventToDelete(event)}
            onEditRequest={(event) => handleEditEvent(event)}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setShowDetails(true);
            }} />
        )}
      </View>

      <EventDetailsModal
        open={showDetails}
        event={selectedEvent}
        onClose={() => {
          setShowDetails(false);
          setSelectedEvent(null);
        }} />
      
      <AddEventModal
        isOpen={isModalOpen}
        value={eventForm}
        mode={formMode}
        degreeOptions={degreeOptions}
        onClose={() => {
          setIsModalOpen(false);
          setEventForm(null);
          setEditingEventId(null);
        }}
        onSave={handleSaveEvent} />

      <ConfirmConflictModal
        open={showConflictModal}
        onConfirm={confirmAddEvent}
        onCancel={handleConflictCancel}
        conflictDetails={conflictDetails}
      />

      <ConfirmDeleteModal
        open={!!eventToDelete}
        onCancel={() => setEventToDelete(null)}
        onConfirm={async () => {
          if (eventToDelete) await handleDeleteEvent(eventToDelete);
          setEventToDelete(null);
        }}
        isDeleting={isDeleteLoading}
      />
      
    </View>
  );
}