import React from 'react';
import { View, ScrollView } from 'react-native';
import tw from 'twrnc';

export default function HolidayCalendarShimmer() {
  return (
    <ScrollView style={tw`flex-1 p-4 bg-white`} showsVerticalScrollIndicator={false}>
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <View style={tw`h-8 w-48 bg-slate-200 rounded-md`} />
        <View style={tw`h-10 w-24 bg-slate-200 rounded-xl`} />
      </View>

      <View style={tw`flex-row flex-wrap justify-between`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={tw`w-[48%] mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`}>
            <View style={tw`h-10 w-full bg-slate-100 px-4 justify-center`}>
              <View style={tw`h-4 w-24 bg-slate-200 rounded`} />
            </View>
            
            <View style={tw`p-4 flex-col gap-3 bg-slate-50`}>
              {[1, 2].map((j) => (
                <View key={j} style={tw`flex-row items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white`}>
                  <View style={tw`w-14 h-14 rounded-lg bg-slate-100`} />
                  <View style={tw`flex-1 gap-2`}>
                    <View style={tw`h-4 w-3/4 bg-slate-200 rounded`} />
                    <View style={tw`h-3 w-1/2 bg-slate-200 rounded`} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
