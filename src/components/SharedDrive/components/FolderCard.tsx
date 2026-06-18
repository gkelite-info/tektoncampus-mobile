import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, Modal } from 'react-native';
import { Folder, DotsThreeOutlineVertical, PencilSimple, Trash } from "phosphor-react-native";

export type FolderItemProps = {
  driveFolderId: number;
  name: string;
  filesCount: number;
  sizeLabel: string;
  color: string;
  onRename?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
};

export function FolderCard({
  name,
  filesCount,
  sizeLabel,
  color,
  onRename,
  onDelete,
  onClick
}: FolderItemProps) {const { t } = useTranslation();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClick}
        style={{ backgroundColor: `${color}26` }}
        className="rounded-xl p-3 mr-4 w-36 h-[120px] relative justify-between">
        
        <View className="flex-row justify-between items-start">
          <View className="flex items-center justify-center">
            <Folder size={48} weight="fill" color={color} />
          </View>
          <TouchableOpacity onPress={handleMenuPress} className="p-1 -mr-1 -mt-1">
            <DotsThreeOutlineVertical size={18} color="#94A3B8" weight="fill" />
          </TouchableOpacity>
        </View>

        <View className="mt-auto px-1">
          <Text className="text-[13px] font-semibold text-[#0F172A]" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-1 text-[10px] text-[#94A3B8]">
            {filesCount} {filesCount === 1 ? "File" : "Files"} · {sizeLabel}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        
        <TouchableOpacity
          className="flex-1 bg-black/20 justify-center items-center px-4"
          onPress={() => setShowMenu(false)}
          activeOpacity={1}>
          
          <View className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-full max-w-[200px]">
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                onRename?.();
              }}
              className="flex-row items-center px-4 py-3 border-b border-gray-100">
              
              <PencilSimple size={18} color="#4B5563" />
              <Text className="ml-3 text-sm font-medium text-gray-700">{t("Auto.Common.Rename", "Rename")}

              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                onDelete?.();
              }}
              className="flex-row items-center px-4 py-3">
              
              <Trash size={18} color="#EF4444" />
              <Text className="ml-3 text-sm font-medium text-red-500">{t("Auto.Common.Delete", "Delete")}

              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>);

}