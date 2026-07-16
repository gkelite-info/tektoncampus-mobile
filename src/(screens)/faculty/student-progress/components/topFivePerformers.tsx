import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React from "react";
import { View, Image } from 'react-native';
import tw from "twrnc";

export interface TopPerformer {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
}

interface TopPerformersProps {
  performers: TopPerformer[];
}

const PerformerRow = ({ performer }: {performer: TopPerformer;}) => {
  return (
    <View style={tw`flex-row items-center py-3 border-b border-gray-50`}>
      <View style={tw`h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border border-gray-100 mr-2 md:mr-3`}>
        <Image
          source={
          performer.avatar ?
          { uri: performer.avatar } :
          require("../../../../../assets/maleuser.png")
          }
          style={tw`w-full h-full`}
          defaultSource={require("../../../../../assets/maleuser.png")} />
        
      </View>

      <View style={tw`flex-1`}>
        <Text
          style={[{ fontFamily: fonts.medium }, tw`text-[12px] md:text-[14px]  leading-tight text-gray-800`]}
          numberOfLines={1}>
          
          {performer.name}
        </Text>
      </View>

      <View style={tw`items-center justify-center w-[80px] md:w-[120px] mx-2`}>
        <View style={tw`h-2 md:h-2.5 w-full bg-[#16284F] rounded-full overflow-hidden relative`}>
          <View
            style={[
            tw`absolute top-0 left-0 h-full bg-[#43C17A] rounded-full`,
            { width: `${performer.score}%` }]
            } />
          
        </View>
      </View>

      <View style={tw`w-10 md:w-12 items-end`}>
        <Text style={[{ fontFamily: fonts.bold }, tw`text-[12px] md:text-[14px]  text-gray-700`]}>
          {performer.score}%
        </Text>
      </View>
    </View>);

};

export default function TopFivePerformers({ performers }: TopPerformersProps) {const { t } = useTranslation();
  return (
    <View style={tw`w-full flex-col overflow-hidden rounded-xl bg-white p-4 lg:p-5 shadow-sm border border-gray-100 min-h-[300px]`}>
      <Text style={[{ fontFamily: fonts.bold }, tw`text-[15px] md:text-[18px]  text-gray-900 mb-1`]}>{t("Auto.Common.Top5Performers", "Top 5 Performers")}

      </Text>

      <View style={tw`flex-col mt-2 flex-1`}>
        {performers.length > 0 ?
        performers.map((performer) =>
        <PerformerRow key={performer.id} performer={performer} />
        ) :

        <View style={tw`flex-1 items-center justify-center py-8`}>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-sm text-[#6B7280]`]}>{t("Auto.Common.Noperformerdata", "No performer data available.")}

          </Text>
          </View>
        }
      </View>
    </View>);

}