import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useUser } from '@/utils/context/UserContext';

// Standard tailwind font sizes
const TAILWIND_SIZES: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
  'text-6xl': 60,
  'text-7xl': 72,
  'text-8xl': 96,
  'text-9xl': 128,
};

export function Text(props: TextProps) {
  const { fontScale } = useUser();
  const scale = fontScale ? fontScale / 100 : 1;

  if (scale === 1) {
    return <RNText {...props} />;
  }

  const flattenedStyle = StyleSheet.flatten(props.style || {});
  let originalFontSize = flattenedStyle?.fontSize;

  if (!originalFontSize && (props as any).className) {
    const classNames = typeof (props as any).className === 'string' 
      ? (props as any).className.split(' ') 
      : [];

    for (const cls of classNames) {
      if (TAILWIND_SIZES[cls]) {
        originalFontSize = TAILWIND_SIZES[cls];
      } else if (cls.startsWith('text-[')) {
        const match = cls.match(/text-\[([0-9.]+)(px|rem)?\]/);
        if (match) {
          const val = parseFloat(match[1]);
          if (match[2] === 'rem') {
            originalFontSize = val * 16;
          } else {
            originalFontSize = val;
          }
        }
      }
    }
  }

  // Final fallback
  if (!originalFontSize) {
    originalFontSize = 14;
  }

  const scaledFontSize = originalFontSize * scale;

  return (
    <RNText 
      {...props} 
      style={[
        props.style, 
        { fontSize: scaledFontSize }
      ]} 
    />
  );
}
