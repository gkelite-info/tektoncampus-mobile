import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  GraduationCap,
  Info,
  Lock,
  SpinnerGap,
} from 'phosphor-react-native';
import { BlurView } from 'expo-blur';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'ios' ? 56 : 40;

// Tailwind token → px map  (1 unit = 4px)
const T = {
  /** spacing */
  s0_5: 2,
  s1: 4,
  s1_5: 6,
  s2: 8,
  s2_5: 10,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 28,
  s8: 32,
  s9: 36,
  s10: 40,
  s12: 48,
  /** radius */
  rLg: 8,
  rXl: 12,
  r2Xl: 16,
  r3Xl: 20,
  /** font sizes */
  f11: 11,
  f13: 13,
  f13_5: 13.5,
  f14: 14,
  f15: 15,
  f16: 16,
  f19: 19,
  f20: 20,
  /** line heights */
  lh16: 16,
  lh18: 18,
  lh20: 20,
  lh24: 24,
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  green1: '#6AE18B',
  green2: '#B7F3CB',
  darkGreen: '#1B4D3E',
  darkGreen2: '#1F3D2F',
  darkGreen3: '#1A5D3C',
  navy: '#16284F',
  gray700: '#374151',
  amber300: '#FCD34D',
  white: '#FFFFFF',
  // opacity variants
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
};

const F = {
  regular: 'Jost-Regular',
  medium: 'Jost-Medium',
  semibold: 'Jost-SemiBold',
  bold: 'Jost-Bold',
};

const SLIDES = [
  {
    heading: 'Managing Campus Excellence and Operations',
    para: 'Oversee students, faculty, academics, and daily campus activities — all in one place.',
    image: require('../../../assets/loginslide1.png'),
  },
  {
    heading: 'Managing Operations and User Activities',
    para: 'Handle day-to-day tasks, manage users, and ensure smooth system operations — all in one place.',
    image: require('../../../assets/loginslide2.png'),
  },
  {
    heading: 'Handling Faculty and Staff Operations',
    para: 'Track attendance, manage records, and streamline HR processes with ease.',
    image: require('../../../assets/loginslide3.png'),
  },
  {
    heading: 'Managing Financial Operations and Transparency',
    para: 'Oversee budgets, track expenses, and manage financial records — all in one place.',
    image: require('../../../assets/loginslide4.png'),
  },
  {
    heading: 'Handling Financial Transactions and Operations',
    para: 'Manage fee collections, track payments, and maintain financial records — all in one place.',
    image: require('../../../assets/loginslide5.png'),
  },
  {
    heading: 'Driving Student Placements and Success',
    para: 'Manage job opportunities, campus drives, and student career growth efficiently.',
    image: require('../../../assets/loginslide6.png'),
  },
  {
    heading: 'Empowering Teaching and Student Success',
    para: 'Manage classes, track student progress, and deliver quality education — all in one place.',
    image: require('../../../assets/loginslide7.png'),
  },
  {
    heading: 'Managing Learning and Academic Progress',
    para: 'Track attendance, assignments, and academic performance — all in one place.',
    image: require('../../../assets/loginslide8.png'),
  },
  {
    heading: "Staying Connected to Your Child's Academic Journey",
    para: 'Track attendance, monitor performance, and stay updated — all in one place',
    image: require('../../../assets/loginslide9.png'),
  },
  {
    heading: 'Managing Student Well-Being Activities',
    para: 'Track issues, handle requests, and ensure student support with ease.',
    image: require('../../../assets/loginslide10.png'),
  },
];

const N = SLIDES.length;

interface SlideCardProps {
  slide: (typeof SLIDES)[0];
  position: 'center' | 'left' | 'right' | 'hidden';
  /** transition progress 0→1 driven by parent Animated.Value */
  containerWidth: number;
}

const SlideCard = React.memo(({ slide, position, containerWidth }: SlideCardProps) => {
  // Continuous gentle float for the CENTER card  (mirror web's hover effect)
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (position === 'center') {
      floatLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      floatLoopRef.current.start();
    } else {
      floatLoopRef.current?.stop();
      Animated.timing(floatAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    return () => floatLoopRef.current?.stop();
  }, [position]);

  const cardWidth = containerWidth * 1;

  const TRANSFORM: Record<string, { tx: number; ty: number; rot: string; sc: number; op: number }> =
    {
      center: { tx: 0, ty: 0, rot: '0deg', sc: 1, op: 1 },
      right: {
        tx: containerWidth * 0.3,
        ty: -(containerWidth * 0.1),
        rot: '25deg',
        sc: 0.85,
        op: 0,
      },
      left: {
        tx: -containerWidth * 0.3,
        ty: -(containerWidth * 0.1),
        rot: '-25deg',
        sc: 0.85,
        op: 0,
      },
      hidden: { tx: 0, ty: containerWidth * 0.06, rot: '0deg', sc: 0.75, op: 0 },
    };

  const { tx, ty, rot, sc, op } = TRANSFORM[position] || TRANSFORM.hidden;

  return (
    <View
      pointerEvents="none"
      style={[
        sCard.wrapper,
        {
          width: cardWidth,
          // aspect ratio 4:3
          height: cardWidth * 0.75,
          opacity: op,
          zIndex: position === 'center' ? 10 : 0,
          transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }, { scale: sc }],
        },
      ]}>
      {/* Float wraps only the center card */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: floatAnim }] }]}>
        <Image source={slide.image} style={sCard.image} resizeMode="cover" />
      </Animated.View>
    </View>
  );
});

const sCard = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [panelState, setPanelState] = useState<'slides' | 'login'>('slides');
  const [carouselW, setCarouselW] = useState(SW);

  // ── Text-slide animation (framer-motion AnimatePresence mode="wait")
  //    initial  { opacity:0, x:60 }
  //    animate  { opacity:1, x:0  }  duration 500ms ease [0.22,1,0.36,1]
  //    exit     { opacity:0, x:60 }  duration 250ms
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textSlideX = useRef(new Animated.Value(0)).current;

  // ── Panel slide
  const leftX = useRef(new Animated.Value(0)).current;
  const rightX = useRef(new Animated.Value(SW)).current;

  // ── Spinner
  const spinVal = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Proceed / back button entrance animation (fade+slide up on mount)
  const btnEntrance = useRef(new Animated.Value(0)).current;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Entrance on mount
  useEffect(() => {
    Animated.timing(btnEntrance, {
      toValue: 1,
      duration: 700,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Spinner
  useEffect(() => {
    if (loading) {
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinVal, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();
    } else {
      spinLoopRef.current?.stop();
      spinVal.setValue(0);
    }
    return () => spinLoopRef.current?.stop();
  }, [loading]);

  const spinDeg = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ─── Slide auto-advance
  //     EXIT  250ms   ENTER 500ms   easing: Easing.out(Easing.cubic) ≈ [0.22,1,0.36,1]
  const advanceSlide = useCallback(() => {
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(textSlideX, {
        toValue: 60,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrent((prev) => (prev + 1) % N);
      textSlideX.setValue(60);
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textSlideX, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(advanceSlide, 2500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advanceSlide]);

  // ─── Panel transitions  (duration-500 ease-in-out)
  const handleProceed = useCallback(() => {
    setPanelState('login');
    Animated.parallel([
      Animated.timing(leftX, {
        toValue: -SW,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rightX, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = useCallback(() => {
    Animated.parallel([
      Animated.timing(leftX, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rightX, {
        toValue: SW,
        duration: 500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setPanelState('slides'));
  }, []);

  // ─── Login
  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Login');
    }, 1500);
  };

  // ─── Carousel container width callback
  const onCarouselLayout = useCallback((e: any) => {
    setCarouselW(e.nativeEvent.layout.width);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL  —  Green gradient slides screen
          Next.js: absolute z-10 w-full h-full
                   bg-linear-to-b from-[#6AE18B] to-[#B7F3CB]
                   translate-x-0 / -translate-x-full  transition-transform duration-500
      ══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[s.panel, { transform: [{ translateX: leftX }] }]}
        pointerEvents={panelState === 'login' ? 'none' : 'auto'}>
        <LinearGradient
          colors={[C.green1, C.green2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.leftGradient}>
          {/* ── Logo ─────────────────────────────────────────────────────
              Next.js: flex flex-col items-center shrink-0
                       Image: 85x85 rounded-full object-contain
                       Text:  text-gray-700 text-[11px] font-bold tracking-wide mt-1
          ──────────────────────────────────────────────────────────────── */}
          <View style={s.logoBlock}>
            <Image
              source={require('../../../assets/login-logo.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Text style={s.logoSubtext}>Powered by GK Elite-Info</Text>
          </View>

          {/* ── Animated heading + para ────────────────────────────────────
              Next.js: mt-5 w-full overflow-hidden min-h-[95px]
              AnimatePresence initial{opacity:0,x:60} animate{opacity:1,x:0}
              exit{opacity:0,x:60} duration 0.5s ease-out-cubic
          ──────────────────────────────────────────────────────────────── */}
          <View style={s.headingWrapper}>
            <Animated.View
              style={{
                opacity: textOpacity,
                transform: [{ translateX: textSlideX }],
              }}>
              {/* text-[19px] leading-tight font-bold text-[#1B4D3E] text-center */}
              <Text style={s.slideHeading}>{SLIDES[current].heading}</Text>
              {/* text-[#1F3D2F] text-[13.5px] mt-2 opacity-90 text-center */}
              <Text style={s.slidePara}>{SLIDES[current].para}</Text>
            </Animated.View>
          </View>

          {/* ── Image carousel ────────────────────────────────────────────
              Next.js: relative w-full flex-1 min-h-[250px] mt-4 mb-4
                       overflow-hidden flex items-center justify-center
              Cards: absolute, centered, transition-all duration-[900ms]
          ──────────────────────────────────────────────────────────────── */}
          <View style={s.carouselContainer} onLayout={onCarouselLayout}>
            {SLIDES.map((slide, idx) => {
              let position: 'center' | 'left' | 'right' | 'hidden' = 'hidden';
              if (idx === current) position = 'center';
              else if (idx === (current - 1 + N) % N) position = 'left';
              else if (idx === (current + 1) % N) position = 'right';

              return (
                <SlideCard key={idx} slide={slide} position={position} containerWidth={carouselW} />
              );
            })}
          </View>

          {/* ── Dot indicators ────────────────────────────────────────────
              Next.js: flex gap-3 z-20 shrink-0 mt-1 flex-wrap justify-center px-4
              Active:   h-2 w-10 rounded-full bg-[#1A5D3C]
              Inactive: h-2 w-3  rounded-full bg-white/60 border border-white/40
          ──────────────────────────────────────────────────────────────── */}
          <View style={s.dotsRow}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, i === current ? s.dotActive : s.dotInactive]} />
            ))}
          </View>

          {/* ── "Proceed to Login" button ──────────────────────────────────
              Next.js: mt-auto pt-6 pb-3  (pushes to very bottom)
              Button: bg-[#16284F] w-full py-2.5 rounded-xl gap-2
                      shadow-[0_8px_20px_-6px_rgba(27,77,62,0.5)]
                      text-white text-[16px] font-bold tracking-wide
          ──────────────────────────────────────────────────────────────── */}
          <Animated.View
            style={[
              s.proceedWrapper,
              {
                opacity: btnEntrance,
                transform: [
                  {
                    translateY: btnEntrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleProceed} style={s.proceedBtn}>
              <Text style={s.proceedBtnText}>Proceed to Login</Text>
              <ArrowRight size={20} color={C.white} weight="bold" />
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      {/* end LEFT panel */}

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL  —  Login form
          Next.js: absolute z-10 w-full h-full
                   translate-x-full / translate-x-0  transition-transform duration-500
                   backgroundImage loginpagebg.webp cover center
      ══════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[s.panel, { transform: [{ translateX: rightX }] }]}
        pointerEvents={panelState === 'login' ? 'auto' : 'none'}>
        {/* Background image */}
        <ImageBackground
          source={require('../../../assets/loginpagebg.webp')}
          resizeMode="cover"
          style={s.rightBg}>
          {/* Dark overlay  bg-black/30  */}
          <View style={s.rightOverlay} />

          {/* ── Back button ─────────────────────────────────────────────
              Next.js: absolute top-4 left-4 z-20
                       flex items-center gap-1.5
                       bg-black/20 px-3 py-2 rounded-xl backdrop-blur-md
                       border border-white/10
          ─────────────────────────────────────────────────────────────── */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleBack} style={s.backBtn}>
            <ArrowLeft size={16} color={C.white} weight="bold" />
            <Text style={s.backBtnText}>Back to slides</Text>
          </TouchableOpacity>

          {/* ── Scrollable area ──────────────────────────────────────────
              max-h-[85dvh] mt-12 overflow-y-auto
          ─────────────────────────────────────────────────────────────── */}
          <ScrollView
            style={s.formScroll}
            contentContainerStyle={s.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* ── Glass Card Container View ───────────────────────────────── */}
            <View style={s.glassCard}>
              {/* ── Background Blur Layer ─────────────────────────────────── */}
              <BlurView
                intensity={35}
                tint="light"
                style={StyleSheet.absoluteFillObject} // This stretches it perfectly behind everything
              />

              {/* ── Icon circle ───────────────────────────────────────── */}
              <View style={s.iconCircleRow}>
                <View style={s.iconCircle}>
                  <GraduationCap size={26} color={C.white} weight="fill" />
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={s.cardTitle}>Login to Your Account</Text>
              <Text style={s.cardSubtitle}>Please enter your credentials to proceed.</Text>

              {/* ── Email ─────────────────────────────────────────────── */}
              <View>
                <Text style={s.fieldLabel}>Email</Text>
                <View style={s.inputRow}>
                  <View style={s.inputIconLeft}>
                    <EnvelopeSimple size={17} color={C.white70} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your registered email"
                    placeholderTextColor={C.white60}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={s.textInput}
                  />
                </View>
              </View>

              {/* ── Password ──────────────────────────────────────────── */}
              <View style={{ marginTop: T.s5 }}>
                <Text style={s.fieldLabel}>Password</Text>
                <View style={s.inputRow}>
                  <View style={s.inputIconLeft}>
                    <Lock size={17} color={C.white70} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={C.white60}
                    secureTextEntry={!showPassword}
                    style={[s.textInput, { paddingRight: T.s12 }]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword((v) => !v)}
                    style={s.eyeBtn}>
                    {showPassword ? (
                      <EyeSlash size={20} color={C.white60} />
                    ) : (
                      <Eye size={20} color={C.white60} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Info + Forgot password ──────────────────────────────── */}
              <View style={s.infoRow}>
                <TouchableOpacity activeOpacity={0.7} style={s.forgotBtn}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={s.infoBlock}>
                  <Info size={15} color={C.amber300} style={{ marginTop: 2 }} />
                  <Text style={s.infoText}>
                    New account? Verify your email before logging in. Check inbox or spam.
                  </Text>
                </View>
              </View>

              {/* ── Gradient divider ────────────────────────────────────── */}
              <LinearGradient
                colors={['transparent', C.white20, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.divider}
              />

              {/* ── Login button ────────────────────────────────────────── */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleLogin}
                style={[s.loginBtn, loading && s.loginBtnDisabled]}>
                {loading ? (
                  <View style={s.loadingRow}>
                    <Animated.View style={{ transform: [{ rotate: spinDeg }], marginRight: 8 }}>
                      <SpinnerGap size={18} color={C.white} />
                    </Animated.View>
                    <Text style={s.loginBtnText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={s.loginBtnText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
            {/* end glass card */}
          </ScrollView>
          {/* end scroll */}
        </ImageBackground>
      </Animated.View>
      {/* end RIGHT panel */}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Root
  root: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },

  // ───────────────────────────────────────────────
  //  LEFT PANEL
  // ───────────────────────────────────────────────
  leftGradient: {
    flex: 1,
    paddingTop: SAFE_TOP,
    paddingBottom: T.s4, // pb-4
    paddingHorizontal: T.s8, // px-8
    flexDirection: 'column',
  },

  // Logo block
  logoBlock: {
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 40,
  },
  logoImg: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'transparent',
  },
  logoSubtext: {
    fontFamily: F.bold,
    color: C.gray700, // text-gray-700
    fontSize: T.f11, // text-[11px]
    letterSpacing: 0.8, // tracking-wide
    marginTop: T.s1, // mt-1
  },

  // Heading wrapper
  headingWrapper: {
    marginTop: T.s5, // mt-5
    minHeight: 95, // min-h-[95px]
    width: '100%',
    overflow: 'hidden',
  },
  slideHeading: {
    fontFamily: F.bold,
    fontSize: T.f19, // text-[19px]
    lineHeight: T.lh24, // leading-tight → ~24
    color: C.darkGreen, // text-[#1B4D3E]
    textAlign: 'center',
  },
  slidePara: {
    fontFamily: F.regular,
    fontSize: T.f13_5, // text-[13.5px]
    color: C.darkGreen2, // text-[#1F3D2F]
    textAlign: 'center',
    marginTop: T.s2, // mt-2
    opacity: 0.9, // opacity-90
    lineHeight: T.lh20, // leading-5
  },

  // Carousel
  carouselContainer: {
    flex: 1,
    width: '100%',
    minHeight: 250, // min-h-[250px]
    marginTop: T.s4, // mt-4
    marginBottom: T.s4, // mb-4
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dots row
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: T.s3, // gap-3
    flexShrink: 0,
    marginTop: T.s1, // mt-1
    paddingHorizontal: T.s4, // px-4
    zIndex: 20,
  },
  dot: {
    height: 8, // h-2
    borderRadius: 4,
  },
  dotActive: {
    width: 40, // w-10
    backgroundColor: C.darkGreen3, // bg-[#1A5D3C]
  },
  dotInactive: {
    width: 12, // w-3
    backgroundColor: C.white60, // bg-white/60
    borderWidth: 1,
    borderColor: C.white40, // border-white/40
  },

  // Proceed button wrapper
  proceedWrapper: {
    marginTop: 'auto', // mt-auto → pushes to bottom
    paddingTop: T.s6, // pt-6
    paddingBottom: T.s3, // pb-3
    flexShrink: 0,
    zIndex: 20,
  },
  proceedBtn: {
    backgroundColor: C.navy, // bg-[#16284F]
    width: '100%',
    paddingVertical: T.s2_5, // py-2.5
    borderRadius: T.rXl, // rounded-xl → 12
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.s2, // gap-2
    // shadow-[0_8px_20px_-6px_rgba(27,77,62,0.5)]
    shadowColor: 'rgba(27,77,62,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  proceedBtnText: {
    fontFamily: F.bold,
    color: C.white, // text-white
    fontSize: T.f16, // text-[16px]
    letterSpacing: 0.4, // tracking-wide
    marginRight: T.s1,
  },

  // ───────────────────────────────────────────────
  //  RIGHT PANEL
  // ───────────────────────────────────────────────
  rightBg: {
    flex: 1,
  },
  rightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.black30, // bg-black/30
  },

  // Back button
  backBtn: {
    position: 'absolute',
    top: SAFE_TOP,
    left: T.s4, // left-4
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s1_5, // gap-1.5
    backgroundColor: C.black20, // bg-black/20
    paddingHorizontal: T.s3, // px-3
    paddingVertical: T.s2, // py-2
    borderRadius: T.rXl, // rounded-xl
    borderWidth: 1,
    borderColor: C.white10, // border-white/10
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
  },

  backBtnText: {
    fontFamily: F.semibold,
    color: C.white90, // text-white/90
    fontSize: T.f13, // text-[13.5px] → 13
    letterSpacing: 0.3, // tracking-wide
    marginLeft: T.s1_5,
  },

  // Scroll
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: T.s5, // px-5  (90% card handles its own width)
    paddingTop: SAFE_TOP + T.s12, // mt-12 + safe area
    paddingBottom: T.s10, // pb-10
  },

  // Glass card
  //   bg rgba(255,255,255,0.10)
  //   borderRadius 20px
  //   border 1px solid rgba(255,255,255,0.20)
  //   shadow: 0 8px 32px rgba(0,0,0,0.25)
  glassCard: {
    width: '90%', // matches your w-[90%] web spec
    alignSelf: 'center', // centers the card since width is 90%
    overflow: 'hidden', // critical so the inner BlurView cuts clean at the 20px corners
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent', // let the blur handle the tone

    // Spacing (Next.js px-5 py-6)
    paddingHorizontal: 20, // or your theme equivalent
    paddingVertical: 24,

    // Box Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    // elevation: 14,
  },

  // Icon circle
  iconCircleRow: {
    alignItems: 'center',
    marginBottom: T.s6, // mb-6
  },
  iconCircle: {
    width: T.s12, // w-12 = 48
    height: T.s12, // h-12 = 48
    borderRadius: T.rXl, // rounded-xl = 12
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white10, // bg-white/10
    borderWidth: 1,
    borderColor: C.white20, // border-white/20
  },

  // Card title + subtitle
  cardTitle: {
    fontFamily: F.semibold,
    fontSize: T.f20, // text-[20px]
    color: C.white,
    textAlign: 'center',
    letterSpacing: -0.3, // tracking-tight
  },
  cardSubtitle: {
    fontFamily: F.regular,
    fontSize: T.f13, // text-[13px]
    color: C.white80, // text-white/80
    textAlign: 'center',
    marginTop: T.s1, // mt-1
    marginBottom: T.s6, // mb-6
  },

  // Field label
  fieldLabel: {
    fontFamily: F.semibold,
    fontSize: T.f13, // text-[13px]
    color: C.white,
    marginBottom: T.s1_5, // mb-1.5
    letterSpacing: 0.9, // tracking-wide
    textTransform: 'uppercase',
  },

  // Input row
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 14, // left-3.5 = 14
    zIndex: 5,
    // vertically centered — label is outside, input height is 48
    top: 15, // (48 - 18) / 2 ≈ 15
  },
  textInput: {
    fontFamily: F.regular,
    height: T.s12, // h-12 = 48
    backgroundColor: C.white10, // bg-white/10
    borderWidth: 1,
    borderColor: C.white20, // border-white/20
    borderRadius: T.rLg, // rounded-lg = 8
    paddingLeft: 44, // pl-11 = 44
    paddingRight: T.s4, // pr-4 = 16
    color: C.white,
    fontSize: T.f14, // text-[14px]
  },
  eyeBtn: {
    position: 'absolute',
    right: 14, // right-3.5 = 14
    top: 14,
    zIndex: 5,
  },

  // Info + Forgot row
  infoRow: {
    flexDirection: 'column-reverse', // flex-col-reverse (mobile)
    marginTop: T.s4, // mt-4
    gap: T.s3, // gap-3
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingBottom: T.s1, // pb-1
  },
  forgotText: {
    fontFamily: F.medium,
    fontSize: 12.5, // text-[12.5px]
    color: C.white,
    textDecorationLine: 'underline',
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: T.s1_5, // gap-1.5
    width: '100%',
  },
  infoText: {
    fontFamily: F.regular,
    fontSize: 11.5, // text-[11.5px]
    color: C.white70, // text-white/70
    lineHeight: T.lh16, // leading-snug
    flex: 1,
    marginLeft: T.s1_5,
  },

  // Gradient divider
  divider: {
    height: 1,
    marginVertical: T.s6, // my-6
    width: '100%',
  },

  // Login button
  loginBtn: {
    width: '100%',
    height: T.s12, // h-[48px]
    borderRadius: 10, // rounded-[10px]
    backgroundColor: C.white10, // bg-white/10
    borderWidth: 1,
    borderColor: C.white30, // border-white/30
    alignItems: 'center',
    justifyContent: 'center',
    // shadow-[0_8px_32px_rgba(0,0,0,0.2)]
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    // elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    fontFamily: F.semibold,
    color: C.white,
    fontSize: T.f15, // text-[15px]
    letterSpacing: 0.3, // tracking-wide
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
