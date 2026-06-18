import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import { View } from 'react-native';

export default function ParentAttendance() {const { t } = useTranslation();
  return (
    <>
            <View className="flex-1 justify-center items-center bg-indigo-300">
                <Text className="font-medium">{t("Auto.Common.ParentAttendanc", "Parent Attendance")}

        </Text>
            </View>
        </>);

}