import React from "react";
import { View, Text, Image } from "react-native";
import { User } from "phosphor-react-native";
import tw from "twrnc";

interface ProfileProps {
  name: string;
  department: string;
  studentId: string;
  phone: string;
  email: string;
  address: string;
  photo: string;
  attendancePercentage: number;
  absentPercentage: number;
  leavePercentage: number;
}

export default function StudentProfileCard({
  name,
  department,
  studentId,
  phone,
  email,
  address,
  photo,
  attendancePercentage,
  absentPercentage,
  leavePercentage,
}: ProfileProps) {
  return (
    <View style={tw`rounded-xl bg-white p-4 md:p-6 shadow-sm flex-col justify-between border border-gray-100`}>
      <View style={tw`flex-row items-start md:items-center justify-between gap-2`}>
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          <Image
            source={photo ? { uri: photo } : require("../../../../../assets/maleuser.png")}
            defaultSource={require("../../../../../assets/maleuser.png")}
            style={tw`h-12 w-12 rounded-full border border-gray-100`}
          />
          <View style={tw`flex-col gap-1 flex-1`}>
            <Text style={tw`text-base md:text-xl font-bold text-[#333333] leading-tight flex-wrap`}>
              {name}
            </Text>
            <View style={tw`flex-row`}>
              <View style={tw`rounded-full bg-[#E8F5E9] px-2 py-0.5 md:px-3 md:py-1`}>
                <Text style={tw`text-[10px] md:text-xs font-semibold text-[#4CAF50]`}>
                  {department}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={tw`rounded-full bg-[#E8F5E9] px-2 py-0.5 md:px-4 md:py-1 mt-1 md:mt-0`}>
          <Text style={tw`text-[10px] md:text-xs font-semibold text-[#4CAF50]`}>
            ID {studentId}
          </Text>
        </View>
      </View>

      <View style={tw`mt-5 md:mt-8 flex-row justify-between mb-3`}>
        <View style={tw`flex-1 mr-2`}>
          <Text style={tw`text-[10px] md:text-sm text-[#666666] font-medium`}>
            Number
          </Text>
          <Text style={tw`mt-0.5 md:mt-1 text-[11px] md:text-base font-semibold text-[#333333]`} numberOfLines={1}>
            {phone}
          </Text>
        </View>
        <View style={tw`flex-1 mx-2`}>
          <Text style={tw`text-[10px] md:text-sm text-[#666666] font-medium`}>
            Email
          </Text>
          <Text style={tw`mt-0.5 md:mt-1 text-[11px] md:text-base font-semibold text-[#333333]`} numberOfLines={1}>
            {email}
          </Text>
        </View>
        <View style={tw`flex-1 ml-2`}>
          <Text style={tw`text-[10px] md:text-sm text-[#666666] font-medium`}>
            Address
          </Text>
          <Text style={tw`mt-0.5 md:mt-1 text-[11px] md:text-base font-semibold text-[#333333]`} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>

      <View style={tw`mt-4 md:mt-8 flex-row justify-between mt-auto gap-2`}>
        <View style={tw`flex-1`}>
          <StatCard
            bg="bg-[#E8F5E9]"
            iconBg="bg-[#4CAF50]"
            title="Total Attendance"
            value={`${attendancePercentage}%`}
          />
        </View>
        <View style={tw`flex-1`}>
          <StatCard
            bg="bg-[#FFEBEE]"
            iconBg="bg-[#F44336]"
            title="Total Absent"
            value={`${absentPercentage}%`}
          />
        </View>
        <View style={tw`flex-1`}>
          <StatCard
            bg="bg-[#E3F2FD]"
            iconBg="bg-[#42A5F5]"
            title="Total Leave"
            value={`${leavePercentage}%`}
          />
        </View>
      </View>
    </View>
  );
}

function StatCard({
  bg,
  iconBg,
  title,
  value,
}: {
  bg: string;
  iconBg: string;
  title: string;
  value: string | number;
}) {
  return (
    <View style={tw`flex-col lg:flex-row items-start lg:items-center gap-1.5 md:gap-3 rounded-lg md:rounded-xl p-2 md:p-4 ${bg}`}>
      <View style={tw`h-6 w-6 md:h-10 md:w-10 items-center justify-center rounded-[4px] md:rounded-lg ${iconBg}`}>
        <User size={16} color="white" weight="fill" />
      </View>
      <View style={tw`flex-1 min-w-0`}>
        <Text style={tw`text-[11px] md:text-base font-bold text-[#333333] leading-none mb-0.5 md:mb-1`} numberOfLines={1}>
          {value}
        </Text>
        <Text style={tw`text-[9px] md:text-sm font-medium text-[#666666] leading-none`} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}
