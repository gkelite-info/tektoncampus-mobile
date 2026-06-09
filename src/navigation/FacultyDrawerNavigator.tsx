import React, { useRef, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import { FacultyCustomTabBar } from "@/tabs/FacultyTabs";
import FacultyDashboard from "@/(screens)/faculty/faculty";
import FacultyAssignmente from "@/(screens)/faculty/assignments/assignments";
import FacultyAttendance from "@/(screens)/faculty/attendance/attendance";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import FacultyAcademics from "@/(screens)/faculty/academics/academics";

import {
    StudentProgressScreen,
    ProjectsScreen,
    PlacementsScreen,
    ClubScreen,
    DriveScreen,
    MeetingsScreen,
    MyAttendanceScreen,
    WellbeingScreen,
    SettingsScreen,
} from "@/(screens)/student/mockScreens";

import LeaveRequestsScreen from "@/(screens)/faculty/leaveRequests/leaveRequests";

import CalendarScreen from "@/(screens)/faculty/calendar/CalendarScreen";
import AssignmentSubmissions from "@/(screens)/faculty/assignments/submissions/AssignmentSubmissions";
import QuizSubmissions from "@/(screens)/faculty/assignments/submissions/QuizSubmissions";
import DiscussionSubmissions from "@/(screens)/faculty/assignments/submissions/DiscussionSubmissions";
import SubjectDetailsScreen from "@/(screens)/faculty/academics/SubjectDetails";

export type FacultyDrawerParamList = {
    Dashboard: undefined;
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
    MyAttendance: undefined;
    Wellbeing: undefined;
    Settings: undefined;
    AssignmentSubmissions: { assignmentId: string | number };
    QuizSubmissions: { quizId: string | number };
    DiscussionSubmissions: { discussionId: string | number };
    SubjectDetailsScreen: { details: any };
};

const Tab = createBottomTabNavigator<FacultyDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "Dashboard", label: "Home" },
    { name: "Calendar", label: "Calendar" },
    { name: "Attendance", label: "Attendance" },
    { name: "Assignments", label: "Assignments" },
    { name: "Academics", label: "Academics" },
    { name: "StudentProgress", label: "Student Progress" },
    { name: "Projects", label: "Projects" },
    { name: "Placements", label: "Placements" },
    { name: "LeaveRequests", label: "Leave Requests" },
    { name: "Club", label: "Club" },
    { name: "Drive", label: "Drive" },
    { name: "Meetings", label: "Meetings" },
    { name: "MyAttendance", label: "My Attendance" },
    { name: "Wellbeing", label: "Wellbeing" },
    { name: "Settings", label: "Settings" },
];

export default function FacultyDrawerNavigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeRouteName, setActiveRouteName] = useState<keyof FacultyDrawerParamList>("Dashboard");
    const navigationRef = useRef<any>(null);

    return (
        <>
            <Tab.Navigator
                initialRouteName="Dashboard"
                tabBar={(props) => <FacultyCustomTabBar {...props} />}
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
                        setActiveRouteName(route.name as keyof FacultyDrawerParamList);
                    },
                }}
            >
                <Tab.Screen name="Assignments" component={FacultyAssignmente} />
                <Tab.Screen name="Academics" component={FacultyAcademics} />
                <Tab.Screen name="Dashboard" component={FacultyDashboard} />
                <Tab.Screen name="Attendance" component={FacultyAttendance} />
                <Tab.Screen name="Profile" component={ProfileContainer} />

                <Tab.Screen name="Calendar" component={CalendarScreen} />
                <Tab.Screen name="StudentProgress" component={StudentProgressScreen} />
                <Tab.Screen name="Projects" component={ProjectsScreen} />
                <Tab.Screen name="Placements" component={PlacementsScreen} />
                <Tab.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
                <Tab.Screen name="Club" component={ClubScreen} />
                <Tab.Screen name="Drive" component={DriveScreen} />
                <Tab.Screen name="Meetings" component={MeetingsScreen} />
                <Tab.Screen name="MyAttendance" component={MyAttendanceScreen} />
                <Tab.Screen name="Wellbeing" component={WellbeingScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
                <Tab.Screen name="AssignmentSubmissions" component={AssignmentSubmissions} options={{ headerShown: false }} />
                <Tab.Screen name="QuizSubmissions" component={QuizSubmissions} options={{ headerShown: false }} />
                <Tab.Screen name="DiscussionSubmissions" component={DiscussionSubmissions} options={{ headerShown: false }} />
                <Tab.Screen name="SubjectDetailsScreen" component={SubjectDetailsScreen} options={{ headerShown: false }} />
            </Tab.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="Dashboard"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    setActiveRouteName(routeName as keyof FacultyDrawerParamList);
                    navigationRef.current?.navigate(routeName);
                }}
            />
        </>
    );
}
