import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { CaretDown, DownloadSimple, FileMagnifyingGlass, CheckCircle } from 'phosphor-react-native';
import { fonts } from '@/constants/fonts';

export default function ManageTaxPage() {const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"declaration" | "forms" | "taxFiling" | "taxSaving">("declaration");

  const tabs = [
  { id: "declaration", label: t("Auto.Common.Declaration", "Declaration") },
  { id: "forms", label: t("Auto.Common.Forms", "Forms") },
  { id: "taxFiling", label: t("Auto.Common.TaxFiling", "Tax Filing") },
  { id: "taxSaving", label: t("Auto.Common.TaxSavingInvestment", "Tax Saving Investment") }];


  return (
    <View className="w-full flex-col max-md:px-2">
      <View className="flex-row flex-wrap items-center gap-y-2 mb-6">
        {tabs.map((tab, index) =>
        <React.Fragment key={tab.id}>
            <TouchableOpacity onPress={() => setActiveTab(tab.id as any)}>
              <Text
              className={`text-[14px] ${activeTab === tab.id ? "text-[#43C17A] underline" : "text-[#333333]"}`}
              style={{ fontFamily: fonts.bold }}>
              
                {tab.label}
              </Text>
            </TouchableOpacity>
            {index < 3 && <Text className="text-gray-400 mx-2 text-[14px]" style={{ fontFamily: fonts.bold }}>/</Text>}
          </React.Fragment>
        )}
      </View>

      <View className="flex-col pb-6">
        {activeTab === "declaration" &&
        <View className="flex-col relative">
            <View className="absolute inset-0 z-10 bg-white/60 items-center justify-center rounded-xl">
               <Text className="text-gray-500 font-bold text-lg border border-gray-300 px-4 py-2 bg-white rounded-lg ">{t("Auto.Common.WorkInProgress", "Work In Progress")}</Text>
            </View>
            <View className="flex-col md:flex-row gap-4">
              <View className="flex-col gap-4 flex-1">
                <View className="bg-white rounded-md p-5  border border-gray-100 flex-1">
                  <Text className="text-[#43C17A] text-lg mb-4" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.InvestmentDecla", "Investment Declaration")}</Text>
                  <View className="mb-4">
                    <Text className="text-[#1F2937] text-base" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Currentwindows", "Current windows")}</Text>
                    <Text className="text-[#1F2937] text-base" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.TillAug252025", "Till Aug 25, 2025")}</Text>
                  </View>
                  <View>
                    <Text className="text-[#1F2937] text-base" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Monthlywindows", "Monthly windows :")}</Text>
                    <Text className="text-[#1F2937] text-base" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.1stto25thofever", "1st to 25th of every month till 15th jan 2026")}</Text>
                  </View>
                </View>
                <View className="bg-white rounded-md p-5  border border-gray-100 h-[110px] justify-center">
                  <Text className="text-[#333333] text-[15px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.NetTaxableIncom", "Net Taxable Income")}</Text>
                  <Text className="text-[#43C17A] text-[24px] mt-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.INR0", "INR 0")}</Text>
                </View>
              </View>

              <View className="flex-col gap-4 flex-1">
                <View className="bg-white rounded-md p-5  border border-gray-100 flex-1">
                  <Text className="text-[#43C17A] text-lg mb-4" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.ProofSubmission", "Proof Submission")}</Text>
                  <Text className="text-[#1F2937] text-[14px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Currentwindows", "Current windows")}</Text>
                  <Text className="text-[#1F2937] text-[13px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.TillAug252025", "Till Aug 25, 2025")}</Text>
                </View>
                <View className="flex-col sm:flex-row gap-4">
                  <View className="bg-white rounded-md p-5  border border-gray-100 h-[110px] flex-1 justify-center">
                    <Text className="text-[#333333] text-[14px] leading-tight" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Totaltax", "Total tax")}{"\n"}{t("Auto.Common.Payable", "Payable")}</Text>
                    <Text className="text-[#43C17A] text-[24px] mt-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.INR0", "INR 0")}</Text>
                  </View>
                  <View className="bg-white rounded-md p-5  border border-gray-100 h-[110px] flex-1 justify-center">
                    <Text className="text-[#333333] text-[14px] leading-tight" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Totaltax", "Total tax")}{"\n"}{t("Auto.Common.Payable", "Payable")}</Text>
                    <Text className="text-[#43C17A] text-[24px] mt-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.INR0", "INR 0")}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        }

        {activeTab === "forms" &&
        <View className="flex-col gap-4 relative">
             <View className="absolute inset-0 z-10 bg-white/60 items-center justify-center rounded-xl">
               <Text className="text-gray-500 font-bold text-lg border border-gray-300 px-4 py-2 bg-white rounded-lg ">{t("Auto.Common.WorkInProgress", "Work In Progress")}</Text>
            </View>
            <View className="bg-white rounded-md p-6 max-md:p-4  border border-gray-100">
              <View className="flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                <Text className="text-[#43C17A] text-[18px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Form16", "Form 16")}</Text>
                <View className="flex-row gap-2">
                  <View className="bg-[#43C17A] rounded-md px-3 py-1.5 flex-row items-center gap-2">
                    <Text className="text-white text-[11px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.APR2024MAR2025", "APR 2024 - MAR 2025")}</Text>
                    <CaretDown size={14} color="white" weight="bold" />
                  </View>
                  <TouchableOpacity className="bg-[#43C17A] px-4 py-1.5 rounded-md flex-row items-center gap-1.5">
                    <Text className="text-white text-[11px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Download", "Download")}</Text>
                    <DownloadSimple size={14} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-[#1F2937] text-base mb-8 leading-relaxed" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Form16Summarize", "Form 16 Summarizes your salary, deductions and tax paid and is needed for filing tax returns.")}

            </Text>
              <View className="items-center justify-center py-6 border-t border-gray-50 mt-4">
                <View className="mb-4 opacity-50">
                  <FileMagnifyingGlass size={80} color="#D1D5DB" weight="light" />
                </View>
                <Text className="text-[#1F2937] text-base mb-6 text-center max-w-[320px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Form16hasnotbee", "Form 16 has not been released by the admin for the selected financial year.")}

              </Text>
                <TouchableOpacity className="border border-gray-300 px-8 py-2.5 rounded-md bg-white ">
                  <Text className="text-[#1F2937] text-base text-center" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.ReceivedForm16O", "Received Form 16 Outside ? File ITR Using Quicko")}

                </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="bg-white rounded-md p-6 max-md:p-4  border border-gray-100">
              <View className="flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                <Text className="text-[#43C17A] text-[18px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Form12BB", "Form 12 BB")}</Text>
                <View className="flex-row gap-2">
                  <View className="bg-[#43C17A] rounded-md px-3 py-1.5 flex-row items-center gap-2">
                    <Text className="text-white text-[11px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.APR2024MAR2025", "APR 2024 - MAR 2025")}</Text>
                    <CaretDown size={14} color="white" weight="bold" />
                  </View>
                  <TouchableOpacity className="bg-[#43C17A] px-4 py-1.5 rounded-md flex-row items-center gap-1.5">
                    <Text className="text-white text-[11px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Download", "Download")}</Text>
                    <DownloadSimple size={14} color="white" weight="bold" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-[#1F2937] text-base leading-relaxed" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Form12BBhasdeta", "Form 12BB has details about your proposed investments & expenses that are tax deductible.")}

            </Text>
            </View>
          </View>
        }

        {activeTab === "taxFiling" &&
        <View className="bg-white rounded-lg p-6 max-md:p-4 border border-gray-200  relative">
             <View className="absolute inset-0 z-10 bg-white/60 items-center justify-center rounded-xl">
               <Text className="text-gray-500 font-bold text-lg border border-gray-300 px-4 py-2 bg-white rounded-lg ">{t("Auto.Common.WorkInProgress", "Work In Progress")}</Text>
            </View>
            <Text className="text-[#43C17A] text-[20px] mb-2" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.TaxFiling", "Tax Filing")}</Text>
            <Text className="text-[#1F2937] text-base mb-6" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Efileyourincome", "E-file your income tax returns easily through trusted HRMS Partners.")}

          </Text>
            <View className="border border-gray-400 rounded-md px-4 py-3 mb-6 bg-white self-start">
              <Text className="text-black text-sm" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Filingduedatefo", "Filing due date for FY 2024-25 (AY 2025-26) is")}
              <Text className="text-base font-bold">{t("Auto.Common.September152025", "September 15, 2025")}</Text>
              </Text>
            </View>
            <View className="border border-gray-300 rounded-md p-6 max-md:p-4 bg-white">
              <Text className="text-[#1F2937] text-lg mb-2" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.GKsChoice", "GK's Choice")}</Text>
              <Text className="text-[#1F2937] text-base leading-relaxed mb-6" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.SmartTaxisagove", "SmartTax is a government-authorized e-filing platform integrated with HRMS to simplify tax filing for employees. It enables auto-fetching of Form 16, deductions, and investment details directly from your HRMS portal \u2014 making filing accurate and hassle-free.")}

            </Text>
              <View className="mb-6">
                <Text className="text-[#1F2937] text-base mb-3" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.WhyChooseGK", "Why Choose GK :")}</Text>
                <View className="flex-col gap-2">
                  {[
                "Trusted by 1.5M+ employees across India",
                "Auto-imports Form 16 & deduction data from GK HRMS",
                "Instant tax refund calculation",
                "Step-by-step guided filing",
                "Expert review option available"].
                map((item, i) =>
                <View key={i} className="flex-row items-center gap-2">
                      <CheckCircle size={18} color="#43C17A" weight="fill" />
                      <Text className="text-base text-[#1F2937]" style={{ fontFamily: fonts.regular }}>{item}</Text>
                    </View>
                )}
                </View>
              </View>
              <View>
                <Text className="text-[#1F2937] text-base mb-3" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.HowtoFileViaSma", "How to File Via Smart Tax")}</Text>
                <View className="flex-col gap-2">
                  <Text className="text-base text-[#1F2937]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.1LogintoSmartTa", "1. Log in to SmartTax through your GK HRMS account")}</Text>
                  <Text className="text-base text-[#1F2937]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.2Verifyprefille", "2. Verify pre-filled details (income, deductions, and PAN info)")}</Text>
                  <Text className="text-base text-[#1F2937]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.3Reviewtaxsumma", "3. Review tax summary and select \"File ITR\"")}</Text>
                  <Text className="text-base text-[#1F2937]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.4Downloadacknow", "4. Download acknowledgment instantly")}</Text>
                </View>
              </View>
            </View>
          </View>
        }

        {activeTab === "taxSaving" &&
        <View className="bg-white rounded-lg p-6 max-md:p-4 border border-gray-200  flex-col gap-6 relative">
             <View className="absolute inset-0 z-10 bg-white/60 items-center justify-center rounded-xl">
               <Text className="text-gray-500 font-bold text-lg border border-gray-300 px-4 py-2 bg-white rounded-lg ">{t("Auto.Common.WorkInProgress", "Work In Progress")}</Text>
            </View>
            <View>
              <Text className="text-[#43C17A] text-[20px] mb-2" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.TaxSavingInvest", "Tax Saving Investment")}</Text>
              <Text className="text-[#1F2937] text-base" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Growyoursavings", "Grow your savings smartly while reducing your taxable income.")}

            </Text>
            </View>
            <View className="border border-black rounded-md p-6 max-md:p-4 bg-white">
              <Text className="text-[#1F2937] text-base mb-4" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Wonderinghowtos", "Wondering how to save tax and build wealth together?")}

            </Text>
              <View className="flex-col gap-3">
                {[
              "Save up to ₹46,800 in taxes annually by investing in top-performing ELSS mutual funds.",
              "InvestEase automatically monitors and rebalances your investment portfolio for optimal returns.",
              "Enjoy a fully digital, paperless, and zero-commission investment process.",
              "Complete your investment in under 5 minutes using your GK HRMS credentials.",
              "Gain access to diversified funds with high returns and low lock-in periods.",
              "Track all your tax-saving investments in one place directly from your HRMS."].
              map((item, i) =>
              <View key={i} className="flex-row gap-3">
                    <View className="mt-[7px] w-[5px] h-[5px] bg-black rounded-full" />
                    <Text className="text-base text-[#1F2937] flex-1" style={{ fontFamily: fonts.regular }}>{item}</Text>
                  </View>
              )}
              </View>
            </View>
            <View className="border border-black rounded-md p-6 max-md:p-4 bg-white">
              <Text className="text-[#1F2937] text-base mb-4" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.GrowYourFinanci", "Grow Your Financial Wellness")}

            </Text>
              <View className="flex-col gap-3">
                {[
              "Divert your taxable income into smart investments like ELSS, NPS, and Insurance.",
              "Get personalized suggestions through TaxOptimizer+ integrated in GK HRMS.",
              "Track your portfolio performance anytime from the My Finances section.",
              "Transparent dashboard — view total savings, investment growth, and tax benefit summaries.",
              "Start your journey toward smart, goal-based investing today!"].
              map((item, i) =>
              <View key={i} className="flex-row gap-3">
                    <View className="mt-[7px] w-[5px] h-[5px] bg-black rounded-full" />
                    <Text className="text-base text-[#1F2937] flex-1" style={{ fontFamily: fonts.regular }}>{item}</Text>
                  </View>
              )}
              </View>
            </View>
          </View>
        }
      </View>
    </View>);

}
