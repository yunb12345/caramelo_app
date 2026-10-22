import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from "react-native-safe-area-context";
import { colors, fontSizes, fonts, spacing } from "../theme";
import { IconButton } from "./ui";

export function Screen({
  children,
  style,
  edges = ["top"],
  background = colors.stone[100],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  background?: string;
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: background }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function ScrollScreen({
  children,
  contentContainerStyle,
  refreshControl,
  edges = ["top"],
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  edges?: Edge[];
}) {
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={edges}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Volver"
          background={colors.white}
          color={colors.stone[700]}
          onPress={onBack}
          style={styles.backButton}
        />
      ) : null}

      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function HeaderAction({
  icon,
  onPress,
  accessibilityLabel,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  accessibilityLabel: string;
  badge?: number;
}) {
  return (
    <View>
      <IconButton
        icon={icon}
        accessibilityLabel={accessibilityLabel}
        background={colors.brand[600]}
        color={colors.white}
        size={19}
        onPress={onPress}
        style={styles.headerAction}
      />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    marginLeft: -4,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: fontSizes.title,
    fontFamily: fonts.medium,
    color: colors.stone[900],
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerAction: {
    width: 40,
    height: 40,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.rose[600],
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fonts.medium,
  },
});
