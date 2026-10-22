import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { CategoriesScreen } from "../screens/CategoriesScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { MovementFormScreen } from "../screens/MovementFormScreen";
import { MovementsScreen } from "../screens/MovementsScreen";
import { PosScreen } from "../screens/PosScreen";
import { ProductFormScreen } from "../screens/ProductFormScreen";
import { ProductsScreen } from "../screens/ProductsScreen";
import { SaleDetailScreen } from "../screens/SaleDetailScreen";
import { SalesScreen } from "../screens/SalesScreen";
import { colors, fonts, radius } from "../theme";
import type { RootStackParamList, TabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const tabIcons: Record<
  keyof TabParamList,
  { active: React.ComponentProps<typeof Ionicons>["name"]; inactive: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  Dashboard: { active: "grid", inactive: "grid-outline" },
  Pos: { active: "cart", inactive: "cart-outline" },
  Products: { active: "shirt", inactive: "shirt-outline" },
  Sales: { active: "receipt", inactive: "receipt-outline" },
  More: { active: "ellipsis-horizontal-circle", inactive: "ellipsis-horizontal-circle-outline" },
};

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand[600],
    background: colors.stone[100],
    card: colors.white,
    text: colors.stone[900],
    border: colors.stone[200],
    notification: colors.rose[600],
  },
};

const TAB_BAR_CONTENT_HEIGHT = 60;

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.stone[400],
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
            paddingTop: 6,
            paddingBottom: bottomInset,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Panel" }} />
      <Tab.Screen name="Pos" component={PosScreen} options={{ title: "Vender" }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: "Productos" }} />
      <Tab.Screen name="Sales" component={SalesScreen} options={{ title: "Ventas" }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: "Mas" }} />
    </Tab.Navigator>
  );
}

function BootScreen() {
  return (
    <View style={styles.boot}>
      <View style={styles.bootLogo}>
        <Text style={styles.bootLogoText}>C</Text>
      </View>
      <Text style={styles.bootTitle}>Caramelo</Text>
      <Text style={styles.bootSubtitle}>Inventario y ventas</Text>
      <ActivityIndicator color={colors.brand[200]} style={styles.bootSpinner} />
    </View>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <BootScreen />;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.stone[100] },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProductForm" component={ProductFormScreen} />
            <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
            <Stack.Screen name="Movements" component={MovementsScreen} />
            <Stack.Screen name="MovementForm" component={MovementFormScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.stone[200],
  },
  tabLabel: {
    fontSize: 10.5,
    fontFamily: fonts.medium,
  },
  tabItem: {
    paddingVertical: 0,
  },
  boot: {
    flex: 1,
    backgroundColor: colors.brand[800],
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bootLogo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  bootLogoText: {
    color: colors.white,
    fontSize: 34,
    fontFamily: fonts.bold,
  },
  bootTitle: {
    color: colors.white,
    fontSize: 22,
    fontFamily: fonts.medium,
    letterSpacing: -0.4,
  },
  bootSubtitle: {
    color: colors.brand[200],
    fontSize: 12,
  },
  bootSpinner: {
    marginTop: 18,
  },
});
