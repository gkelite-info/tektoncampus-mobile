import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import { View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

export default function ParentHomeScreen() {const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  return (
    <>
            <View className="flex-1 bg-blue-300 items-center justify-center" style={{ paddingTop: headerHeight + 16 }}>
                <Text className="font-medium">{t("Auto.Common.ParentHome", "Parent Home")}

        </Text>
            </View>
        </>);

}