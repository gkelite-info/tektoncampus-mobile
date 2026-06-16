import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { ChatCircleDots } from "phosphor-react-native";
import tw from "twrnc";

export interface Parent {
  name: string;
  relation: string;
  avatar: string;
}

interface ParentsListProps {
  parents: Parent[];
  onChatOpen: (parent: Parent) => void;
}

export default function ParentsList({ parents, onChatOpen }: ParentsListProps) {
  return (
    <View style={tw`h-full w-full rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100 min-h-[220px]`}>
      <Text style={tw`mb-4 md:mb-6 text-[16px] md:text-xl font-bold text-[#333333]`}>
        Parent's Information
      </Text>

      {parents.length > 0 ? (
        <View style={tw`flex-col gap-3 md:gap-4`}>
          {parents.map((parent) => (
            <View
              key={`${parent.name}-${parent.relation}`}
              style={tw`flex-row items-center justify-between rounded-full bg-[#E8F6E2] p-2 md:p-3`}
            >
              <View style={tw`flex-row items-center gap-3 md:gap-4 min-w-0 pr-2 flex-1`}>
                <Image
                  source={parent.avatar ? { uri: parent.avatar } : require("../../../../../assets/maleuser.png")}
                  defaultSource={require("../../../../../assets/maleuser.png")}
                  style={tw`h-10 w-10 md:h-14 md:w-14 rounded-full border-2 border-white`}
                />
                <View style={tw`flex-col min-w-0 flex-1`}>
                  <Text style={tw`text-sm md:text-base font-bold text-[#333333]`} numberOfLines={1}>
                    {parent.name}
                  </Text>
                  <Text style={tw`text-[11px] md:text-sm font-medium text-[#666666]`} numberOfLines={1}>
                    {parent.relation}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => onChatOpen(parent)}
                style={tw`h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#A1D683] shadow-sm`}
              >
                <ChatCircleDots size={24} color="white" weight="fill" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={tw`flex-1 items-center justify-center rounded-[20px] border border-dashed border-[#D6DADF] bg-[#FAFBFC] px-4 md:px-6 mt-2`}>
          <Text style={tw`text-center text-[13px] md:text-base font-medium text-[#8A8F98]`}>
            Parent registration not done for this student.
          </Text>
        </View>
      )}
    </View>
  );
}
