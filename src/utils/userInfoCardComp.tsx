import React from "react";
import { View, Image, ImageBackground } from "react-native";
import tw from "twrnc";
import { useTranslations } from "next-intl";
import { useUser } from "./context/UserContext";
import { useStudent } from "./context/student/useStudent";
import Text from "@/components/Text";
import { fonts } from "@/constants/fonts";

export default function UserInfoCard() {
    const {
        fullName,
        gender,
        collegeEducationType,
        collegeBranchCode,
        identifierId,
    } = useUser();

    const { collegeAcademicYear } = useStudent();

    const t = useTranslations("Dashboard.student");

    const bgBanner = require("../../assets/dashboard-banner-bg.png");
    const femaleAvatar = require("../../assets/female-student.png");
    const maleAvatar = require("../../assets/male-student.png");

    const currentDate = new Intl.DateTimeFormat("en-GB", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    }).format(new Date());

    return (
        <ImageBackground
            source={bgBanner}
            resizeMode="stretch"
            style={tw`w-full rounded-2xl h-[170px] shadow-sm overflow-hidden`}
        >
            <View style={tw`flex-1 flex-row justify-between p-4 relative`}>
                <View style={tw`max-w-[65%] justify-center gap-1.5`}>
                    <View style={tw`flex-row flex-wrap gap-1 items-center`}>
                        <Text style={[tw`text-[#714EF2] text-[11px]`, { fontFamily: fonts.medium }]}>
                            {collegeEducationType && collegeBranchCode
                                ? `${collegeEducationType} ${collegeBranchCode}`
                                : "—"}{" "}
                            - {collegeAcademicYear ? `${collegeAcademicYear}` : "—"}
                        </Text>

                        <Text
                            style={[
                                tw`text-[#089144] text-[11px]`,
                                { fontFamily: fonts.italic }
                            ]}
                        >
                            {t("Student Id - ")}{" "}
                            <Text
                                style={[
                                    tw`text-[#282828] text-[11px]`,
                                    { fontFamily: fonts.bold }
                                ]}
                            >
                                {identifierId}
                            </Text>
                        </Text>
                    </View>

                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-[#282828] text-[15px] font-normal`}>
                            {t("Welcome Back, ")}{" "}
                            <Text style={[tw`text-[#089144] text-[15px]`, { fontFamily: fonts.bold }]}>
                                {fullName}
                            </Text>
                        </Text>
                    </View>

                    <View style={tw`mt-1`}>
                        <Text style={tw`text-[10px] text-[#454545]`}>
                            {t("You’ve completed ")}
                            <Text style={tw`text-[#089144] font-semibold`}>0</Text>
                            {t(" of your tasks")}
                        </Text>
                        <Text style={tw`text-[10px] text-[#454545] -mt-0.5`}>
                            {t("Keep up the great progress!")}
                        </Text>
                    </View>

                    <View style={tw`mt-1 bg-[#BFEFCD] px-2 py-0.5 rounded self-start`}>
                        <Text style={[tw`text-[#089144] text-[10px] font-semibold`, { fontFamily: fonts.semiBold }]}>
                            {currentDate}
                        </Text>
                    </View>
                </View>

                {gender && (
                    <View style={tw`absolute bottom-0 right-0 h-[100%] w-[130px]`}>
                        <Image
                            source={gender === "Female" ? femaleAvatar : maleAvatar}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </View>
                )}
            </View>
        </ImageBackground>
    );
}