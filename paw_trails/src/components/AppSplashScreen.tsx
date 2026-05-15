import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";

export default function AppSplashScreen() {
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ロゴがバウンスしながら出現
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // テキストが少し遅れてフェードイン
    Animated.timing(textOpacity, {
      toValue: 1, duration: 500, delay: 350, useNativeDriver: true,
    }).start();

    // 足跡がリレーで光る
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.25, duration: 350, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );

    makePulse(paw1, 600).start();
    makePulse(paw2, 950).start();
    makePulse(paw3, 1300).start();
  }, []);

  return (
    <View style={s.container}>
      {/* ロゴ */}
      <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Text style={s.pawIcon}>🐾</Text>
      </Animated.View>

      {/* アプリ名 + タグライン */}
      <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
        <Text style={s.appName}>KithPaw</Text>
        <Text style={s.tagline}>あなたの犬との毎日を記録</Text>
      </Animated.View>

      {/* 足跡ローディング */}
      <View style={s.pawRow}>
        <Animated.Text style={[s.pawDot, { opacity: paw1 }]}>🐾</Animated.Text>
        <Animated.Text style={[s.pawDot, { opacity: paw2 }]}>🐾</Animated.Text>
        <Animated.Text style={[s.pawDot, { opacity: paw3 }]}>🐾</Animated.Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5C8F72",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logoWrap: {
    width: 120, height: 120,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pawIcon: { fontSize: 64 },
  appName: {
    fontSize: 36, fontWeight: "800", color: "#fff",
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 14, color: "rgba(255,255,255,0.75)",
    marginTop: 4, letterSpacing: 0.5,
  },
  pawRow: {
    flexDirection: "row", gap: 12, marginTop: 24,
  },
  pawDot: { fontSize: 20, color: "#fff" },
});
