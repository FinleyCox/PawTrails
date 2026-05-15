import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import type { User as FirebaseUser } from "firebase/auth";

import HomeScreen from "./src/screens/HomeScreen";
import ActiveWalkScreen from "./src/screens/ActiveWalkScreen";
import WalkHistoryScreen from "./src/screens/WalkHistoryScreen";
import AuthScreen from "./src/screens/AuthScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import DogOnboardingScreen from "./src/screens/DogOnboardingScreen";
import SubscriptionScreen from "./src/screens/SubscriptionScreen";
import FamilySetupScreen from "./src/screens/FamilySetupScreen";
import DogEditScreen from "./src/screens/DogEditScreen";
import WalkDetailScreen from "./src/screens/WalkDetailScreen";
import PhotosScreen from "./src/screens/PhotosScreen";
import AppSplashScreen from "./src/components/AppSplashScreen";
import { subscribeAuth } from "./src/services/authService";
import { getUserDoc, subscribeDogs, subscribeWalks } from "./src/services/firestoreService";
import { useUserStore } from "./src/stores/userStore";
import { useDogStore } from "./src/stores/dogStore";
import { useWalkStore } from "./src/stores/walkStore";
import i18n from "./src/i18n";
import { useThemeStore } from "./src/stores/themeStore";
import { Home, History, Settings, Camera } from "lucide-react-native";
import type { Dog } from "./src/models/Dog";
import type { Walk } from "./src/models/Walk";

export type RootStackParamList = {
  Tabs: undefined;
  ActiveWalk: undefined;
  WalkDetail: { walk: Walk };
};

export type SettingsParamList = {
  SettingsMain: undefined;
  FamilySetup: undefined;
  DogEdit: { dog: Dog };
};

export type TabParamList = {
  Home: undefined;
  Walks: undefined;
  Photos: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const SettingsNav = createNativeStackNavigator<SettingsParamList>();

function SettingsNavigator() {
  const { colors } = useThemeStore();
  return (
    <SettingsNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
      }}
    >
      <SettingsNav.Screen name="SettingsMain" component={SettingsScreen} options={{ title: i18n.t("settings") }} />
      <SettingsNav.Screen name="FamilySetup" component={FamilySetupScreen} options={{ title: i18n.t("familySetup") }} />
      <SettingsNav.Screen name="DogEdit" component={DogEditScreen} options={{ title: i18n.t("editDog") }} />
    </SettingsNav.Navigator>
  );
}

function Tabs() {
  const { colors } = useThemeStore();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#EEEEEE" },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: i18n.t("home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="Walks"
        component={WalkHistoryScreen}
        options={{
          title: i18n.t("walks"),
          tabBarIcon: ({ color, size }) => <History size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="Photos"
        component={PhotosScreen}
        options={{
          title: "写真",
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          headerShown: false,
          title: i18n.t("settings"),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tab.Navigator>
  );
}

type OnboardingStep = "dog" | "subscription" | "done";

export default function App() {
  const { user, setUser, clearUser } = useUserStore();
  const { dogs, setDogs } = useDogStore();
  const { setWalks } = useWalkStore();
  const { colors } = useThemeStore();
  const [authUser, setAuthUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("done");
  const [dataReady, setDataReady] = useState(false);
  const dogsEverLoadedRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeAuth(async (firebaseUser) => {
      setAuthUser(firebaseUser);
      if (firebaseUser) {
        // 即時に仮ユーザーをセット → 犬/散歩サブスクがすぐ始まる
        setUser({
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? "",
          familyId: firebaseUser.uid,
          settings: { metricSystem: true, privacyMasking: true, language: "ja" },
        });
        // Firestore からフル情報を取得して上書き（バックグラウンド）
        getUserDoc(firebaseUser.uid).then(async (data) => {
          if (!data) {
            // 新規登録直後のレースコンディション対策
            await new Promise((r) => setTimeout(r, 1500));
            data = await getUserDoc(firebaseUser.uid);
          }
          if (data) {
            setUser({
              id: firebaseUser.uid,
              displayName: data.displayName,
              familyId: data.familyId,
              settings: data.settings,
            });
          }
        }).catch((e) => console.error("getUserDoc failed:", e));
      } else {
        clearUser();
        setDogs([]);
        setWalks([]);
        setOnboardingStep("done");
        setDataReady(false);
        dogsEverLoadedRef.current = false;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.familyId) return;
    const unsubDogs = subscribeDogs(user.familyId, (loadedDogs: Dog[]) => {
      setDogs(loadedDogs);
      setDataReady(true); // 初回スナップショット到着 → ローディング終了
      if (loadedDogs.length > 0) {
        dogsEverLoadedRef.current = true;
        setOnboardingStep((prev) => (prev === "dog" ? "done" : prev));
      } else if (!dogsEverLoadedRef.current) {
        setOnboardingStep("dog");
      }
    });
    const unsubWalks = subscribeWalks(user.familyId, (walks: Walk[]) => setWalks(walks));
    return () => {
      unsubDogs();
      unsubWalks();
    };
  }, [user?.familyId]);

  if (authUser === undefined) {
    return <AppSplashScreen />;
  }

  // 認証済みだがFirestoreデータ未到着 → スプラッシュ継続
  if (authUser && !dataReady) {
    return <AppSplashScreen />;
  }

  if (!authUser) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  if (onboardingStep === "dog" && user?.familyId) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <DogOnboardingScreen
          onDone={() => setOnboardingStep("done")}
          onAddMore={() => setOnboardingStep("subscription")}
        />
      </SafeAreaProvider>
    );
  }

  if (onboardingStep === "subscription") {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SubscriptionScreen onSkip={() => setOnboardingStep("done")} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="ActiveWalk"
            component={ActiveWalkScreen}
            options={{
              title: i18n.t("startWalk"),
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700" },
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="WalkDetail"
            component={WalkDetailScreen}
            options={{
              title: i18n.t("walkDetail"),
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
