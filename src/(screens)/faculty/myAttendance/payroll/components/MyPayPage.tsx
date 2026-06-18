import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Download } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
import { fetchEmployeePaySummary } from "@/lib/helpers/faculty/myAttendance/payroll/fetchEmployeePaySummary";
import { fonts } from "@/constants/fonts";
const ShimmerBlock = () => <View className="absolute inset-0 bg-white/80 z-10 p-5 flex-col gap-3 rounded-xl justify-center">
    <View className="h-4 bg-gray-200 rounded w-1/3" />
    <View className="h-6 bg-gray-200 rounded w-1/2" />
    <View className="h-4 bg-gray-200 rounded w-2/3 mt-2" />
  </View>;
export default function MyPayPage() {
  const {
    t
  } = useTranslation();
  const {
    userId: loggedInUserId,
    collegeId
  } = useUser();
  const [activeTab, setActiveTab] = useState<"salary" | "tax">("salary");
  const [payData, setPayData] = useState<any | null>(null);
  const [isFetchingPay, setIsFetchingPay] = useState(true);
  const loadPayData = async () => {
    if (!loggedInUserId || !collegeId) return;
    setIsFetchingPay(true);
    try {
      const data = await fetchEmployeePaySummary(Number(loggedInUserId), Number(collegeId));
      setPayData(data);
    } catch (error) {
      console.error("Failed to fetch pay summary:", error);
    } finally {
      setIsFetchingPay(false);
    }
  };
  useEffect(() => {
    loadPayData();
  }, [loggedInUserId, collegeId]);
  const totalCTC = payData?.totalCTC || payData?.totalCtc || payData?.employee_salary_structure?.totalCtc || 0;
  const fixedPay = payData?.fixedPay || payData?.employee_salary_structure?.fixedPay || 0;
  const variablePay = payData?.variablePay || payData?.employee_salary_structure?.variablePay || 0;
  const monthlySalary = payData?.monthlySalary || payData?.employee_pay_profiles?.monthlySalary || (totalCTC ? Math.round(totalCTC / 12) : 0);
  const allowancesArray = payData?.allowances || payData?.employee_salary_component_values || [];
  const compliancesArray = payData?.compliances || payData?.employee_payroll_compliance_values || [];
  const totalAllowances = allowancesArray.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const totalCompliances = compliancesArray.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const takeHomePay = monthlySalary + totalAllowances - totalCompliances;
  const formatINR = (val: number | undefined) => (val || 0).toLocaleString("en-IN");
  const paySlips = [{
    id: 1,
    month: "January 2025",
    date: "23/09/2025",
    gross: "45,500.0",
    deductions: "5,80.00",
    net: "6,90.00"
  }, {
    id: 2,
    month: "February 2025",
    date: "23/09/2025",
    gross: "45,500.0",
    deductions: "5,80.00",
    net: "6,90.00"
  }, {
    id: 3,
    month: "March 2025",
    date: "23/09/2025",
    gross: "45,500.0",
    deductions: "5,80.00",
    net: "6,90.00"
  }, {
    id: 4,
    month: "April 2025",
    date: "23/10/2025",
    gross: "45,500.0",
    deductions: "5,80.00",
    net: "6,90.00"
  }];
  return <View className="w-full flex-col max-md:px-2">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => setActiveTab("salary")}>
          <Text className={`text-[14px] ${activeTab === "salary" ? "text-[#43C17A] underline" : "text-[#333333]"}`} style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.MySalaryPaySlip", "My Salary & Pay Slips")}


          </Text>
        </TouchableOpacity>
        <Text className="text-gray-400 mx-2 text-[14px]" style={{
        fontFamily: fonts.bold
      }}>/</Text>
        <TouchableOpacity onPress={() => setActiveTab("tax")}>
          <Text className={`text-[14px] ${activeTab === "tax" ? "text-[#43C17A] underline" : "text-[#333333]"}`} style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.IncomeTAX", "Income TAX")}


          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "salary" ? <View>
          <Text className="text-[16px] text-[#333333] mb-3" style={{
        fontFamily: fonts.bold
      }}>{t("Auto.Common.MySalary", "My Salary")}

        </Text>

          <View className="flex-col md:flex-row gap-3 mb-6">
            <View className="flex-col md:w-1/3 gap-3">
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 justify-center">
                {isFetchingPay && <ShimmerBlock />}
                <Text className="text-[#666666] text-[12px]" style={{
              fontFamily: fonts.semiBold
            }}>{t("Auto.Common.CurrentCompensa", "Current Compensation")}

              </Text>
                <Text className="text-[#333333] text-[16px] mt-1" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.INR", "INR")}
                {formatINR(totalCTC)}{t("Auto.Common.Annum", "/Annum")}
              </Text>
                <View className="mt-2.5 flex-col gap-1">
                  <Text className="text-[#555] text-[11px]" style={{
                fontFamily: fonts.medium
              }}>{t("Auto.Common.Fixed", "Fixed -")}
                  <Text className="text-[#43C17A]" style={{
                  fontFamily: fonts.bold
                }}>{formatINR(fixedPay)}</Text>
                  </Text>
                  <Text className="text-[#555] text-[11px]" style={{
                fontFamily: fonts.medium
              }}>{t("Auto.Common.Variable", "Variable -")}
                  <Text className="text-[#43C17A]" style={{
                  fontFamily: fonts.bold
                }}>{formatINR(variablePay)}</Text>
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-col gap-2">
                {isFetchingPay && <ShimmerBlock />}
                <View className="flex-row justify-between items-center">
                  <Text className="text-[#333333] text-[13px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.Payroll", "Payroll")}</Text>
                  <Text className="text-[#333333] text-[12px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.TillDatePay", "Till Date Pay")}
                  <Text className="text-[#43C17A] ml-1">{payData?.tillDatePay || "0"}</Text>
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-[#666666] text-[12px]" style={{
                fontFamily: fonts.semiBold
              }}>{t("Auto.Common.Paycycle", "Paycycle")}</Text>
                  <Text className="text-[#43C17A] text-[12px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.Monthly", "Monthly")}</Text>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-col justify-between flex-1">
              {isFetchingPay && <ShimmerBlock />}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-[#333333] text-[15px]" style={{
                fontFamily: fonts.regular
              }}>{t("Auto.Common.Monthly", "Monthly :")}</Text>
                  <Text className="text-[#333333] text-[15px] ml-2" style={{
                fontFamily: fonts.bold
              }}>
                    {formatINR(monthlySalary)}
                  </Text>
                </View>
                <View className="bg-[#43C17A]/10 px-2 py-0.5 rounded-[4px]">
                  <Text className="text-[#43C17A] text-[10px] tracking-wide" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.CURRENT", "CURRENT")}</Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-3 mt-4">
                {compliancesArray.length > 0 ? compliancesArray.map((comp: any, idx: number) => {
              const compName = comp.name || comp.payroll_compliance_types?.title || "Unknown";
              return <View key={idx} className="bg-[#EAE8F9] rounded-lg py-3 px-3 min-w-[75px] flex-1 items-center justify-center">
                        <Text className="text-[#555] text-[12px] mb-0.5" style={{
                  fontFamily: fonts.semiBold
                }}>{compName}</Text>
                        <Text className="text-[#5B3EE8] text-[15px]" style={{
                  fontFamily: fonts.bold
                }}>{formatINR(Number(comp.amount))}</Text>
                      </View>;
            }) : <>
                    <View className="bg-[#EAE8F9] rounded-lg py-3 px-3 min-w-[75px] flex-1 items-center justify-center">
                      <Text className="text-[#555] text-[12px] mb-0.5" style={{
                  fontFamily: fonts.semiBold
                }}>{t("Auto.Common.PF", "PF")}</Text>
                      <Text className="text-[#5B3EE8] text-[15px]" style={{
                  fontFamily: fonts.bold
                }}>0</Text>
                    </View>
                    <View className="bg-[#EAE8F9] rounded-lg py-3 px-3 min-w-[75px] flex-1 items-center justify-center">
                      <Text className="text-[#555] text-[12px] mb-0.5" style={{
                  fontFamily: fonts.semiBold
                }}>{t("Auto.Common.EF", "EF")}</Text>
                      <Text className="text-[#5B3EE8] text-[15px]" style={{
                  fontFamily: fonts.bold
                }}>0</Text>
                    </View>
                  </>}
              </View>

              <View className="mt-5 flex-row justify-center items-center border-t border-gray-100 pt-4">
                <Text className="text-[#43C17A] text-[15px]" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.TakeHome", "Take Home :")}</Text>
                <Text className="text-[#333333] text-[15px] ml-2" style={{
              fontFamily: fonts.bold
            }}>{formatINR(takeHomePay)}</Text>
              </View>
            </View>
          </View>

          <Text className="text-[16px] text-[#333333] mb-3" style={{
        fontFamily: fonts.bold
      }}>{t("Auto.Common.PaySlips", "Pay Slips")}

        </Text>

          <View className="flex-col pb-6 gap-4">
            {paySlips.map(slip => {
          const {
            t
          } = useTranslation();
          return <View key={slip.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex-col">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-[15px] text-[#333333]" style={{
                fontFamily: fonts.bold
              }}>{slip.month}</Text>
                  <View className="flex-row items-center gap-4">
                    <Text className="text-[13px] text-[#333333]" style={{
                  fontFamily: fonts.bold
                }}>{t("Auto.Common.Status", "Status -")}
                  <Text className="text-[#43C17A]">{t("Auto.Common.Paid", "Paid")}</Text>
                    </Text>
                    <TouchableOpacity className="flex-row items-center">
                      <Text className="text-[13px] text-[#333333] mr-1.5" style={{
                    fontFamily: fonts.bold
                  }}>{t("Auto.Common.Download", "Download")}</Text>
                      <Download size={14} color="#333333" weight="bold" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-y-3">
                  <View className="w-1/2 flex-row items-center">
                    <Text className="w-[100px] text-[13px] text-[#333333]" style={{
                  fontFamily: fonts.bold
                }}>{t("Auto.Common.PayDate", "Pay Date :")}</Text>
                    <Text className="text-[13px] text-[#666666]" style={{
                  fontFamily: fonts.medium
                }}>{slip.date}</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Text className="w-[100px] text-[13px] text-[#333333]" style={{
                  fontFamily: fonts.bold
                }}>{t("Auto.Common.Deductions", "Deductions :")}</Text>
                    <Text className="text-[13px] text-[#666666]" style={{
                  fontFamily: fonts.medium
                }}>{slip.deductions}</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Text className="w-[100px] text-[13px] text-[#333333]" style={{
                  fontFamily: fonts.bold
                }}>{t("Auto.Common.GrossPay", "Gross Pay :")}</Text>
                    <Text className="text-[13px] text-[#666666]" style={{
                  fontFamily: fonts.medium
                }}>{slip.gross}</Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Text className="w-[100px] text-[13px] text-[#333333]" style={{
                  fontFamily: fonts.bold
                }}>{t("Auto.Common.NetPay", "Net Pay :")}</Text>
                    <Text className="text-[13px] text-[#666666]" style={{
                  fontFamily: fonts.medium
                }}>{slip.net}</Text>
                  </View>
                </View>
              </View>;
        })}
          </View>
        </View> : <View className="flex-col pb-6 relative">
          <View className="absolute inset-0 z-10 bg-white/60 items-center justify-center rounded-xl">
             <Text className="text-gray-500 font-bold text-lg border border-gray-300 px-4 py-2 bg-white rounded-lg shadow-sm">{t("Auto.Common.WorkInProgress", "Work In Progress")}</Text>
          </View>
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-6 flex-row flex-wrap gap-y-6">
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.NetTaxableIncom", "Net Taxable Income")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR339200", "INR 3,39,200")}</Text>
            </View>
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.GrossIncomeTax", "Gross Income Tax")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR339200", "INR 3,39,200")}</Text>
            </View>
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.TotalSurchargeC", "Total Surcharge & Cess")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR339200", "INR 3,39,200")}</Text>
            </View>
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.NetIncomeTaxPay", "Net Income Tax Payable")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR339200", "INR 3,39,200")}</Text>
            </View>
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.TAXpaidTillNow", "TAX paid Till Now")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR0", "INR 0")}</Text>
            </View>
            <View className="w-1/2 md:w-1/3 pr-2">
              <Text className="text-[#333333] text-[14px]" style={{
            fontFamily: fonts.bold
          }}>{t("Auto.Common.RemainingTaxToB", "Remaining Tax To Be Paid")}</Text>
              <Text className="text-[#43C17A] text-[13px] mt-1" style={{
            fontFamily: fonts.medium
          }}>{t("Auto.Common.INR0", "INR 0")}</Text>
            </View>
          </View>
          
          <View className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View className="flex-row border-b border-gray-100">
                  <Text className="w-32 py-4 px-6 text-[#333333] text-[14px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.SalaryBreakup", "Salary Breakup")}</Text>
                  <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.Total", "Total")}</Text>
                  <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.Apr25", "Apr 25")}</Text>
                  <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.May25", "May 25")}</Text>
                  <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                fontFamily: fonts.bold
              }}>{t("Auto.Common.Jun25", "Jun 25")}</Text>
                </View>
                <View className="flex-col">
                  <View className="flex-row border-b border-gray-50">
                    <Text className="w-32 py-4 px-6 text-[#666666] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>{t("Auto.Common.Basic", "Basic")}</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>2,12,500</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>37,417</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>37,417</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>37,417</Text>
                  </View>
                  <View className="flex-row">
                    <Text className="w-32 py-4 px-6 text-[#666666] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>{t("Auto.Common.HRA", "HRA")}</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>85,000</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>14,234</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>14,234</Text>
                    <Text className="w-24 py-4 px-6 text-[#333333] text-[14px]" style={{
                  fontFamily: fonts.medium
                }}>14,234</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>}
    </View>;
}