import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, fontSizes, fonts, radius, shadow, spacing } from "../theme";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

/* ---------------------------------- Boton ---------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "soft";
type ButtonSize = "sm" | "md" | "lg";

const buttonStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.brand[600], text: colors.white },
  secondary: { bg: colors.white, text: colors.stone[700], border: colors.stone[300] },
  ghost: { bg: colors.transparent, text: colors.stone[600] },
  danger: { bg: colors.rose[600], text: colors.white },
  success: { bg: colors.emerald[600], text: colors.white },
  soft: { bg: colors.brand[50], text: colors.brand[700] },
};

const buttonSizes: Record<ButtonSize, { height: number; padding: number; fontSize: number }> = {
  sm: { height: 36, padding: 12, fontSize: 12 },
  md: { height: 44, padding: 16, fontSize: 14 },
  lg: { height: 52, padding: 20, fontSize: 15 },
};

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const palette = buttonStyles[variant];
  const metrics = buttonSizes[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          height: metrics.height,
          paddingHorizontal: metrics.padding,
          backgroundColor: palette.bg,
          borderColor: palette.border ?? colors.transparent,
          borderWidth: palette.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={metrics.fontSize + 3} color={palette.text} />}
          <Text
            style={[
              styles.buttonText,
              { color: palette.text, fontSize: metrics.fontSize },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  size = 20,
  color = colors.stone[600],
  background = colors.transparent,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: background, opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

/* --------------------------------- Inputs ---------------------------------- */

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: IconName;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  hint,
  error,
  leftIcon,
  right,
  containerStyle,
  inputStyle,
  multiline,
  style,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.rose[600]
    : focused
      ? colors.brand[500]
      : colors.stone[300];

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.inputWrapperFocused,
          multiline && styles.inputWrapperMultiline,
          props.editable === false && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.stone[400]} style={styles.leftIcon} />
        ) : null}

        <TextInput
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          placeholderTextColor={colors.stone[400]}
          selectionColor={colors.brand[500]}
          multiline={multiline}
          style={[
            styles.input,
            leftIcon && styles.inputWithIcon,
            multiline && styles.inputMultiline,
            inputStyle,
            style,
          ]}
        />

        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  rightAccessory?: ReactNode;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = "Buscar...",
  autoFocus,
  onSubmitEditing,
  rightAccessory,
}: SearchFieldProps) {
  return (
    <View style={styles.searchWrapper}>
      <Ionicons name="search" size={18} color={colors.stone[400]} style={styles.leftIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.stone[400]}
        selectionColor={colors.brand[500]}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <IconButton
          icon="close-circle"
          size={18}
          color={colors.stone[400]}
          onPress={() => onChangeText("")}
          accessibilityLabel="Limpiar busqueda"
        />
      ) : null}
      {rightAccessory}
    </View>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ---------------------------------- Badges --------------------------------- */

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "violet";

const badgeTones: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: colors.stone[100], text: colors.stone[600] },
  brand: { bg: colors.brand[100], text: colors.brand[700] },
  success: { bg: colors.emerald[100], text: colors.emerald[700] },
  warning: { bg: colors.amber[100], text: colors.amber[700] },
  danger: { bg: colors.rose[100], text: colors.rose[700] },
  info: { bg: colors.sky[100], text: colors.sky[700] },
  violet: { bg: colors.violet[100], text: colors.violet[700] },
};

export function Badge({
  label,
  tone = "neutral",
  icon,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      {icon ? <Ionicons name={icon} size={11} color={palette.text} /> : null}
      <Text style={[styles.badgeText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ---------------------------------- Chips ---------------------------------- */

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        pressed && { opacity: 0.75 },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={selected ? colors.brand[700] : colors.stone[500]}
        />
      ) : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/* -------------------------------- Segmentado ------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              columns === 2 && styles.segmentHalf,
              selected ? styles.segmentSelected : styles.segmentIdle,
              pressed && { opacity: 0.8 },
            ]}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={15}
                color={selected ? colors.brand[700] : colors.stone[500]}
              />
            ) : null}
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------- Estados ---------------------------------- */

export function LoadingView({ label = "Cargando..." }: { label?: string }) {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateIcon, { backgroundColor: colors.rose[50] }]}>
        <Ionicons name="cloud-offline-outline" size={22} color={colors.rose[600]} />
      </View>
      <Text style={styles.stateTitle}>No pudimos cargar los datos</Text>
      <Text style={[styles.stateText, styles.textCenter]}>{message}</Text>
      {onRetry ? (
        <Button title="Reintentar" icon="refresh" variant="secondary" size="sm" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={22} color={colors.stone[400]} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {description ? (
        <Text style={[styles.stateText, styles.textCenter]}>{description}</Text>
      ) : null}
      {action}
    </View>
  );
}

/* ---------------------------------- KPI ----------------------------------- */

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  tone?: "brand" | "success" | "info" | "warning";
}) {
  const tones = {
    brand: { bg: colors.brand[50], fg: colors.brand[600] },
    success: { bg: colors.emerald[50], fg: colors.emerald[600] },
    info: { bg: colors.sky[50], fg: colors.sky[700] },
    warning: { bg: colors.amber[50], fg: colors.amber[700] },
  } as const;

  return (
    <Card style={styles.kpi}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.kpiIcon, { backgroundColor: tones[tone].bg }]}>
          <Ionicons name={icon} size={16} color={tones[tone].fg} />
        </View>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.kpiHint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

/* ---------------------------------- File ---------------------------------- */

export function ListRow({
  icon,
  title,
  description,
  right,
  onPress,
  danger = false,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.listRow, pressed && onPress ? { opacity: 0.7 } : null]}
    >
      {icon ? (
        <View
          style={[
            styles.listRowIcon,
            { backgroundColor: danger ? colors.rose[50] : colors.stone[100] },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? colors.rose[600] : colors.stone[600]}
          />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={[styles.listRowTitle, danger && { color: colors.rose[600] }]}>{title}</Text>
        {description ? (
          <Text style={styles.listRowDescription} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={17} color={colors.stone[300]} /> : null)}
    </Pressable>
  );
}

export function InfoBanner({
  icon = "information-circle-outline",
  text,
  tone = "neutral",
}: {
  icon?: IconName;
  text: string;
  tone?: "neutral" | "warning" | "success";
}) {
  const tones = {
    neutral: { bg: colors.stone[50], fg: colors.stone[500] },
    warning: { bg: colors.amber[50], fg: colors.amber[700] },
    success: { bg: colors.emerald[50], fg: colors.emerald[700] },
  } as const;

  return (
    <View style={[styles.infoBanner, { backgroundColor: tones[tone].bg }]}>
      <Ionicons name={icon} size={16} color={tones[tone].fg} style={styles.infoIcon} />
      <Text style={[styles.infoText, { color: tones[tone].fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  textCenter: { textAlign: "center" },
  fullWidth: { width: "100%" },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  buttonText: {
    fontFamily: fonts.medium,
    letterSpacing: 0.1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  field: { gap: 6 },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  fieldHint: {
    fontSize: fontSizes.xs,
    color: colors.stone[400],
  },
  fieldError: {
    fontSize: fontSizes.xs,
    color: colors.rose[600],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.brand[500],
    borderWidth: 1.5,
  },
  inputWrapperMultiline: {
    alignItems: "flex-start",
    minHeight: 96,
    paddingVertical: spacing.sm,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.stone[100],
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.stone[900],
    paddingVertical: 10,
    fontFamily: fonts.regular,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  inputMultiline: {
    minHeight: 76,
    textAlignVertical: "top",
    paddingTop: 4,
  },
  leftIcon: {
    marginRight: 2,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.sm,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.stone[900],
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.lg,
    ...shadow,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stone[200],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  sectionDescription: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: colors.white,
    borderColor: colors.stone[200],
  },
  chipSelected: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[400],
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  chipTextSelected: {
    color: colors.brand[700],
  },

  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  segment: {
    flexGrow: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  segmentHalf: {
    flexBasis: "47%",
  },
  segmentIdle: {
    backgroundColor: colors.white,
    borderColor: colors.stone[200],
  },
  segmentSelected: {
    backgroundColor: colors.brand[50],
    borderColor: colors.brand[400],
  },
  segmentText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  segmentTextSelected: {
    color: colors.brand[700],
  },

  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.stone[100],
    marginBottom: 2,
  },
  stateTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[700],
    textAlign: "center",
  },
  stateText: {
    fontSize: fontSizes.sm,
    color: colors.stone[500],
    lineHeight: 19,
  },

  kpi: {
    flexBasis: "47.5%",
    flexGrow: 1,
    padding: spacing.md,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  kpiLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: fonts.medium,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.stone[400],
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    marginTop: spacing.sm,
    fontSize: fontSizes.xxl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
    letterSpacing: -0.4,
  },
  kpiHint: {
    marginTop: 2,
    fontSize: 10.5,
    color: colors.stone[500],
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  listRowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  listRowDescription: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
});
