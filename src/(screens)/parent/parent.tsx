import { Text, View } from "react-native";
import { useHeaderHeight } from '@react-navigation/elements';

export default function ParentHomeScreen() {
    const headerHeight = useHeaderHeight();
    return (
        <>
            <View className="flex-1 bg-blue-300 items-center justify-center" style={{ paddingTop: headerHeight + 16 }}>
                <Text className="font-medium">
                    Parent Home
                </Text>
            </View>
        </>
    )
}