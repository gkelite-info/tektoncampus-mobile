import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView } from "react-native";
import { ArrowLeft } from "phosphor-react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function TermsModal({ visible, onClose }: Props) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center border-b border-gray-100 p-4">
                    <TouchableOpacity onPress={onClose} className="mr-3 p-1">
                        <ArrowLeft size={24} color="#282828" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-[#282828]">Terms And Conditions</Text>
                </View>

                <ScrollView className="flex-1 p-5">
                    <View className="mb-8">
                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            1. You shall abide by all terms and conditions of service as shall be applicable from time to time.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            2. You will be on probation initially up to three Months (90 working days); however, your probation period can be extended at the management discretion. You will continue to be on probation until such time till you receive the letter of confirmation.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            3. During the probation or after confirmation, the services may be terminated by either party giving thirty days’ notice in writing or by giving thirty days’ salary in lieu of notice. Such notice shall not be deemed necessary in the case of termination of services on the grounds of poor performance, refusal to get relocated to any upcountry location as per the organization requirement, willful neglect or breach of trust, or any other serious derelictions of duty, which are prejudicial to the interest of the Company. In case of resignation, the Company reserves the right to relieve you any time during the notice period without payment of any compensation for the remaining notice period.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            4. Full and final payment of dues and other formalities would be completed within 45 days after your last working date.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            5. In case of a resignation without notice, recovery will be done for the shortfall in notice period. On the contrary amount for notice period shall be recovered from the dues (if any) payable to you. In case there are no dues payable to you then an independent recovery proceeding shall be initiated against you at your cost. Relieving letter will be issued only thereafter.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            6. In case you do not report to office without prior permission from your reporting manager for 3 consecutive days you will be tagged as absconding from services. If you are declared absconding, the shortfall of notice period will be recovered from the dues payable to you.
                        </Text>

                        <Text className="text-base text-[#525252] leading-6 mb-4">
                            7. In case of buy back, you agree that the decision to buy back the notice period is entirely at the discretion of the company and you do not have any obligation for the company to do so.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
