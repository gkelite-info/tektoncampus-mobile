import React, { useRef, useState, useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from 'react-i18next';
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";
import { StudentCustomTabBar } from "@/tabs/StudentTabs";
import { useStudent } from "@/utils/context/student/useStudent";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";
import StudentHome from "@/(screens)/student/student";
import StudentAttendance from "@/(screens)/student/attendance/attendance";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import StudentCalendar from "@/(screens)/student/calendar/calendar";
import StudentAcademics from "@/(screens)/student/academics/academics";
import StudentAssignments from "@/(screens)/student/assignments/assignments";
import StudentProgressScreen from "@/(screens)/student/studentProgress/studentProgress";
import ProjectsScreen from "@/(screens)/student/projects/projects";
import PlacementsScreen from "@/(screens)/student/placements/placements";
import LeaveRequestsScreen from "@/(screens)/student/leaveRequests/leaveRequests";
import ClubScreen from "@/(screens)/student/club/club";
import DriveScreen from "@/(screens)/student/drive/drive";
import MeetingsScreen from "@/(screens)/student/meetings/meetings";
import WellbeingScreen from "@/(screens)/student/wellbeing/wellbeing";
import StudentPayments from "@/(screens)/student/payments/payments";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";

export type StudentDrawerParamList = {
    Home: undefined;
    Profile: undefined;
    Calendar: undefined;
    Attendance: undefined;
    Assignments: undefined;
    Academics: undefined;
    StudentProgress: undefined;
    Projects: undefined;
    Placements: undefined;
    LeaveRequests: undefined;
    Club: undefined;
    Drive: undefined;
    Meetings: undefined;
    Wellbeing: undefined;
    Payments: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<StudentDrawerParamList>();

const getActiveRouteName = (state: any): string => {
    if (!state || !state.routes) return "";
    const index = state.index ?? 0;
    const route = state.routes[index];
    if (!route) return "";
    if (route.state) {
        return getActiveRouteName(route.state);
    }
    return route.name || "";
};

export default function StudentDrawerNavigator() {
    const { t } = useTranslation();
    const { collegeEducationType } = useStudent();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigationRef = useRef<any>(null);

    const isSchool = isSchoolEducation(collegeEducationType);

    const menuItems: RoleSideMenuItem[] = useMemo(() => {
        const items = [
            { name: "Home", label: t("Navbars.Home", "Home") },
            { name: "Calendar", label: t("Navbars.Calendar", "Calendar") },
            { name: "Attendance", label: t("Navbars.Attendance", "Attendance") },
            { name: "Assignments", label: t("Navbars.Assignments", "Assignments") },
            { name: "Academics", label: t("Navbars.Academics", "Academics") },
            { name: "StudentProgress", label: t("Navbars.Student Progress", "Student Progress") },
            { name: "Projects", label: t("Navbars.Projects", "Projects") },
            { name: "Placements", label: t("Navbars.Placements", "Placements") },
            { name: "LeaveRequests", label: t("Navbars.Leave Requests", "Leave Requests") },
            { name: "Club", label: t("Navbars.Club", "Club") },
            { name: "Drive", label: t("Navbars.Drive", "Drive") },
            { name: "Meetings", label: t("Navbars.Meetings", "Meetings") },
            { name: "Wellbeing", label: t("Navbars.Wellbeing", "Wellbeing") },
            { name: "Payments", label: t("Navbars.Payments", "Payments") },
            { name: "Settings", label: t("Navbars.Settings", "Settings") },
        ];

        if (isSchool) {
            return items.filter((item: RoleSideMenuItem) => item.name !== "Placements" && item.name !== "Club");
        }
        return items;
    }, [t, isSchool]);

    let activeRouteName: keyof StudentDrawerParamList = "Home";
    if (isMenuOpen && navigationRef.current) {
        const navState = navigationRef.current.getState();
        const activeLeafName = getActiveRouteName(navState);
        if (activeLeafName) {
            if (activeLeafName === "Home") {
                activeRouteName = "Home";
            } else {
                activeRouteName = activeLeafName as keyof StudentDrawerParamList;
            }
        }
    }

    return (
        <>
            <Tab.Navigator
                initialRouteName="Home"
                tabBar={(props) => <StudentCustomTabBar {...props} />}
                screenOptions={({ navigation }) => {
                    navigationRef.current = navigation;
                    return {
                        headerShown: true,
                        headerTransparent: true,
                        header: () => (
                            <CustomHeader navigation={{ toggleDrawer: () => setIsMenuOpen(true) }} />
                        ),
                    };
                }}
                screenListeners={{
                    state: (event) => {
                        const route = event.data.state.routes[event.data.state.index];
                    },
                }}
            >
                <Tab.Screen name="Calendar" component={StudentCalendar} />
                <Tab.Screen name="Academics" component={StudentAcademics} />
                <Tab.Screen name="Home" component={StudentHome} />
                <Tab.Screen name="Attendance" component={StudentAttendance} />
                <Tab.Screen name="Profile" component={ProfileContainer} />
                <Tab.Screen name="Assignments" component={StudentAssignments} />
                <Tab.Screen name="StudentProgress" component={StudentProgressScreen} />
                <Tab.Screen name="Projects" component={ProjectsScreen} />
                <Tab.Screen name="Placements" component={PlacementsScreen} />
                <Tab.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
                <Tab.Screen name="Club" component={ClubScreen} />
                <Tab.Screen name="Drive" component={DriveScreen} />
                <Tab.Screen name="Meetings" component={MeetingsScreen} />
                <Tab.Screen name="Wellbeing" component={WellbeingScreen} />
                <Tab.Screen name="Payments" component={StudentPayments} />
                <Tab.Screen name="Settings" component={SettingsStackNavigator} />
            </Tab.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="Home"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);

                    setTimeout(() => {
                        if (routeName === "StudentTabs" || routeName === "Home") {
                            navigationRef.current?.navigate("Home");
                        } else if (routeName === "Calendar") {
                            navigationRef.current?.navigate("Calendar");
                        } else if (routeName === "Attendance") {
                            navigationRef.current?.navigate("Attendance");
                        } else if (routeName === "Academics") {
                            navigationRef.current?.navigate("Academics");
                        } else {
                            navigationRef.current?.navigate(routeName);
                        }
                    }, 300);
                }}
            />
        </>
    );
}
