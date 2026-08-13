import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, ImageBackground, StatusBar, Platform, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, LayoutAnimation, UIManager, Linking } from 'react-native';
import { Text } from '@/components/AppText';
import { MagnifyingGlass, Buildings, CaretRight, GraduationCap, XCircle } from 'phosphor-react-native';
import { supabase } from '@/lib/supabaseClient';
import { useTenantStore, Tenant } from '@/store/tenantStore';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW, height: SH } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'ios' ? 56 : 40;

const T = {
  s1: 4, s1_5: 6, s2: 8, s2_5: 10, s3: 12, s4: 16, s5: 20, s6: 24, s10: 40, s12: 48,
  rLg: 8, rXl: 12,
  f13: 13, f14: 14, f15: 15, f16: 16, f20: 20
};

const C = {
  white: '#FFFFFF',
  white90: 'rgba(255,255,255,0.90)',
  white80: 'rgba(255,255,255,0.80)',
  white70: 'rgba(255,255,255,0.70)',
  white60: 'rgba(255,255,255,0.60)',
  white40: 'rgba(255,255,255,0.40)',
  white30: 'rgba(255,255,255,0.30)',
  white20: 'rgba(255,255,255,0.20)',
  white10: 'rgba(255,255,255,0.10)',
  black40: 'rgba(0,0,0,0.40)',
  black30: 'rgba(0,0,0,0.30)',
  black20: 'rgba(0,0,0,0.20)',
  black10: 'rgba(0,0,0,0.10)',
  green1: '#6AE18B',
};

const F = {
  regular: 'Jost-Regular',
  medium: 'Jost-Medium',
  semibold: 'Jost-SemiBold',
  bold: 'Jost-Bold'
};

export default function FindOrganizationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const setTenant = useTenantStore((state) => state.setTenant);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let ignore = false;

    async function searchOrganizations() {
      if (!debouncedQuery.trim()) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('collegeId, collegeName, collegeCode')
          .ilike('collegeName', `%${debouncedQuery}%`)
          .limit(15);

        if (error) throw error;
        
        if (!ignore) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setResults(data || []);
        }
      } catch (err: any) {
        if (!ignore) {
          console.error('Error searching organizations:', err);
          setError('Failed to fetch organizations.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    searchOrganizations();

    return () => {
      ignore = true;
    };
  }, [debouncedQuery]);

  const handleSelectTenant = useCallback((tenant: Tenant) => {
    setTenant(tenant);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation, setTenant]);

  const renderItem = ({ item }: { item: Tenant }) => (
    <TouchableOpacity
      style={s.resultCard}
      activeOpacity={0.7}
      onPress={() => handleSelectTenant(item)}
    >
      <View style={s.resultIconCircle}>
        <Buildings size={20} color={C.white} weight="fill" />
      </View>
      <View style={s.resultContent}>
        <Text style={s.resultTitle} numberOfLines={1}>{item.collegeName}</Text>
        <Text style={s.resultSubtitle}>{item.collegeCode}</Text>
      </View>
      <CaretRight size={18} color={C.white60} />
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground
        source={require('../../../assets/loginpagebg.webp')}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 2.5 : 1.5}
        style={s.rightBg}
      >
        <View style={s.rightOverlay} />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.formContainer}>
              <View style={s.glassCard}>
                <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />
                
                <View style={s.iconCircleRow}>
                  <View style={s.iconCircle}>
                    <GraduationCap size={26} color={C.white} weight="fill" />
                  </View>
                </View>

                <Text style={s.cardTitle}>{t('Auto.Common.FindYourSchool', 'Find Your School')}</Text>
                <Text style={s.cardSubtitle}>{t('Auto.Common.SearchSchoolDesc', 'Search by name to find your institution and proceed to login.')}</Text>

                <View style={{ marginBottom: 12 }}>
                  <Text style={s.fieldLabel}>{t('Auto.Common.Search', 'Organization Name')}</Text>
                  <View style={s.inputRow}>
                    <View style={s.inputIconLeft}>
                      <MagnifyingGlass size={17} color={C.white70} />
                    </View>
                    <TextInput
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                        if(text.trim() === '') {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setResults([]);
                        }
                      }}
                      autoFocus={true}
                      placeholder={t('Auto.Common.SearchPlaceholder', 'e.g. Springfield University')}
                      placeholderTextColor={C.white60}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={s.textInput}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity 
                        style={s.clearBtn} 
                        onPress={() => {
                          setSearchQuery('');
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setResults([]);
                        }}
                      >
                        <XCircle size={20} color={C.white60} weight="fill" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={s.resultsContainer}>
                  {loading ? (
                    <View style={s.centerBlock}>
                      <ActivityIndicator size="small" color={C.green1} />
                    </View>
                  ) : error ? (
                    <View style={s.centerBlock}>
                      <Text style={s.errorText}>{error}</Text>
                    </View>
                  ) : results.length > 0 ? (
                    <FlatList
                      data={results}
                      keyExtractor={(item) => item.collegeId.toString()}
                      renderItem={renderItem}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      contentContainerStyle={{ paddingBottom: 10 }}
                      style={{ maxHeight: 240 }}
                    />
                  ) : debouncedQuery.trim() !== '' ? (
                    <View style={s.centerBlock}>
                      <Text style={s.emptyText}>{t('Auto.Common.NoResults', 'No organizations found.')}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={s.supportBtn} 
                onPress={() => Linking.openURL('https://www.gkeliteinfo.com/contact')}
              >
                <Text style={s.supportText}>{t('Auto.Common.NeedHelp', 'Need Help? Contact Support')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  rightBg: { flex: 1 },
  rightOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.black30 },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: T.s5,
    paddingTop: SAFE_TOP,
    paddingBottom: T.s10
  },
  glassCard: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 32
  },
  iconCircleRow: { alignItems: 'center', marginBottom: T.s6 },
  iconCircle: {
    width: T.s12, height: T.s12, borderRadius: T.rXl,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white10, borderWidth: 1, borderColor: C.white20
  },
  cardTitle: {
    fontFamily: F.semibold, fontSize: T.f20, color: C.white,
    textAlign: 'center', letterSpacing: -0.3
  },
  cardSubtitle: {
    fontFamily: F.regular, fontSize: T.f13, color: C.white80,
    textAlign: 'center', marginTop: T.s1, marginBottom: T.s6
  },
  fieldLabel: {
    fontFamily: F.semibold, fontSize: T.f13, color: C.white,
    marginBottom: T.s1_5, letterSpacing: 0.9, textTransform: 'uppercase'
  },
  inputRow: { position: 'relative', justifyContent: 'center' },
  inputIconLeft: { position: 'absolute', left: 14, zIndex: 5, top: 15 },
  clearBtn: { position: 'absolute', right: 14, zIndex: 5, top: 14 },
  textInput: {
    fontFamily: F.regular, height: T.s12, backgroundColor: C.white10,
    borderWidth: 1, borderColor: C.white20, borderRadius: T.rLg,
    paddingLeft: 44, paddingRight: T.s4, color: C.white, fontSize: T.f14
  },
  resultsContainer: { marginTop: 12, minHeight: 60 },
  centerBlock: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: F.regular, color: '#FCA5A5', fontSize: T.f13 },
  emptyText: { fontFamily: F.regular, color: C.white60, fontSize: T.f13 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: C.white10,
    borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: C.white20,
  },
  resultIconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.white20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  resultContent: { flex: 1, marginRight: 8 },
  resultTitle: { fontFamily: F.medium, fontSize: 15, color: C.white, marginBottom: 2 },
  resultSubtitle: { fontFamily: F.regular, fontSize: 11, color: C.white70, textTransform: 'uppercase' },
  supportBtn: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  supportText: {
    fontFamily: F.medium,
    color: C.white70,
    fontSize: 13,
    textDecorationLine: 'underline',
  }
});
