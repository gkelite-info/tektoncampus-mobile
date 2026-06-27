import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { Landmark, IndianRupee, ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

type FeeDueCardProps = {
  totalFee: string;
  feePaid: string;
};

export default function FeeDueCard({ totalFee, feePaid }: FeeDueCardProps) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Landmark size={18} color="#47CE68" />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {t("Dashboard.parent.Fee Due", "Fee Due")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.boxesContainer}>
          {/* Total Fee Box */}
          <LinearGradient
            colors={["#FFEDD9", "#FFBB70"]}
            style={styles.innerBox}
          >
            <View style={styles.innerIconContainer}>
              <IndianRupee size={16} color="#FFBB70" />
            </View>
            <View>
              <Text style={styles.boxTitleText} numberOfLines={1}>
                {t("Dashboard.parent.Total Fee", "Total Fee")}
              </Text>
              <View style={styles.amountContainer}>
                <IndianRupee size={10} color="white" />
                <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {totalFee}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Fee Paid Box */}
          <LinearGradient
            colors={["#CEE6FF", "#61AEFF"]}
            style={styles.innerBox}
          >
            <View style={styles.innerIconContainer}>
              <IndianRupee size={16} color="#61AEFF" />
            </View>
            <View>
              <Text style={styles.boxTitleText} numberOfLines={1}>
                {t("Dashboard.parent.Fee Paid", "Fee Paid")}
              </Text>
              <View style={styles.amountContainer}>
                <IndianRupee size={10} color="white" />
                <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {feePaid}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.payNowButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Payments")}
        >
          <View style={styles.payNowTextContainer}>
            <Text style={styles.payNowText}>
              {t("Dashboard.parent.Pay Now", "Pay Now")}
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <ChevronRight size={14} color="#A2D784" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    height: 180,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  iconContainer: {
    backgroundColor: "#E1F4E8",
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#282828",
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    marginTop: 8,
  },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: "65%",
  },
  innerBox: {
    flex: 1,
    borderRadius: 8,
    padding: 6, // Reduced padding
    justifyContent: "space-between",
    marginHorizontal: 4,
  },
  innerIconContainer: {
    backgroundColor: "white",
    height: 24, // Smaller icon container
    width: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  boxTitleText: {
    color: "white",
    fontSize: 9, // Smaller title
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountText: {
    color: "white",
    fontSize: 12, // Smaller font for amount
    fontWeight: "800",
    marginLeft: 2,
    flexShrink: 1,
  },
  payNowButton: {
    backgroundColor: "#A2D784",
    height: 36,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: "auto",
  },
  payNowTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  payNowText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  chevronContainer: {
    backgroundColor: "white",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
