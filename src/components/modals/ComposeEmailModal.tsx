import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Picker } from '@react-native-picker/picker';
import { getUniqueRoles, getEducationTypes, getBranches, getYears, getSemesters, getSections } from '@/lib/helpers/email/emailFiltersAPI';
import { sendEmailLocally } from '@/lib/helpers/email/sendEmailAPI';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';

type Props = {
  visible: boolean;
  onClose: () => void;
  collegeId: number;
  onSuccess?: () => void;
  replyData?: {
    to: string;
    subject: string;
    body: string;
    senderName: string;
    date: string;
    time: string;
  } | null;
  initialEmail?: string;
};

export default function ComposeEmailModal({ visible, onClose, collegeId, replyData, onSuccess, initialEmail }: Props) {const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const fullName = user?.fullName || '';
  const email = (user as any)?.email || '';
  const userId = user?.userId;

  const [audience, setAudience] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");

  const [edu, setEdu] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [sem, setSem] = useState("");
  const [sec, setSec] = useState("");

  const [rolesList, setRolesList] = useState<string[]>([]);
  const [eduList, setEduList] = useState<any[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [yearList, setYearList] = useState<any[]>([]);
  const [semList, setSemList] = useState<any[]>([]);
  const [secList, setSecList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const richText = useRef<RichEditor>(null);

  useEffect(() => {
    if (visible && collegeId) {
      getUniqueRoles(collegeId).then(setRolesList);
      getEducationTypes(collegeId).then(setEduList);
    }
  }, [visible, collegeId]);

  useEffect(() => {
    if (visible) {
      if (replyData) {
        setAudience("");
        setManualEmail(replyData.to);
        const newSubject = replyData.subject.toLowerCase().startsWith("re:") ?
        replyData.subject :
        `Re: ${replyData.subject}`;
        setSubject(newSubject);

        const quoteHeader = `<br/><br/><div style="color: #6B7280; font-size: 12px;">On ${replyData.date} at ${replyData.time}, ${replyData.senderName} &lt;${replyData.to}&gt; wrote:</div>`;
        const quotedBody = `<blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 0;">${replyData.body}</blockquote>`;

        const finalHtml = `${quoteHeader}${quotedBody}`;
        setTimeout(() => {
          richText.current?.setContentHTML(finalHtml);
        }, 500);
      } else if (initialEmail) {
        setAudience("");
        setManualEmail(initialEmail);
      }
    }
  }, [visible, replyData, initialEmail]);

  useEffect(() => {
    setBranch("");
    if (edu) getBranches(edu).then(setBranchList);else
    setBranchList([]);
  }, [edu]);

  useEffect(() => {
    setYear("");
    if (branch) getYears(branch).then(setYearList);else
    setYearList([]);
  }, [branch]);

  useEffect(() => {
    setSem("");
    setSec("");
    if (year) {
      getSemesters(year).then(setSemList);
      getSections(year).then(setSecList);
    } else {
      setSemList([]);
      setSecList([]);
    }
  }, [year]);

  const handleClose = () => {
    setManualEmail("");
    setSubject("");
    setAudience("");
    setEdu("");
    setBranch("");
    setYear("");
    setSem("");
    setSec("");
    richText.current?.setContentHTML("");
    onClose();
  };

  const handleSend = async () => {
    const currentHtml = await richText.current?.getContentHtml();

    if (!subject || !currentHtml || currentHtml.trim() === '') {
      Toast.show({ type: 'error', text1: 'Subject and description are required.' });
      return;
    }
    if (!audience && !manualEmail) {
      Toast.show({ type: 'error', text1: 'Please select an audience or enter an email.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        collegeId,
        audience,
        manualEmail,
        filters: { edu, branch, year, sem, sec },
        cc,
        subject,
        description: currentHtml,
        senderName: fullName,
        senderAddress: email,
        senderUserId: userId
      };

      await sendEmailLocally(payload);

      Toast.show({ type: 'success', text1: 'Email sent successfully!' });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: error.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
      transparent={Platform.OS === 'android'}
      onRequestClose={handleClose}>
      
            <View style={{ flex: 1, backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent', paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                        <Text className="text-[17px] font-semibold text-[#282828]">{t("Auto.Common.ComposeEmail", "Compose Email")}</Text>
                        <TouchableOpacity onPress={handleClose} className="p-1 rounded-full bg-transparent">
                            <X size={24} color="#282828" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-4 py-3" keyboardShouldPersistTaps="handled">
                        <View className="mb-3">
                            <Text className="text-[13px] font-semibold text-[#282828] mb-1">{t("Auto.Common.SendTo", "Send To")}</Text>
                            <View className="flex-row gap-2">
                                {!initialEmail &&
                  <View className="flex-1 border border-gray-300 rounded-md bg-white justify-center h-[50px] overflow-hidden">
                                        <Picker
                      selectedValue={audience}
                      onValueChange={setAudience}
                      style={{ height: 50, color: '#111827' }}>
                      
                                            <Picker.Item label={t("Auto.Attr.SelectAudience", "Select Audience")} value="" color="#9CA3AF" style={{ fontSize: 13 }} />
                                            {rolesList.map((role) =>
                      <Picker.Item key={role} label={role} value={role} style={{ fontSize: 13 }} />
                      )}
                                        </Picker>
                                    </View>
                  }
                                <TextInput
                    className="flex-1 px-3 h-[50px] border border-gray-300 rounded-md text-[13px]"
                    placeholder={t("Auto.Attr.orenteremail", "or enter email")}
                    value={manualEmail}
                    onChangeText={setManualEmail}
                    keyboardType="email-address"
                    autoCapitalize="none" />
                  
                            </View>
                        </View>

                        {!initialEmail &&
              <View className="mb-3">
                                <Text className="text-[13px] font-semibold text-[#282828] mb-1">{t("Auto.Common.Filters", "Filters")}</Text>
                                <View className="flex-row flex-wrap justify-between gap-y-2">
                                    <FilterPill label={t("Auto.Attr.EduType", "Edu Type")} value={edu} onChange={setEdu} options={eduList} valKey="collegeEducationId" nameKey="collegeEducationType" defaultLabel="All" />
                                    <FilterPill label={t("Auto.Common.Branch", "Branch")} value={branch} onChange={setBranch} options={branchList} valKey="collegeBranchId" nameKey="collegeBranchType" defaultLabel="All" disabled={!edu} />
                                    <FilterPill label={t("Auto.Attr.Year", "Year")} value={year} onChange={setYear} options={yearList} valKey="collegeAcademicYearId" nameKey="collegeAcademicYear" defaultLabel="All Years" disabled={!branch} />
                                    <FilterPill label={t("Auto.Common.Sem", "Sem")} value={sem} onChange={setSem} options={semList} valKey="collegeSemesterId" nameKey="collegeSemester" defaultLabel="All" disabled={!year} />
                                    <FilterPill label={t("Auto.Common.Sec", "Sec")} value={sec} onChange={setSec} options={secList} valKey="collegeSectionsId" nameKey="collegeSections" defaultLabel="All Sections" disabled={!year} />
                                </View>
                            </View>
              }

                        <View className="mb-3">
                            <Text className="text-[13px] font-semibold text-[#282828] mb-1">{t("Auto.Common.Cc", "Cc")}</Text>
                            <TextInput
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]"
                  placeholder={t("Auto.Attr.commaseparatede", "comma separated emails")}
                  value={cc}
                  onChangeText={setCc}
                  autoCapitalize="none" />
                
                        </View>

                        <View className="mb-3">
                            <Text className="text-[13px] font-semibold text-[#282828] mb-1">{t("Auto.Common.Subject", "Subject")}</Text>
                            <TextInput
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]"
                  placeholder={t("Auto.Common.Subject", "Subject")}
                  value={subject}
                  onChangeText={setSubject} />
                
                        </View>

                        <View className="mb-3 flex-1 min-h-[200px] border border-gray-300 rounded-md overflow-hidden">
                            <RichToolbar
                  editor={richText}
                  actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.insertOrderedList,
                  actions.insertBulletsList,
                  actions.undo,
                  actions.redo]
                  }
                  style={{ backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' }} />
                
                            <RichEditor
                  ref={richText}
                  placeholder={t("Auto.Attr.Writeyouremailh", "Write your email here...")}
                  containerStyle={{ flex: 1, minHeight: 150 }}
                  editorStyle={{ backgroundColor: 'white', color: '#111827' }} />
                
                        </View>

                        <TouchableOpacity
                onPress={handleSend}
                disabled={isSubmitting}
                className={`w-full py-3 rounded-md items-center justify-center mb-8 ${isSubmitting ? 'bg-[#a1e0bd]' : 'bg-[#43C17A]'}`}>
                
                            {isSubmitting ?
                <ActivityIndicator color="white" /> :

                <Text className="text-white font-semibold">{t("Auto.Common.SendEmail", "Send Email")}</Text>
                }
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            </View>
        </Modal>);

}

function FilterPill({ label, value, options, onChange, valKey, nameKey, defaultLabel, disabled }: any) {
  return (
    <View className={`w-[48%] border border-gray-200 bg-gray-50 rounded-md overflow-hidden min-h-[50px] justify-center ${disabled ? "opacity-50" : ""}`}>
      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => onChange(itemValue)}
        enabled={!disabled}
        style={{ height: 50, color: disabled ? '#9CA3AF' : '#43C17A' }}
        dropdownIconColor="#43C17A">
        
        <Picker.Item label={defaultLabel} value="" style={{ fontSize: 13 }} />
        {options.map((opt: any) =>
        <Picker.Item key={opt[valKey]} label={opt[nameKey]} value={opt[valKey]} style={{ fontSize: 13 }} />
        )}
      </Picker>
    </View>);

}