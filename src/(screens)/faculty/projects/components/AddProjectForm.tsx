import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from "react-native";
import tw from "twrnc";
import { CaretLeft, Plus, X, CaretDown } from "phosphor-react-native";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { fetchFacultySections, fetchFacultySubjects, fetchFacultyYears } from "@/lib/helpers/faculty/facultyAPI";
import { fetchFilteredFaculties } from "@/lib/helpers/faculty/fetchFaculties";
import { fetchStudentsWithProfile } from "@/lib/helpers/faculty/fetchStudents";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveProject } from "@/lib/helpers/projects/project";
import { uploadProjectFile, addProjectFiles } from "@/lib/helpers/projects/projectFiles";
import { addStudentsToProject } from "@/lib/helpers/projects/projectTeamMembers";
import { addMentorsToProject } from "@/lib/helpers/projects/projectMentors";

interface AddProjectFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

const MultiSelectDropdown = ({ items, selectedIds, onToggle, placeholder, label }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <View style={tw`mb-4 mt-5`}>
            <Text style={tw`text-sm font-semibold mb-1 text-gray-800`}>{label} <Text style={tw`text-red-500`}>*</Text></Text>
            <TouchableOpacity 
                style={tw`border border-gray-300 bg-white p-3 rounded-lg flex-row justify-between items-center`}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={tw`text-gray-700`}>
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : placeholder}
                </Text>
                <CaretDown size={16} color="#4b5563" />
            </TouchableOpacity>
            
            {isOpen && (
                <View style={tw`border border-gray-300 border-t-0 bg-white rounded-b-lg max-h-48 overflow-hidden`}>
                    <ScrollView nestedScrollEnabled>
                        {items.length > 0 ? items.map((item: any) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={tw`flex-row items-center py-3 px-3 border-b border-gray-100`}
                                onPress={() => onToggle(item.id)}
                            >
                                <View style={tw`w-4 h-4 rounded-full border border-green-500 mr-3 items-center justify-center`}>
                                    {selectedIds.includes(item.id) && <View style={tw`w-2 h-2 rounded-full bg-green-500`} />}
                                </View>
                                <Text style={tw`text-gray-800`}>{item.name}</Text>
                            </TouchableOpacity>
                        )) : (
                            <Text style={tw`p-3 text-gray-500`}>No items found</Text>
                        )}
                    </ScrollView>
                </View>
            )}

            {selectedIds.length > 0 && (
                <View style={tw`flex-row flex-wrap gap-2 mt-3`}>
                    {items.filter((item: any) => selectedIds.includes(item.id)).map((item: any) => (
                        <View key={item.id} style={tw`bg-green-100 flex-row items-center px-3 py-1.5 rounded-full`}>
                            <Text style={tw`text-green-800 text-xs mr-2 font-medium`}>{item.name}</Text>
                            <TouchableOpacity onPress={() => onToggle(item.id)}>
                                <X size={12} color="#166534" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

export default function AddProjectForm({ onCancel, onSuccess }: AddProjectFormProps) {
    const { facultyId, collegeId } = useFaculty();
    const insets = useSafeAreaInsets();
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [domainInput, setDomainInput] = useState("");
    const [domains, setDomains] = useState<string[]>([]);
    const [marks, setMarks] = useState("");
    
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

    const [years, setYears] = useState<{ id: number; label: string }[]>([]);
    const [subjects, setSubjects] = useState<{ id: number; label: string }[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");

    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [allMentors, setAllMentors] = useState<any[]>([]);
    
    const [studentIds, setStudentIds] = useState<number[]>([]);
    const [mentorIds, setMentorIds] = useState<number[]>([]);
    
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!facultyId) return;
        fetchFacultyYears(facultyId).then((data) => {
            setYears(data);
            if (data.length > 0) setSelectedYear(data[0].id.toString());
        });
    }, [facultyId]);

    useEffect(() => {
        if (!facultyId || !selectedYear) return;
        fetchFacultySubjects(facultyId, Number(selectedYear)).then((data) => {
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0].id.toString());
            else setSelectedSubject("");
        });
    }, [facultyId, selectedYear]);

    useEffect(() => {
        if (!facultyId || !selectedYear || !selectedSubject) {
            setSections([]);
            return;
        }
        fetchFacultySections(facultyId, Number(selectedYear), Number(selectedSubject)).then((data) => {
            setSections(data);
            if (data.length > 0) setSelectedSection(data[0].college_sections?.collegeSectionsId?.toString() ?? "");
            else setSelectedSection("");
        });
    }, [facultyId, selectedYear, selectedSubject]);

    useEffect(() => {
        if (!collegeId) return;
        fetchFilteredFaculties({ collegeId }).then((res) => setAllMentors(res.data));
    }, [collegeId]);

    useEffect(() => {
        if (!collegeId || !selectedYear || !selectedSection) {
            setAllStudents([]);
            return;
        }
        fetchStudentsWithProfile(collegeId, { yearId: Number(selectedYear), sectionId: Number(selectedSection) })
            .then(setAllStudents);
    }, [collegeId, selectedYear, selectedSection]);

    const handleAddDomain = () => {
        const val = domainInput.trim();
        if (val && !domains.includes(val)) {
            setDomains([...domains, val]);
        }
        setDomainInput("");
    };

    const handleFilePick = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                multiple: true,
            });
            if (!res.canceled) {
                setFiles((prev) => [...prev, ...res.assets]);
            }
        } catch (err) {
            console.error("Document picker error:", err);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !description.trim() || !selectedYear || !selectedSubject || !selectedSection || !startDate || !endDate || !marks) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }
        if (domains.length === 0) {
            Alert.alert("Error", "Please add at least one domain.");
            return;
        }
        if (endDate <= startDate) {
            Alert.alert("Error", "End date must be after start date.");
            return;
        }
        if (!facultyId || !collegeId) {
            Alert.alert("Error", "Missing context.");
            return;
        }

        setLoading(true);
        try {
            const projectResult = await saveProject({
                title,
                description,
                domain: domains,
                marks: Number(marks),
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                collegeId,
                facultyId,
                collegeAcademicYearId: Number(selectedYear),
                collegeSubjectId: Number(selectedSubject),
                collegeSectionsId: Number(selectedSection),
            });

            if (!projectResult.success || !projectResult.projectId) throw new Error("Failed to create project");
            const newId = projectResult.projectId;

            const uploadedUrls: string[] = [];
            for (const f of files) {
                const res = await uploadProjectFile(newId, { uri: f.uri, name: f.name, type: f.mimeType });
                if (res.success) uploadedUrls.push(res.publicUrl);
            }

            await Promise.all([
                addStudentsToProject(newId, studentIds),
                addMentorsToProject(newId, mentorIds),
                addProjectFiles(newId, uploadedUrls),
            ]);

            Toast.show({ type: "success", text1: "Project saved successfully!" });
            onSuccess();
        } catch (error) {
            console.error("handleSave error:", error);
            Alert.alert("Error", "Failed to save project.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[tw`flex-1 bg-[#F9FAFB]`, { paddingTop: insets.top + 112 }]}>
            <View style={tw`flex-row items-center p-4 border-b border-gray-200 bg-white`}>
                <TouchableOpacity onPress={onCancel} style={tw`mr-3`}>
                    <CaretLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={tw`text-xl font-bold`}>Add Project</Text>
            </View>

            <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-6 mt-4`}>
                    {/* Selectors */}
                    <Text style={tw`text-sm font-semibold mb-1 mt-3 text-gray-800`}>Year</Text>
                    <View style={tw`border border-gray-300 rounded-lg`}>
                        <Picker selectedValue={selectedYear} onValueChange={setSelectedYear}>
                            {years.map(y => <Picker.Item key={y.id} label={y.label} value={y.id.toString()} />)}
                        </Picker>
                    </View>

                    <Text style={tw`text-sm font-semibold mb-1 mt-3 text-gray-800`}>Subject</Text>
                    <View style={tw`border border-gray-300 rounded-lg`}>
                        <Picker selectedValue={selectedSubject} onValueChange={setSelectedSubject}>
                            {subjects.map(s => <Picker.Item key={s.id} label={s.label} value={s.id.toString()} />)}
                        </Picker>
                    </View>

                    <Text style={tw`text-sm font-semibold mb-1 mt-3 text-gray-800`}>Section</Text>
                    <View style={tw`border border-gray-300 rounded-lg`}>
                        <Picker selectedValue={selectedSection} onValueChange={setSelectedSection}>
                            {sections.map(s => <Picker.Item key={s.facultySectionId} label={s.college_sections?.collegeSections} value={s.college_sections?.collegeSectionsId.toString()} />)}
                        </Picker>
                    </View>

                    {/* Basic Info */}
                    <Text style={tw`text-sm font-semibold mb-1 mt-5 text-gray-800`}>Title <Text style={tw`text-red-500`}>*</Text></Text>
                    <TextInput style={tw`border border-gray-300 rounded-lg px-3 py-2 bg-white`} placeholder="Project Title" value={title} onChangeText={setTitle} />

                    <Text style={tw`text-sm font-semibold mb-1 mt-4 text-gray-800`}>Description <Text style={tw`text-red-500`}>*</Text></Text>
                    <TextInput style={tw`border border-gray-300 rounded-lg px-3 py-2 bg-white`} placeholder="Project Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

                    {/* Domains */}
                    <Text style={tw`text-sm font-semibold mb-1 mt-4 text-gray-800`}>Domains <Text style={tw`text-red-500`}>*</Text></Text>
                    <View style={tw`flex-row items-center gap-2 mb-2`}>
                        <TextInput style={tw`flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white`} placeholder="Add Domain" value={domainInput} onChangeText={setDomainInput} onSubmitEditing={handleAddDomain} />
                        <TouchableOpacity style={tw`bg-green-500 p-2.5 rounded-lg`} onPress={handleAddDomain}>
                            <Plus color="#fff" size={18} />
                        </TouchableOpacity>
                    </View>
                    <View style={tw`flex-row flex-wrap gap-2`}>
                        {domains.map((d, i) => (
                            <View key={i} style={tw`bg-green-100 flex-row items-center px-3 py-1 rounded-full`}>
                                <Text style={tw`text-green-800 text-xs`}>{d}</Text>
                                <TouchableOpacity onPress={() => setDomains(domains.filter(x => x !== d))} style={tw`ml-2`}>
                                    <X size={12} color="#166534" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Marks */}
                    <Text style={tw`text-sm font-semibold mb-1 mt-4 text-gray-800`}>Marks <Text style={tw`text-red-500`}>*</Text></Text>
                    <TextInput style={tw`border border-gray-300 rounded-lg px-3 py-2 bg-white`} placeholder="100" keyboardType="numeric" value={marks} onChangeText={setMarks} />

                    {/* Dates */}
                    <View style={tw`flex-row gap-4 mt-4`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-sm font-semibold mb-1 text-gray-800`}>Start Date <Text style={tw`text-red-500`}>*</Text></Text>
                            <TouchableOpacity onPress={() => setStartDatePickerVisibility(true)} style={tw`border border-gray-300 rounded-lg px-3 py-3 bg-white`}>
                                <Text>{startDate ? startDate.toLocaleDateString() : "Select Date"}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-sm font-semibold mb-1 text-gray-800`}>End Date <Text style={tw`text-red-500`}>*</Text></Text>
                            <TouchableOpacity onPress={() => setEndDatePickerVisibility(true)} style={tw`border border-gray-300 rounded-lg px-3 py-3 bg-white`}>
                                <Text>{endDate ? endDate.toLocaleDateString() : "Select Date"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Team Members & Mentors */}
                    <MultiSelectDropdown 
                        label="Team Members"
                        placeholder="Select Team Members"
                        items={allStudents}
                        selectedIds={studentIds}
                        onToggle={(id: number) => setStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    />

                    <MultiSelectDropdown 
                        label="Mentors"
                        placeholder="Select Mentors"
                        items={allMentors}
                        selectedIds={mentorIds}
                        onToggle={(id: number) => setMentorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    />

                    {/* Files */}
                    <Text style={tw`text-sm font-semibold mb-1 mt-5 text-gray-800`}>Attachments</Text>
                    <TouchableOpacity onPress={handleFilePick} style={tw`border-2 border-dashed border-gray-300 rounded-xl p-8 items-center bg-gray-50`}>
                        <Text style={tw`text-gray-500`}>Tap to browse files</Text>
                    </TouchableOpacity>
                    {files.map((f, i) => (
                        <View key={i} style={tw`flex-row items-center mt-2 p-2 bg-gray-100 rounded`}>
                            <Text style={tw`flex-1`} numberOfLines={1}>{f.name}</Text>
                            <TouchableOpacity onPress={() => setFiles(files.filter(x => x !== f))}>
                                <X size={16} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={tw`bg-[#43C17A] py-3 rounded-xl items-center mt-8 ${loading ? "opacity-50" : ""}`}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={tw`text-white font-bold text-lg`}>{loading ? "Saving..." : "Save Project"}</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            <DateTimePickerModal
                isVisible={isStartDatePickerVisible}
                mode="date"
                onConfirm={(date) => { setStartDate(date); setStartDatePickerVisibility(false); }}
                onCancel={() => setStartDatePickerVisibility(false)}
            />
            <DateTimePickerModal
                isVisible={isEndDatePickerVisible}
                mode="date"
                onConfirm={(date) => { setEndDate(date); setEndDatePickerVisibility(false); }}
                onCancel={() => setEndDatePickerVisibility(false)}
            />
        </View>
    );
}
