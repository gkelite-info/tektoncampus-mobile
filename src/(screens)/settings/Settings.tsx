import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  BellSimple,
  CaretRight,
  Envelope,
  GearSix,
  Globe,
  Key,
  LockKey,
  ShieldCheck,
  TextT,
  UserCircle,
} from 'phosphor-react-native';

const MIN_FONT_SCALE = 85;
const MAX_FONT_SCALE = 115;
const FONT_STEP = 5;

const COLORS = {
  text: '#282828',
  green: '#43C17A',
  navy: '#16284F',
  switchOff: '#D1D5DB',
  border: '#ECEFF1',
  background: '#F4F5F6',
};

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}>;

const pressedStyle = ({ pressed }: { pressed: boolean }) =>
  pressed ? { opacity: 0.7 } : null;

const snapFontScale = (value: number) => {
  const clamped = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
  return Math.round(clamped / FONT_STEP) * FONT_STEP;
};

const Divider = React.memo(() => (
  <View className="ml-[66px] h-[1px] bg-[#ECEFF1]" />
));

const IconBubble = React.memo(({ children }: { children: React.ReactNode }) => (
  <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#43C17A26]">
    {children}
  </View>
));


const SettingsGroup = ({ children }: { children: React.ReactNode }) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-[#ECEFF1] bg-white shadow-sm">
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childrenArray.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </View>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="mb-2 ml-4 text-xs font-bold uppercase tracking-wider text-gray-500">
    {title}
  </Text>
);

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

const SettingsRow = React.memo(
  ({
    title,
    description,
    icon: Icon,
    onPress,
    right,
    disabled,
    showWip,
    children,
  }: SettingsRowProps) => {
    const content = (
      <View
        className={`min-h-[72px] justify-center bg-white px-4 py-3.5 ${
          disabled ? 'opacity-60' : ''
        }`}>
        <View className="flex-row items-center gap-3.5">
          <IconBubble>
            <Icon size={22} weight="fill" color={COLORS.green} />
          </IconBubble>

          <View className="min-w-0 flex-1 justify-center">
            <Text
              numberOfLines={1}
              className="font-medium text-[16px] text-[#282828]">
              {title}
            </Text>
            {description ? (
              <Text
                numberOfLines={1}
                className="mt-0.5 text-[13px] text-gray-500">
                {description}
              </Text>
            ) : null}
          </View>

          <View className="items-end justify-center pl-2">
            {right ?? (
              <CaretRight size={20} color="#9CA3AF" weight="bold" />
            )}
          </View>
        </View>

        {children && <View className="mt-2 pl-[54px]">{children}</View>}

        {showWip && (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center bg-white/60">
            <Text className="rounded-full bg-[#16284F] px-3 py-1 text-[11px] font-bold tracking-wide text-white overflow-hidden">
              WIP
            </Text>
          </View>
        )}
      </View>
    );

    if (!onPress || disabled) return content;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        android_ripple={{ color: '#EEF2F4' }}
        onPress={onPress}
        style={pressedStyle}>
        {content}
      </Pressable>
    );
  }
);

const FontScaleSlider = React.memo(
  ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => {
    const [trackWidth, setTrackWidth] = useState(1);
    const latestTrackWidth = useRef(trackWidth);
    latestTrackWidth.current = trackWidth;

    const progress = (value - MIN_FONT_SCALE) / (MAX_FONT_SCALE - MIN_FONT_SCALE);
    const thumbLeft = Math.max(0, Math.min(1, progress)) * trackWidth;

    const setFromX = useCallback(
      (x: number) => {
        const ratio = Math.max(0, Math.min(1, x / latestTrackWidth.current));
        const next = MIN_FONT_SCALE + ratio * (MAX_FONT_SCALE - MIN_FONT_SCALE);
        onChange(snapFontScale(next));
      },
      [onChange]
    );

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (event) => setFromX(event.nativeEvent.locationX),
          onPanResponderMove: (event) => setFromX(event.nativeEvent.locationX),
        }),
      [setFromX]
    );

    return (
      <View className="flex-row items-center gap-3 py-2 pr-2">
        <Text className="text-[16px] font-medium text-gray-400">A</Text>

        <View
          accessibilityRole="adjustable"
          className="h-8 flex-1 justify-center relative"
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}>
          <View className="h-1.5 w-full rounded-full bg-[#DDE3E8]" />
          <View
            className="absolute h-1.5 rounded-full bg-[#16284F]"
            style={{ width: thumbLeft }}
          />
          {/* Thumb */}
          <View
            className="absolute h-6 w-6 rounded-full border-4 border-white bg-[#16284F] shadow-sm"
            style={{ left: thumbLeft - 12 }}
          />
        </View>

        <Text className="text-[22px] font-medium text-gray-700">A</Text>
      </View>
    );
  }
);

function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const switchScale = isCompact ? 0.85 : 0.95;

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [fontScale, setFontScale] = useState(100);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const closeLanguageModal = useCallback(() => setLanguageModalVisible(false), []);

  return (
    <View className="flex-1 bg-[#F4F5F6]">
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12) + 12,
          paddingBottom: Math.max(insets.bottom, 16) + 40,
        }}>
        
        {/* Header */}
        <View className="flex-row items-center gap-4 mb-8 pl-2">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#43C17A26]">
            <GearSix size={26} color={COLORS.green} weight="fill" />
          </View>
          <View className="flex-1">
            <Text className="text-[28px] font-bold text-[#282828] tracking-tight">
              Settings
            </Text>
            <Text className="text-[14px] text-gray-500 mt-0.5">
              Manage your account and preferences
            </Text>
          </View>
        </View>

        {/* Section: Preferences */}
        <SectionHeader title="App Preferences" />
        <SettingsGroup>
          <SettingsRow
            title="Email Alerts"
            description="Receive important updates via email"
            icon={Envelope}
            onPress={() => setEmailAlerts(!emailAlerts)}
            right={
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: COLORS.switchOff, true: COLORS.navy }}
                ios_backgroundColor={COLORS.switchOff}
                style={{ transform: [{ scale: switchScale }] }}
              />
            }
          />
          <SettingsRow
            title="Push Reminders"
            description="Assignment and event notifications"
            icon={BellSimple}
            onPress={() => setReminders(!reminders)}
            right={
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: COLORS.switchOff, true: COLORS.navy }}
                ios_backgroundColor={COLORS.switchOff}
                style={{ transform: [{ scale: switchScale }] }}
              />
            }
          />
          <SettingsRow
            title="Language"
            description={selectedLanguage}
            icon={Globe}
            onPress={() => setLanguageModalVisible(true)}
          />
          <SettingsRow
            title="Display Text Size"
            description="Adjust scale for optimal readability"
            icon={TextT}>
            <FontScaleSlider value={fontScale} onChange={setFontScale} />
          </SettingsRow>
        </SettingsGroup>

        {/* Section: Account & Security */}
        <SectionHeader title="Account & Security" />
        <SettingsGroup>
          <SettingsRow
            title="Change Password"
            description="Update your account credentials"
            icon={Key}
            onPress={() => {}}
          />
          <SettingsRow
            title="Linked Accounts"
            description="Connect external services"
            icon={UserCircle}
            onPress={() => {}}
          />
          <SettingsRow
            title="Two-Step Verification"
            description="Add an extra layer of security"
            icon={LockKey}
            onPress={() => {}}
            showWip
            disabled
          />
        </SettingsGroup>

        {/* Section: About */}
        <SectionHeader title="About" />
        <SettingsGroup>
          <SettingsRow
            title="Privacy Policy"
            description="Review our data policies"
            icon={ShieldCheck}
            onPress={() => {}}
          />
        </SettingsGroup>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeLanguageModal}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 p-6"
          onPress={closeLanguageModal}>
          <Pressable
            className="w-full max-w-[360px] rounded-3xl bg-white p-5 shadow-xl"
            onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-center text-[18px] font-bold text-[#282828]">
              Select Language
            </Text>

            <View className="gap-2.5">
              {['English', 'Hindi', 'Telugu'].map((language) => {
                const isSelected = selectedLanguage === language;
                return (
                  <Pressable
                    key={language}
                    className={`flex-row items-center justify-between rounded-xl border-2 px-4 py-3.5 ${
                      isSelected ? 'border-[#43C17A] bg-[#43C17A15]' : 'border-transparent bg-gray-50'
                    }`}
                    onPress={() => {
                      setSelectedLanguage(language);
                      closeLanguageModal();
                    }}>
                    <Text
                      className={`text-[16px] font-medium ${
                        isSelected ? 'text-[#1E7B4D]' : 'text-[#282828]'
                      }`}>
                      {language}
                    </Text>
                    {isSelected && (
                      <View className="h-2 w-2 rounded-full bg-[#43C17A]" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              className="mt-3 rounded-xl py-3"
              onPress={closeLanguageModal}
              style={pressedStyle}>
              <Text className="text-center text-[15px] font-bold text-gray-500">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsScreen />
    </SafeAreaProvider>
  );
}