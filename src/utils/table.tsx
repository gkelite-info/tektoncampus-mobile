
import React from "react";
import { View, Text, ScrollView } from "react-native";

type TableProps = {
    columns: string[];
    data: Record<string, any>[];
};

export default function Table({ columns, data }: TableProps) {
    return (
        <View className="bg-white rounded-xl shadow-md mt-5 overflow-hidden border border-gray-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
                <View className="flex-col w-full min-w-[340px]">
                    <View className="flex-row bg-[#5252521C] py-3 px-4 items-center">
                        {columns.map((col, index) => (
                            <View
                                key={index}
                                className={`flex-1 min-w-[90px] ${col === "Subject" ? "items-start" : "items-center"
                                    }`}
                            >
                                <Text className="text-sm font-normal text-[#282828]">
                                    {col}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View className="flex-col">
                        {data.map((row, rowIndex) => {
                            const isLastRow = rowIndex === data.length - 1;

                            return (
                                <View
                                    key={rowIndex}
                                    className={`flex-row px-4 py-2.5 items-center bg-white ${!isLastRow ? "border-b border-gray-100" : ""
                                        }`}
                                >
                                    {columns.map((col, colIndex) => {
                                        const value = row[col];
                                        let cellContent;

                                        switch (col) {
                                            case "Today's Status": {
                                                let bgColor = "";
                                                let textColor = "";

                                                const element = value as React.ReactElement<any>;

                                                const stringValue = React.isValidElement(value)
                                                    ? (element.props.status || element.props.children?.props?.status || "")
                                                    : String(value || "");

                                                switch (stringValue.toLowerCase()) {
                                                    case "present":
                                                        bgColor = "#43C17A3D";
                                                        textColor = "#43C17A";
                                                        break;
                                                    case "absent":
                                                        bgColor = "#FFE0E0";
                                                        textColor = "#FF2020";
                                                        break;
                                                    case "late":
                                                    case "leave":
                                                        bgColor = "#FFEDDA";
                                                        textColor = "#FFBB70";
                                                        break;
                                                    default:
                                                        bgColor = "#F3F4F6";
                                                        textColor = "#525252";
                                                }

                                                cellContent = (
                                                    <View
                                                        className="justify-center items-center rounded-lg"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            width: 100,
                                                            height: 28,
                                                        }}
                                                    >
                                                        {React.isValidElement(value) ? (
                                                            value
                                                        ) : (
                                                            <Text style={{ color: textColor }} className="text-xs font-semibold">
                                                                {stringValue.toUpperCase()}
                                                            </Text>
                                                        )}
                                                    </View>
                                                );
                                                break;
                                            }

                                            case "Notes": {
                                                cellContent = (
                                                    <View
                                                        className="items-center justify-center rounded-full"
                                                        style={{
                                                            backgroundColor: "#6E4FE01A",
                                                            width: 25,
                                                            height: 25,
                                                        }}
                                                    >
                                                        <Text style={{ color: "#7557E3" }} className="text-xs font-medium">
                                                            {value}
                                                        </Text>
                                                    </View>
                                                );
                                                break;
                                            }

                                            default: {
                                                cellContent = React.isValidElement(value) ? (
                                                    value
                                                ) : (
                                                    <Text className="text-[#525252] text-sm font-normal" numberOfLines={1}>
                                                        {value}
                                                    </Text>
                                                );
                                            }
                                        }

                                        return (
                                            <View
                                                key={colIndex}
                                                className={`flex-1 min-w-[90px] ${col === "Subject" ? "items-start" : "items-center"
                                                    }`}
                                            >
                                                {cellContent}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}