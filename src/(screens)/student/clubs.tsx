import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SharedClub from "@/components/SharedClub/SharedClub";

export default function StudentClubScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F5F6", paddingTop: insets.top + 100 }}>
      <SharedClub role="student" />
    </View>
  );
}
