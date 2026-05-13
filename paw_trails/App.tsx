import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, ActivityIndicator, View } from "react-native";
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
import { subscribeAuth } from "./src/services/authService";
import { getUserDoc, subscribeDogs, subscribeWalks } from "./src/services/firestoreService";
import { useUserStore } from "./src/stores/userStore";
import { useDogStore } from "./src/stores/dogStore";
import { useWalkStore } from "./src/stores/walkStore";
import i18n from "./src/i18n";
import { COLORS } from "./src/constants/theme";
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
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const SettingsNav = createNativeStackNavigator<SettingsParamList>();

function SettingsNavigator() {
  return (
    <SettingsNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
      }}
    >
      <SettingsNav.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: i18n.t("settings") }}
      />
      <SettingsNav.Screen
        name="FamilySetup"
        component={FamilySetupScreen}
        options={{ title: i18n.t("familySetup") }}
      />
      <SettingsNav.Screen
        name="DogEdit"
        component={DogEditScreen}
        options={{ title: i18n.t("editDog") }}
      />
    </SettingsNav.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: i18n.t("home"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🐾</Text>,
        }}
      />
      <Tab.Screen
        name="Walks"
        component={WalkHistoryScreen}
        options={{
          title: i18n.t("walks"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          headerShown: false,
          title: i18n.t("settings"),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
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
  const [authUser, setAuthUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("done");
  const dogsEverLoadedRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeAuth(async (firebaseUser) => {
      setAuthUser(firebaseUser);
      if (firebaseUser) {
        try {
          let data = await getUserDoc(firebaseUser.uid);
          if (!data) {
            // Race condition on new registration: onAuthStateChanged fires before
            // createUserDoc completes. Retry once after a short wait.
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
          } else {
            // Still no doc — fall back to auth data with default familyId = uid
            setUser({
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName ?? "",
              familyId: firebaseUser.uid,
              settings: { metricSystem: true, privacyMasking: true, language: "ja" },
            });
          }
        } catch (e) {
          console.error("getUserDoc failed:", e);
        }
      } else {
        clearUser();
        setDogs([]);
        setWalks([]);
        setOnboardingStep("done");
        dogsEverLoadedRef.current = false;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.familyId) return;
    const unsubDogs = subscribeDogs(user.familyId, (loadedDogs: Dog[]) => {
      setDogs(loadedDogs);
      if (loadedDogs.length > 0) {
        dogsEverLoadedRef.current = true;
        // if we were on onboarding waiting for the dog, proceed to done
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
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
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
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: "#fff",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="WalkDetail"
            component={WalkDetailScreen}
            options={{
              title: i18n.t("walkDetail"),
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: "#fff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
