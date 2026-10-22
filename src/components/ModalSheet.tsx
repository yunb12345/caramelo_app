import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSizes, fonts, radius, spacing, strongShadow } from "../theme";
import { IconButton } from "./ui";

export function ModalSheet({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  fullHeight = false,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  fullHeight?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.sheet,
              {
                maxHeight: fullHeight ? height * 0.94 : height * 0.9,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={styles.grabber} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {description ? <Text style={styles.description}>{description}</Text> : null}
              </View>
              <IconButton
                icon="close"
                accessibilityLabel="Cerrar"
                background={colors.stone[100]}
                onPress={onClose}
              />
            </View>

            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  color?: string | null;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

export function OptionSheet<T extends string>({
  visible,
  onClose,
  title,
  description,
  options,
  selected,
  onSelect,
  allowClear,
  clearLabel = "Sin seleccion",
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: Option<T>[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  return (
    <ModalSheet visible={visible} onClose={onClose} title={title} description={description}>
      <View style={styles.options}>
        {allowClear ? (
          <Pressable
            onPress={() => {
              onSelect(null);
              onClose();
            }}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            <View style={[styles.optionDot, { backgroundColor: colors.stone[300] }]} />
            <Text style={styles.optionLabel}>{clearLabel}</Text>
            {!selected ? (
              <Ionicons name="checkmark" size={19} color={colors.brand[600]} />
            ) : null}
          </Pressable>
        ) : null}

        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              {option.color ? (
                <View style={[styles.optionDot, { backgroundColor: option.color }]} />
              ) : option.icon ? (
                <Ionicons name={option.icon} size={18} color={colors.stone[500]} />
              ) : null}

              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {option.description ? (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                ) : null}
              </View>

              {isSelected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.brand[600]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...strongShadow,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stone[300],
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 3,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  scroll: {
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[200],
  },
  options: {
    gap: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  optionPressed: {
    backgroundColor: colors.stone[50],
  },
  optionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  optionText: { flex: 1 },
  optionLabel: {
    flex: 1,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  optionDescription: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
});
