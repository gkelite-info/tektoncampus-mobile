import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    useRef,
    useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { getStudentId } from "@/lib/helpers/studentAPI";
import { fetchStudentContext } from "./student/studentContextAPI";
import { getUserProfilePhoto } from "@/lib/helpers/profile/profileInfo";
import { fetchAdminContext } from "./admin/adminContextAPI";
import { fetchFinanceManagerContext } from "./financeManager/financeManagerContextAPI";
import { getEmployeeEmpId, getStudentRollNo } from "@/lib/helpers/identifiers/upsertIdentifier";
import { fetchFacultyContext } from "./faculty/facultyContextAPI";

type UserContextType = {
    userId: number | null;
    loading: boolean;
    fullName: string | null;
    setFullName: React.Dispatch<React.SetStateAction<string | null>>;
    mobile: string | null;
    email: string | null;
    gender: string | null;
    role: string | null;
    collegePublicId: string | null;
    collegeId: number | null;
    studentId: number | null;
    adminId: number | null;
    financeManagerId: number | null;
    facultyId: number | null;
    collegeAdminId: number | null;
    parentId: number | null;
    collegeHrId: number | null;
    placementEmployeeId: number | null;
    wellBeingId: number | null;
    wellBeingIds: number[];
    wellBeingRegistrationTypes: string[];
    collegeEducationType: string | null;
    collegeBranchCode: string | null;
    collegeAcademicYear: string | null;
    collegeSection: string | null;
    profilePhoto: string | null;
    setProfilePhoto: React.Dispatch<React.SetStateAction<string | null>>;
    dateOfJoining: string | null;
    professionalExperienceYears: number | null;
    identifierId: string | null;
    refreshUserContext: () => Promise<void>;
};

type RoleLoaderMap = Record<string, (userId: number, collegeId: number) => Promise<void>>;
type FacultySectionContext = {
    college_sections?: {
        collegeSections?: string | null;
    } | null;
};
type StudentPinContext =
    | { pinNumber?: string | null }
    | { pinNumber?: string | null }[];
type WellbeingCollegeDetailContext = {
    college_education?: { collegeEducationType?: string | null } | null;
    college_branch?: { collegeBranchCode?: string | null } | null;
    college_academic_year?: { collegeAcademicYear?: string | null } | null;
    college_sections?: { collegeSections?: string | null } | null;
};

const uniqueJoinedValues = (values: Array<string | null | undefined>) =>
    Array.from(
        new Set(
            values
                .map((value) => value?.trim())
                .filter((value): value is string => Boolean(value)),
        ),
    ).join(", ") || null;

const UserContext = createContext<UserContextType>({
    userId: null,
    loading: true,
    fullName: null,
    setFullName: () => { },
    mobile: null,
    email: null,
    gender: null,
    role: null,
    collegePublicId: null,
    collegeId: null,
    studentId: null,
    adminId: null,
    financeManagerId: null,
    facultyId: null,
    collegeAdminId: null,
    parentId: null,
    collegeHrId: null,
    placementEmployeeId: null,
    wellBeingId: null,
    wellBeingIds: [],
    wellBeingRegistrationTypes: [],
    collegeEducationType: null,
    collegeBranchCode: null,
    collegeAcademicYear: null,
    collegeSection: null,
    profilePhoto: null,
    setProfilePhoto: () => { },
    dateOfJoining: null,
    professionalExperienceYears: null,
    identifierId: null,
    refreshUserContext: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState<string | null>(null);
    const [mobile, setMobile] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [gender, setGender] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [collegePublicId, setCollegePublicId] = useState<string | null>(null);
    const [collegeId, setCollegeId] = useState<number | null>(null);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [adminId, setAdminId] = useState<number | null>(null);
    const [financeManagerId, setFinanceManagerId] = useState<number | null>(null);
    const [facultyId, setFacultyId] = useState<number | null>(null);
    const [collegeAdminId, setCollegeAdminId] = useState<number | null>(null);
    const [parentId, setParentId] = useState<number | null>(null);
    const [collegeHrId, setCollegeHrId] = useState<number | null>(null);
    const [placementEmployeeId, setPlacementEmployeeId] = useState<number | null>(null);
    const [wellBeingId, setWellBeingId] = useState<number | null>(null);
    const [wellBeingIds, setWellBeingIds] = useState<number[]>([]);
    const [wellBeingRegistrationTypes, setWellBeingRegistrationTypes] = useState<string[]>([]);
    const [collegeEducationType, setCollegeEducationType] = useState<string | null>(null);
    const [collegeBranchCode, setCollegeBranchCode] = useState<string | null>(null);
    const [collegeAcademicYear, setCollegeAcademicYear] = useState<string | null>(null);
    const [collegeSection, setCollegeSection] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [dateOfJoining, setDateOfJoining] = useState<string | null>(null);
    const [professionalExperienceYears, setProfessionalExperienceYears] = useState<number | null>(null);
    const [identifierId, setIdentifierId] = useState<string | null>(null);

    const lastAuthUserId = useRef<string | null>(null);
    const isContextLoaded = useRef(false);
    const isLoadingRef = useRef(false);
    const loadUserContextRef = useRef<() => Promise<void>>(async () => { });

    const settersRef = useRef({
        setUserId,
        setFullName,
        setMobile,
        setEmail,
        setGender,
        setRole,
        setCollegePublicId,
        setCollegeId,
        setStudentId,
        setAdminId,
        setFinanceManagerId,
        setFacultyId,
        setCollegeAdminId,
        setParentId,
        setCollegeHrId,
        setPlacementEmployeeId,
        setWellBeingId,
        setWellBeingIds,
        setWellBeingRegistrationTypes,
        setCollegeEducationType,
        setCollegeBranchCode,
        setCollegeAcademicYear,
        setCollegeSection,
        setProfilePhoto,
        setDateOfJoining,
        setProfessionalExperienceYears,
        setIdentifierId,
        setLoading,
    });

    const resetStateRef = useRef(() => {
        const s = settersRef.current;
        s.setUserId(null);
        s.setFullName(null);
        s.setMobile(null);
        s.setEmail(null);
        s.setGender(null);
        s.setRole(null);
        s.setCollegePublicId(null);
        s.setCollegeId(null);
        s.setStudentId(null);
        s.setAdminId(null);
        s.setFinanceManagerId(null);
        s.setFacultyId(null);
        s.setCollegeAdminId(null);
        s.setParentId(null);
        s.setCollegeHrId(null);
        s.setPlacementEmployeeId(null);
        s.setWellBeingId(null);
        s.setWellBeingIds([]);
        s.setWellBeingRegistrationTypes([]);
        s.setCollegeEducationType(null);
        s.setCollegeBranchCode(null);
        s.setCollegeAcademicYear(null);
        s.setCollegeSection(null);
        s.setProfilePhoto(null);
        s.setDateOfJoining(null);
        s.setProfessionalExperienceYears(null);
        s.setIdentifierId(null);
    });

    const loadWellbeingContext = async (
        uid: number,
        cid: number,
        roleType: "wellbeingExecutive" | "wellbeingManager",
    ) => {
        const s = settersRef.current;
        const [{ data }, empId, userRes] = await Promise.all([
            supabase
                .from("well_beings")
                .select("wellBeingId, registrationType")
                .eq("userId", uid)
                .eq("collegeId", cid)
                .eq("roleType", roleType)
                .eq("isActive", true)
                .eq("is_deleted", false)
                .is("deletedAt", null)
                .order("wellBeingId", { ascending: true }),
            getEmployeeEmpId(uid, cid),
            supabase
                .from("users")
                .select("gender")
                .eq("userId", uid)
                .maybeSingle(),
        ]);

        const rows = data ?? [];
        const wellBeingIdsForRole = rows.map((row) => row.wellBeingId);
        s.setWellBeingId(rows[0]?.wellBeingId ?? null);
        s.setWellBeingIds(wellBeingIdsForRole);
        s.setWellBeingRegistrationTypes(
            rows
                .map((row) => row.registrationType)
                .filter((type): type is string => Boolean(type)),
        );
        s.setGender(userRes.data?.gender ?? null);
        s.setIdentifierId(empId ?? (rows[0]?.wellBeingId ? String(rows[0].wellBeingId) : null));

        const collegeWellBeingIds = rows
            .filter((row) => row.registrationType === "college")
            .map((row) => row.wellBeingId);

        if (!collegeWellBeingIds.length) {
            s.setCollegeEducationType(null);
            s.setCollegeBranchCode(null);
            s.setCollegeAcademicYear(null);
            s.setCollegeSection(null);
            return;
        }

        const { data: collegeDetails } = await supabase
            .from("wellbeing_college_details")
            .select(`
        college_education:collegeEducationId ( collegeEducationType ),
        college_branch:collegeBranchId ( collegeBranchCode ),
        college_academic_year:collegeAcademicYearId ( collegeAcademicYear ),
        college_sections:collegeSectionsId ( collegeSections )
      `)
            .in("wellBeingId", collegeWellBeingIds);

        const details = (collegeDetails ?? []) as WellbeingCollegeDetailContext[];
        s.setCollegeEducationType(
            uniqueJoinedValues(
                details.map((detail) => detail.college_education?.collegeEducationType),
            ),
        );
        s.setCollegeBranchCode(
            uniqueJoinedValues(
                details.map((detail) => detail.college_branch?.collegeBranchCode),
            ),
        );
        s.setCollegeAcademicYear(
            uniqueJoinedValues(
                details.map((detail) => detail.college_academic_year?.collegeAcademicYear),
            ),
        );
        s.setCollegeSection(
            uniqueJoinedValues(
                details.map((detail) => detail.college_sections?.collegeSections),
            ),
        );
    };

    const roleLoadersRef = useRef<RoleLoaderMap>({
        Student: async (uid, cid) => {
            const s = settersRef.current;
            const [sid, studentCtx] = await Promise.all([
                getStudentId(),
                fetchStudentContext(uid),
            ]);
            s.setStudentId(sid);
            s.setCollegeEducationType(studentCtx?.collegeEducationType ?? null);
            s.setCollegeBranchCode(studentCtx?.collegeBranchCode ?? null);
            s.setCollegeAcademicYear(studentCtx?.collegeAcademicYear ?? null);
            s.setCollegeSection(studentCtx?.collegeSections ?? null);
            if (sid) {
                const rn = await getStudentRollNo(sid, cid);
                s.setIdentifierId(rn);
            } else {
                s.setIdentifierId(null);
            }
        },

        Admin: async (uid, cid) => {
            const s = settersRef.current;
            const [adminData, adminCtx, empId] = await Promise.all([
                supabase
                    .from("admins")
                    .select("adminId")
                    .eq("userId", uid)
                    .is("deletedAt", null)
                    .maybeSingle(),
                fetchAdminContext(uid),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setAdminId(adminData.data?.adminId ?? null);
            s.setCollegeEducationType(adminCtx?.collegeEducationType ?? null);
            s.setIdentifierId(empId ?? null);
        },

        Finance: async (uid, cid) => {
            const s = settersRef.current;
            const [financeData, financeCtx, empId] = await Promise.all([
                supabase
                    .from("finance_manager")
                    .select("financeManagerId")
                    .eq("userId", uid)
                    .eq("is_deleted", false)
                    .maybeSingle(),
                fetchFinanceManagerContext(uid),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setFinanceManagerId(financeData.data?.financeManagerId ?? null);
            s.setCollegeEducationType(financeCtx?.collegeEducationType ?? null);
            s.setIdentifierId(empId ?? null);
        },

        FinanceManager: async (uid, cid) => {
            const s = settersRef.current;
            const [financeData, financeCtx, empId] = await Promise.all([
                supabase
                    .from("finance_manager")
                    .select("financeManagerId")
                    .eq("userId", uid)
                    .eq("is_deleted", false)
                    .maybeSingle(),
                fetchFinanceManagerContext(uid),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setFinanceManagerId(financeData.data?.financeManagerId ?? null);
            s.setCollegeEducationType(financeCtx?.collegeEducationType ?? null);
            s.setIdentifierId(empId ?? null);
        },

        Faculty: async (uid, cid) => {
            const s = settersRef.current;
            const [facultyData, facultyCtx, empId] = await Promise.all([
                supabase
                    .from("faculty")
                    .select("facultyId")
                    .eq("userId", uid)
                    .is("deletedAt", null)
                    .maybeSingle(),
                fetchFacultyContext(uid),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setFacultyId(facultyData.data?.facultyId ?? null);
            s.setCollegeEducationType(facultyCtx?.faculty_edu_type ?? null);
            s.setCollegeBranchCode(facultyCtx?.college_branch ?? null);
            s.setCollegeAcademicYear(facultyCtx?.collegeAcademicYear ?? null);
            const sections =
                facultyCtx?.sections
                    ?.map((sec: FacultySectionContext) => sec.college_sections?.collegeSections)
                    .filter(Boolean)
                    .join(", ") ?? null;
            s.setCollegeSection(sections);
            s.setIdentifierId(empId ?? null);
        },

        CollegeAdmin: async (uid, cid) => {
            const s = settersRef.current;
            const [{ data }, empId] = await Promise.all([
                supabase
                    .from("college_admin")
                    .select("collegeAdminId")
                    .eq("userId", uid)
                    .eq("is_deleted", false)
                    .maybeSingle(),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setCollegeAdminId(data?.collegeAdminId ?? null);
            s.setIdentifierId(empId ?? null);
        },

        Parent: async (uid) => {
            const s = settersRef.current;

            const { data: parentData } = await supabase
                .from("parents")
                .select("parentId, studentId")
                .eq("userId", uid)
                .eq("is_deleted", false)
                .maybeSingle();

            s.setParentId(parentData?.parentId ?? null);

            if (parentData?.studentId) {
                const [userRes, studentRes] = await Promise.all([
                    supabase
                        .from("users")
                        .select("gender")
                        .eq("userId", uid)
                        .maybeSingle(),
                    supabase
                        .from("students")
                        .select("student_pins(pinNumber)")
                        .eq("studentId", parentData.studentId)
                        .maybeSingle(),
                ]);

                const userData = userRes.data;
                const studentData = studentRes.data;

                if (userData?.gender && studentData?.student_pins) {
                    const genderInitial = userData.gender === "Male" ? "F" : "M";
                    const pins = studentData.student_pins as StudentPinContext;
                    const pinNumber = Array.isArray(pins)
                        ? pins[0]?.pinNumber
                        : pins?.pinNumber;
                    const formattedId = `${pinNumber}/${genderInitial}`;
                    s.setIdentifierId(formattedId);
                } else {
                    s.setIdentifierId(null);
                }
            } else {
                s.setIdentifierId(null);
            }
        },

        CollegeHr: async (uid, cid) => {
            const s = settersRef.current;
            const [{ data }, empId] = await Promise.all([
                supabase
                    .from("college_hr")
                    .select("collegeHrId")
                    .eq("userId", uid)
                    .eq("is_deleted", false)
                    .maybeSingle(),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setCollegeHrId(data?.collegeHrId ?? null);
            s.setIdentifierId(empId ?? null);
        },

        PlacementOfficer: async (uid, cid) => {
            const s = settersRef.current;
            const [{ data }, empId] = await Promise.all([
                supabase
                    .from("placement_employee")
                    .select("placementEmployeeId")
                    .eq("userId", uid)
                    .eq("is_deleted", false)
                    .maybeSingle(),
                getEmployeeEmpId(uid, cid),
            ]);
            s.setPlacementEmployeeId(data?.placementEmployeeId ?? null);
            s.setIdentifierId(empId ?? null);
        },

        WellbeingExecutive: async (uid, cid) => {
            await loadWellbeingContext(uid, cid, "wellbeingExecutive");
        },

        WellbeingManager: async (uid, cid) => {
            await loadWellbeingContext(uid, cid, "wellbeingManager");
        },
    });

    useEffect(() => {
        const loadUserContext = async () => {
            if (isLoadingRef.current) return;
            isLoadingRef.current = true;

            settersRef.current.setLoading(true);
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();
                if (userError || !user) {
                    resetStateRef.current();
                    isContextLoaded.current = false;
                    lastAuthUserId.current = null;
                    return;
                }
                const authId = user.id;
                if (isContextLoaded.current && lastAuthUserId.current === authId) {
                    return;
                }
                lastAuthUserId.current = authId;
                const { data: userData, error } = await supabase
                    .from("users")
                    .select(
                        "userId, fullName, mobile, email, gender, role, collegePublicId, collegeId, dateOfJoining, professionalExperienceYears"
                    )
                    .eq("auth_id", user.id)
                    .maybeSingle();
                if (error || !userData) {
                    return;
                }
                const s = settersRef.current;
                s.setUserId(userData.userId);
                s.setFullName(userData.fullName);
                s.setMobile(userData.mobile);
                s.setEmail(userData.email);
                s.setGender(userData.gender);
                s.setRole(userData.role);
                s.setCollegePublicId(userData.collegePublicId);
                s.setCollegeId(userData.collegeId);
                s.setDateOfJoining(userData.dateOfJoining ?? null);
                s.setProfessionalExperienceYears(userData.professionalExperienceYears ?? null);
                try {
                    const photoData = await getUserProfilePhoto(userData.userId);
                    s.setProfilePhoto(photoData?.profileUrl ?? null);
                } catch { }
                const loader = roleLoadersRef.current[userData.role];
                const cid = Number(userData.collegeId);
                if (loader && cid) {
                    await loader(userData.userId, cid);
                }
                isContextLoaded.current = true;
            } catch {
                console.error("Failed to load context");
            } finally {
                settersRef.current.setLoading(false);
                isLoadingRef.current = false;
            }
        };

        loadUserContextRef.current = loadUserContext;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUserContext();
            } else {
                resetStateRef.current();
                isContextLoaded.current = false;
                lastAuthUserId.current = null;
                settersRef.current.setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN") {
                const incomingAuthId = session?.user?.id ?? null;

                if (
                    isContextLoaded.current &&
                    lastAuthUserId.current === incomingAuthId
                ) {
                    return;
                }
                isContextLoaded.current = false;
                lastAuthUserId.current = null;
                await loadUserContext();
            }
            if (event === "SIGNED_OUT") {
                resetStateRef.current();
                isContextLoaded.current = false;
                lastAuthUserId.current = null;
                isLoadingRef.current = false;
                settersRef.current.setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const refreshUserContext = useCallback(async () => {
        isContextLoaded.current = false;
        lastAuthUserId.current = null;
        await loadUserContextRef.current();
    }, []);

    const contextValue = useMemo<UserContextType>(
        () => ({
            userId,
            loading,
            fullName,
            setFullName,
            mobile,
            email,
            gender,
            role,
            collegePublicId,
            collegeId,
            studentId,
            adminId,
            financeManagerId,
            facultyId,
            collegeAdminId,
            parentId,
            collegeHrId,
            placementEmployeeId,
            wellBeingId,
            wellBeingIds,
            wellBeingRegistrationTypes,
            collegeEducationType,
            collegeBranchCode,
            collegeAcademicYear,
            collegeSection,
            profilePhoto,
            setProfilePhoto,
            dateOfJoining,
            professionalExperienceYears,
            identifierId,
            refreshUserContext,
        }),
        [
            userId,
            loading,
            fullName,
            mobile,
            email,
            gender,
            role,
            collegePublicId,
            collegeId,
            studentId,
            adminId,
            financeManagerId,
            facultyId,
            collegeAdminId,
            parentId,
            collegeHrId,
            placementEmployeeId,
            wellBeingId,
            wellBeingIds,
            wellBeingRegistrationTypes,
            collegeEducationType,
            collegeBranchCode,
            collegeAcademicYear,
            collegeSection,
            profilePhoto,
            dateOfJoining,
            professionalExperienceYears,
            identifierId,
            refreshUserContext,
        ]
    );

    return (
        <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);