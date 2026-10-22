import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";

export type ToastTone = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { bg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  success: { bg: colors.emerald[700], icon: "checkmark-circle" },
  error: { bg: colors.rose[600], icon: "alert-circle" },
  info: { bg: colors.stone[900], icon: "information-circle" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 10, duration: 180, useNativeDriver: true }),
    ]).start(() => setCurrent(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setCurrent({ id: Date.now(), message, tone });
      opacity.setValue(0);
      translateY.setValue(10);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      ]).start();
      timer.current = setTimeout(hide, 2_800);
    },
    [hide, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const palette = current ? toneStyles[current.tone] : toneStyles.info;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              backgroundColor: palette.bg,
              bottom: insets.bottom + 84,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Ionicons name={palette.icon} size={18} color={colors.white} />
          <Text style={styles.text}>{current.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    elevation: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  text: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.white,
  },
});
