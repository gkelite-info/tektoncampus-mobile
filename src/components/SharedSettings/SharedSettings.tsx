import { Text } from '@/components/AppText';
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, Switch, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellSimple, CaretRight, Envelope, GearSix, Globe, Key, LockKey, ShieldCheck, TextT, UserCircle } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useUser } from '@/utils/context/UserContext';
import { getUserPreferences, updateUserPreferences } from '@/lib/helpers/settings/preferencesAPI';
import SettingsShimmer from './shimmers/SettingsShimmer';
import { fonts } from '@/constants/fonts';
const MIN_FONT_SCALE = 85;
const MAX_FONT_SCALE = 115;
const FONT_STEP = 5;
const COLORS = {
  text: '#282828',
  green: '#43C17A',
  navy: '#16284F',
  switchOff: '#D1D5DB',
  border: '#ECEFF1',
  background: '#F4F5F6'
};
type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}>;
const pressedStyle = ({
  pressed


}: {pressed: boolean;}) => pressed ? {
  opacity: 0.7
} : null;
const snapFontScale = (value: number) => {
  const clamped = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
  return Math.round(clamped / FONT_STEP) * FONT_STEP;
};
const Divider = React.memo(() => <View className="ml-[66px] h-[1px] bg-[#ECEFF1]" />);
const IconBubble = React.memo(({
  children


}: {children: React.ReactNode;}) => <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#43C17A26]">
    {children}
  </View>);
const SettingsGroup = ({
  children


}: {children: React.ReactNode;}) => {
  const {
    t
  } = useTranslation();
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  return <View className="mb-6 overflow-hidden rounded-2xl border border-[#ECEFF1] bg-white shadow-sm">
      {childrenArray.map((child, index) => <React.Fragment key={index}>
          {child}
          {index < childrenArray.length - 1 && <Divider />}
        </React.Fragment>)}
    </View>;
};
const SectionHeader = ({
  title


}: {title: string;}) => {const { t } = useTranslation();return <Text className="mb-2 ml-4 text-xs tracking-wider text-gray-500" style={{
    fontFamily: fonts.bold,
    textTransform: t("uppercase")
  }}>
    {title}
  </Text>;};
type SettingsRowProps = {
  title: string;
  description: string;
  icon: IconComponent;
  onPress?: () => void;
  right?: React.ReactNode;
  disabled?: boolean;
  showWip?: boolean;
  children?: React.ReactNode;
};
const SettingsRow = React.memo(({
  title,
  description,
  icon: Icon,
  onPress,
  right,
  disabled,
  showWip,
  children
}: SettingsRowProps) => {
  const content = <View className={`min-h-[72px] justify-center bg-white px-4 py-3.5 ${disabled ? "opacity-60" : ''}`}>
        <View className="flex-row items-center gap-3.5">
          <IconBubble>
            <Icon size={22} weight="fill" color={COLORS.green} />
          </IconBubble>

          <View className="min-w-0 flex-1 justify-center">
            <Text numberOfLines={1} className="text-[16px] text-[#282828]" style={{
          fontFamily: fonts.medium
        }}>
              {title}
            </Text>
            {description ? <Text numberOfLines={1} className="mt-0.5 text-[13px] text-gray-500" style={{
          fontFamily: fonts.regular
        }}>
                {description}
              </Text> : null}
          </View>

          <View className="items-end justify-center pl-2">
            {right ?? <CaretRight size={20} color="#9CA3AF" weight="bold" />}
          </View>
        </View>

        {children && <View className="mt-2 pl-[54px]">{children}</View>}

        {showWip && <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-white/60">
            <Text className="rounded-full bg-[#16284F] px-3 py-1 text-[11px] font-bold tracking-wide text-white overflow-hidden" style={{
        fontFamily: fonts.bold
      }}>{"WIP"}</Text>
          </View>}
      </View>;
  if (!onPress || disabled) return content;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} android_ripple={{
    color: '#EEF2F4'
  }} onPress={onPress} style={pressedStyle}>
        {content}
      </Pressable>;
});
const FontScaleSlider = React.memo(({
  value,
  onChange,
  onChangeEnd




}: {value: number;onChange: (value: number) => void;onChangeEnd?: (value: number) => void;}) => {
  const [trackWidth, setTrackWidth] = useState(1);
  const [dragX, setDragX] = useState<number | null>(null);
  const SECTIONS = (MAX_FONT_SCALE - MIN_FONT_SCALE) / FONT_STEP;
  const progress = (value - MIN_FONT_SCALE) / (MAX_FONT_SCALE - MIN_FONT_SCALE);
  const valueLeft = Math.max(0, Math.min(1, progress)) * trackWidth;
  const thumbLeft = dragX !== null ? Math.max(0, Math.min(trackWidth, dragX)) : valueLeft;
  const stateRef = useRef({
    trackWidth,
    startX: 0
  });
  stateRef.current.trackWidth = trackWidth;
  const callbacksRef = useRef({
    onChange,
    onChangeEnd
  });
  callbacksRef.current = {
    onChange,
    onChangeEnd
  };
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const touchX = event.nativeEvent.locationX;
      stateRef.current.startX = touchX;
      setDragX(touchX);
      const ratio = Math.max(0, Math.min(1, touchX / stateRef.current.trackWidth));
      const next = MIN_FONT_SCALE + ratio * (MAX_FONT_SCALE - MIN_FONT_SCALE);
      callbacksRef.current.onChange(snapFontScale(next));
    },
    onPanResponderMove: (event, gestureState) => {
      const newX = stateRef.current.startX + gestureState.dx;
      setDragX(newX);
      const ratio = Math.max(0, Math.min(1, newX / stateRef.current.trackWidth));
      const next = MIN_FONT_SCALE + ratio * (MAX_FONT_SCALE - MIN_FONT_SCALE);
      callbacksRef.current.onChange(snapFontScale(next));
    },
    onPanResponderRelease: (event, gestureState) => {
      const finalX = stateRef.current.startX + gestureState.dx;
      const ratio = Math.max(0, Math.min(1, finalX / stateRef.current.trackWidth));
      const next = MIN_FONT_SCALE + ratio * (MAX_FONT_SCALE - MIN_FONT_SCALE);
      const snappedNext = snapFontScale(next);
      setDragX(null);
      callbacksRef.current.onChange(snappedNext);
      callbacksRef.current.onChangeEnd?.(snappedNext);
    },
    onPanResponderTerminate: () => {
      setDragX(null);
    }
  }), []);
  return <View className="flex-row items-center gap-3 py-2 pr-2">
        <Text className="text-[16px] text-gray-400" style={{
      fontFamily: fonts.medium
    }}>{"A"}</Text>

        <View accessibilityRole="adjustable" className="h-8 flex-1 justify-center relative" onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)} {...panResponder.panHandlers}>
          
          <View className="h-1.5 w-full rounded-full bg-[#DDE3E8]" pointerEvents="none" />
          
          <View className="absolute w-full h-1.5 flex-row justify-between items-center px-1" pointerEvents="none">
            {Array.from({
          length: SECTIONS + 1
        }).map((_, i) => <View key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />)}
          </View>

          <View className="absolute h-1.5 rounded-full bg-[#16284F]" style={{
        width: thumbLeft
      }} pointerEvents="none" />
          <View className="absolute h-6 w-6 rounded-full border-4 border-white bg-[#16284F] shadow-sm" style={{
        left: thumbLeft - 12
      }} pointerEvents="none" />
        </View>

        <Text className="text-[22px] text-gray-700" style={{
      fontFamily: fonts.medium
    }}>{"A"}</Text>
      </View>;
});
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    width
  } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    userId,
    fontScale,
    setFontScale
  } = useUser();
  const {
    t,
    i18n
  } = useTranslation();
  const isCompact = width < 380;
  const switchScale = isCompact ? 0.85 : 0.95;
  const [isLoading, setIsLoading] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language === "hi" ? t("Hindi") : i18n.language === "te" ? t("Telugu") : i18n.language === "ur" ? t("Urdu") : t("English"));
  useEffect(() => {
    if (!userId) return;
    const loadPrefs = async () => {
      try {
        const prefs = await getUserPreferences(userId);
        if (prefs) {
          setEmailAlerts(prefs.email_alerts ?? true);
          setReminders((prefs.assignment_reminders || prefs.event_reminders || prefs.class_reminders) ?? true);
        }
      } catch (e) {
        console.error(t("Failed to load preferences:"), e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrefs();
  }, [userId]);
  const updatePref = async (updates: any) => {
    if (!userId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateUserPreferences(userId, updates);
    } catch (e) {
      console.error(t("Failed to update preference:"), e);
    }
  };
  const handleEmailAlertsChange = (val: boolean) => {
    setEmailAlerts(val);
    updatePref({
      email_alerts: val
    });
  };
  const handleRemindersChange = (val: boolean) => {
    setReminders(val);
    updatePref({
      assignment_reminders: val,
      event_reminders: val,
      class_reminders: val
    });
  };
  const handleFontScaleChange = (val: number) => {
    if (val !== fontScale) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFontScale(val);
    }
  };
  const handleFontScaleChangeEnd = (val: number) => {
    updatePref({
      font_scale: val
    });
  };
  const changeLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    if (lang === "English") i18n.changeLanguage(t("en"));else if (lang === "Hindi") i18n.changeLanguage(t("hi"));else if (lang === "Telugu") i18n.changeLanguage(t("te"));else if (lang === "Urdu") i18n.changeLanguage(t("ur"));
    setLanguageModalVisible(false);
  };
  const closeLanguageModal = useCallback(() => setLanguageModalVisible(false), []);
  if (isLoading) {
    return <SettingsShimmer />;
  }
  return <View className="flex-1 bg-[#F4F5F6]">
      <ScrollView bounces showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{
      paddingHorizontal: 16,
      paddingTop: Math.max(insets.top, 12) + 120,
      paddingBottom: Math.max(insets.bottom, 16) + 40
    }}>
        
        <View className="flex-row items-center gap-4 mb-8 pl-2">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#43C17A26]">
            <GearSix size={26} color={COLORS.green} weight="fill" />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] text-[#282828] tracking-tight" style={{
            fontFamily: fonts.bold
          }}>
              {t("Settings.Settings", "Settings")}
            </Text>
            <Text className="text-[14px] text-gray-500 mt-0.5" style={{
            fontFamily: fonts.regular
          }}>
              {t("Settings.Manage your account and preferences", "Manage your account and preferences")}
            </Text>
          </View>
        </View>

        <SectionHeader title={t("App Preferences", "App Preferences")} />
        <SettingsGroup>
          <SettingsRow title={t("Settings.Email Alerts", "Email Alerts")} description={t("Settings.Receive important updates via email", "Receive important updates via email")} icon={Envelope} onPress={() => handleEmailAlertsChange(!emailAlerts)} right={<Switch value={emailAlerts} onValueChange={handleEmailAlertsChange} trackColor={{
          false: COLORS.switchOff,
          true: COLORS.navy
        }} ios_backgroundColor={COLORS.switchOff} style={{
          transform: [{
            scale: switchScale
          }]
        }} />} />
          <SettingsRow title={t("Settings.Assignment / Event / Class Reminders", "Assignment / Event / Class Reminders")} description={t("Settings.Manage notification preferences", "Manage notification preferences")} icon={BellSimple} onPress={() => handleRemindersChange(!reminders)} right={<Switch value={reminders} onValueChange={handleRemindersChange} trackColor={{
          false: COLORS.switchOff,
          true: COLORS.navy
        }} ios_backgroundColor={COLORS.switchOff} style={{
          transform: [{
            scale: switchScale
          }]
        }} />} />
          <SettingsRow title={t("Settings.Language Preferences", "Language Preferences")} description={selectedLanguage} icon={Globe} onPress={() => setLanguageModalVisible(true)} />
          <SettingsRow title={t("Settings.Font Size", "Font Size")} description={t("Settings.Adjust text size for optimum readability", "Adjust text size for optimum readability")} icon={TextT}>
            <FontScaleSlider value={fontScale} onChange={handleFontScaleChange} onChangeEnd={handleFontScaleChangeEnd} />
          </SettingsRow>
        </SettingsGroup>

        <SectionHeader title={t("Account & Security", "Account & Security")} />
        <SettingsGroup>
          <SettingsRow title={t("Settings.Change Password", "Change Password")} description={t("Settings.Update your account password", "Update your account password")} icon={Key} onPress={() => navigation.navigate("VerifyPassword")} />
          <SettingsRow title={t("Settings.Manage Linked Accounts", "Manage Linked Accounts")} description={t("Settings.Connect or disconnect third-party accounts", "Connect or disconnect third-party accounts")} icon={UserCircle} onPress={() => navigation.navigate("LinkedAccounts")} />
          <SettingsRow title={t("Settings.Two-Step Verification", "Two-Step Verification")} description={t("Settings.Add an extra layer of security", "Add an extra layer of security")} icon={LockKey} onPress={() => navigation.navigate("TwoStepVerification")} />
        </SettingsGroup>

        <SectionHeader title={t("About", "About")} />
        <SettingsGroup>
          <SettingsRow title={t("Settings.Privacy Policy", "Privacy Policy")} description={t("Settings.View our privacy policy", "View our privacy policy")} icon={ShieldCheck} onPress={() => navigation.navigate("PrivacyPolicy")} />
        </SettingsGroup>
      </ScrollView>

      <Modal visible={languageModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeLanguageModal}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 p-6" onPress={closeLanguageModal}>
          <Pressable className="w-full max-w-[360px] rounded-3xl bg-white p-5 shadow-xl" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-center text-[18px] text-[#282828]" style={{
            fontFamily: fonts.bold
          }}>
              {t("Settings.Select Language", "Select Language")}
            </Text>

            <View className="gap-2.5">
              {[t("English"), t("Hindi"), t("Telugu"), t("Urdu")].map((language) => {
              const isSelected = selectedLanguage === language;
              return <Pressable key={language} className={`flex-row items-center justify-between rounded-xl border-2 px-4 py-3.5 ${isSelected ? 'border-[#43C17A] bg-[#43C17A15]' : 'border-transparent bg-gray-50'}`} onPress={() => changeLanguage(language)}>
                    <Text className={`text-[16px] ${isSelected ? 'text-[#1E7B4D]' : 'text-[#282828]'}`} style={{
                  fontFamily: fonts.medium
                }}>
                      {language}
                    </Text>
                    {isSelected && <View className="h-2 w-2 rounded-full bg-[#43C17A]" />}
                  </Pressable>;
            })}
            </View>

            <Pressable className="mt-3 rounded-xl py-3" onPress={closeLanguageModal} style={pressedStyle}>
              <Text className="text-center text-[15px] text-gray-500" style={{
              fontFamily: fonts.bold
            }}>
                {t("Settings.Cancel", "Cancel")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>;
}