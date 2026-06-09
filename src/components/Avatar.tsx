import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { UserCircle } from 'phosphor-react-native';

interface AvatarProps {
  src?: string | null;
  size?: number;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, size = 40 }) => {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <UserCircle size={size * 0.75} color="#9CA3AF" weight="fill" />
    </View>
  );
};
