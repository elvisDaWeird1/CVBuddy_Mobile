import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontSizes, fontWeights, radii, shadows, spacing } from "@/src/theme";

type TextVariant =
  | "display"
  | "title"
  | "sectionTitle"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "eyebrow";

type AppTextProps = TextProps & {
  children: ReactNode;
  variant?: TextVariant;
  color?: string;
};

export function AppText({ children, variant = "body", color, selectable = true, style, ...props }: AppTextProps) {
  return (
    <Text
      selectable={selectable}
      style={[styles.text, textVariants[variant], color ? { color } : null, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

type AppScreenProps = ViewProps & {
  children: ReactNode;
};

export function AppScreen({ children, style, ...props }: AppScreenProps) {
  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={[styles.screen, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}

type ScreenScrollViewProps = Pick<
  ScrollViewProps,
  "contentContainerStyle" | "keyboardShouldPersistTaps" | "refreshControl" | "showsVerticalScrollIndicator"
> & {
  children: ReactNode;
};

export function ScreenScrollView({
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  ...props
}: ScreenScrollViewProps) {
  return (
    <AppScreen>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.page, contentContainerStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        style={styles.scroll}
        {...props}
      >
        {children}
      </ScrollView>
    </AppScreen>
  );
}

export function AppHeader({ title, subtitle, action, inset = true }: { title: string; subtitle?: string; action?: ReactNode; inset?: boolean }) {
  return (
    <View style={[styles.header, !inset ? styles.headerFlush : null]}>
      <View style={styles.headerCopy}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText color={colors.textSecondary}>{subtitle}</AppText> : null}
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  small?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const buttonPalette: Record<ButtonVariant, { background: string; border: string; text: string; pressed: string }> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.textOnPrimary,
    pressed: colors.primaryPressed
  },
  secondary: {
    background: colors.surfaceSecondary,
    border: colors.border,
    text: colors.textPrimary,
    pressed: colors.surfaceElevated
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: colors.textSecondary,
    pressed: colors.surfaceSecondary
  },
  danger: {
    background: colors.errorBackground,
    border: colors.error,
    text: colors.error,
    pressed: colors.surfaceElevated
  }
};

export function AppButton({
  title,
  disabled = false,
  loading = false,
  variant = "primary",
  small = false,
  fullWidth = true,
  style,
  ...props
}: ButtonProps) {
  const palette = buttonPalette[variant];
  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: unavailable }}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        small ? styles.buttonSmall : null,
        fullWidth && !small ? styles.buttonFullWidth : null,
        {
          backgroundColor: unavailable ? colors.disabledBackground : pressed ? palette.pressed : palette.background,
          borderColor: unavailable ? colors.borderSubtle : palette.border
        },
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.disabledText} />
      ) : (
        <AppText
          color={unavailable ? colors.disabledText : palette.text}
          selectable={false}
          style={small ? styles.buttonTextSmall : styles.buttonText}
          variant="bodyStrong"
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

type AppInputProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | null;
  hint?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppInput({
  label,
  error,
  hint,
  onBlur,
  onFocus,
  style,
  containerStyle,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <AppText selectable={false} variant="label">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          props.editable === false ? styles.inputDisabled : null,
          style
        ]}
        {...props}
      />
      {error ? (
        <AppText accessibilityRole="alert" color={colors.error} style={styles.inputHelp} variant="caption">
          {error}
        </AppText>
      ) : hint ? (
        <AppText color={colors.textMuted} style={styles.inputHelp} variant="caption">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

type AppCardProps = ViewProps & {
  children: ReactNode;
  elevated?: boolean;
};

export function AppCard({ children, elevated = false, style, ...props }: AppCardProps) {
  return (
    <View style={[styles.card, elevated ? styles.cardElevated : null, style]} {...props}>
      {children}
    </View>
  );
}

type StatusTone = "neutral" | "primary" | "success" | "warning";

const statusPalette: Record<StatusTone, { background: string; text: string }> = {
  neutral: { background: colors.surfaceSecondary, text: colors.textSecondary },
  primary: { background: colors.primarySoft, text: colors.primary },
  success: { background: colors.successBackground, text: colors.success },
  warning: { background: colors.warningBackground, text: colors.warning }
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  const palette = statusPalette[tone];

  return (
    <View style={[styles.statusPill, { backgroundColor: palette.background }]}>
      <AppText color={palette.text} selectable={false} style={styles.statusText} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandMark, compact ? styles.brandMarkCompact : null]}>
      <AppText color={colors.textOnPrimary} selectable={false} style={compact ? styles.brandTextCompact : styles.brandText} variant="bodyStrong">
        CV
      </AppText>
    </View>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={styles.errorMessage}>
      <View style={styles.errorDot} />
      <AppText accessibilityRole="alert" color={colors.error} style={styles.errorMessageText} variant="caption">
        {message}
      </AppText>
    </View>
  );
}

export function LoadingState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <View style={[styles.state, compact ? styles.stateCompact : null]}>
      <ActivityIndicator color={colors.primary} size={compact ? "small" : "large"} />
      <AppText color={colors.textSecondary}>{message}</AppText>
    </View>
  );
}

export function LoadingView({ message }: { message: string }) {
  return (
    <AppScreen>
      <View style={styles.fullState}>
        <BrandMark />
        <LoadingState message={message} />
      </View>
    </AppScreen>
  );
}

type EmptyStateProps = {
  title: string;
  message: string;
  symbol?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, symbol = "◇", actionTitle, onAction }: EmptyStateProps) {
  return (
    <AppCard style={styles.stateCard}>
      <View style={styles.stateSymbol}>
        <AppText color={colors.primary} selectable={false} style={styles.stateSymbolText}>
          {symbol}
        </AppText>
      </View>
      <AppText style={styles.stateTitle} variant="sectionTitle">
        {title}
      </AppText>
      <AppText color={colors.textSecondary} style={styles.stateMessage}>
        {message}
      </AppText>
      {actionTitle && onAction ? <AppButton onPress={onAction} title={actionTitle} /> : null}
    </AppCard>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <AppCard style={styles.stateCard}>
      <View style={[styles.stateSymbol, styles.errorStateSymbol]}>
        <AppText color={colors.error} selectable={false} style={styles.stateSymbolText}>
          !
        </AppText>
      </View>
      <AppText style={styles.stateTitle} variant="sectionTitle">
        Something went wrong
      </AppText>
      <AppText color={colors.textSecondary} style={styles.stateMessage}>
        {message}
      </AppText>
      <AppButton onPress={onRetry} title="Try again" variant="secondary" />
    </AppCard>
  );
}

const textVariants = StyleSheet.create<Record<TextVariant, TextStyle>>({
  display: { fontSize: fontSizes.display, fontWeight: fontWeights.heavy, letterSpacing: -1.1, lineHeight: 43 },
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.heavy, letterSpacing: -0.5, lineHeight: 34 },
  sectionTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, letterSpacing: -0.2, lineHeight: 28 },
  body: { fontSize: fontSizes.base, fontWeight: fontWeights.regular, lineHeight: 24 },
  bodyStrong: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, lineHeight: 24 },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, lineHeight: 20 },
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium, lineHeight: 18 },
  eyebrow: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, letterSpacing: 1.5, lineHeight: 18, textTransform: "uppercase" }
});

const styles = StyleSheet.create({
  text: { color: colors.textPrimary },
  screen: { backgroundColor: colors.background, flex: 1 },
  scroll: { backgroundColor: colors.background, flex: 1 },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    gap: spacing.xl,
    maxWidth: 720,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    width: "100%"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  headerAction: { flexShrink: 0 },
  headerFlush: { paddingHorizontal: 0, paddingVertical: 0 },
  button: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  buttonSmall: { minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  buttonFullWidth: { width: "100%" },
  buttonText: { letterSpacing: 0.1 },
  buttonTextSmall: { fontSize: fontSizes.sm, lineHeight: 20 },
  inputGroup: { gap: spacing.sm },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderCurve: "continuous",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    lineHeight: 22,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  inputFocused: { backgroundColor: colors.surface, borderColor: colors.inputFocus, boxShadow: shadows.focus },
  inputError: { borderColor: colors.error },
  inputDisabled: { backgroundColor: colors.disabledBackground, color: colors.disabledText },
  inputHelp: { paddingHorizontal: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderSubtle,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl
  },
  cardElevated: { backgroundColor: colors.surfaceSecondary, boxShadow: shadows.card },
  statusPill: {
    alignSelf: "flex-start",
    borderCurve: "continuous",
    borderRadius: radii.pill,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: 5
  },
  statusText: { fontWeight: fontWeights.bold, textTransform: "capitalize" },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    boxShadow: shadows.brand,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  brandMarkCompact: { borderRadius: radii.md, height: 40, width: 40 },
  brandText: { fontSize: 18, letterSpacing: -0.5 },
  brandTextCompact: { fontSize: 13, letterSpacing: -0.3 },
  errorMessage: {
    alignItems: "flex-start",
    backgroundColor: colors.errorBackground,
    borderColor: colors.error,
    borderCurve: "continuous",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  errorDot: { backgroundColor: colors.error, borderRadius: radii.pill, height: 7, marginTop: 5, width: 7 },
  errorMessageText: { flex: 1 },
  state: { alignItems: "center", gap: spacing.md, justifyContent: "center", padding: spacing.xxl },
  stateCompact: { flexDirection: "row", padding: spacing.lg },
  fullState: { alignItems: "center", flex: 1, gap: spacing.lg, justifyContent: "center", padding: spacing.xxl },
  stateCard: { alignItems: "center", gap: spacing.md, padding: spacing.xxl, width: "100%" },
  stateSymbol: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  errorStateSymbol: { backgroundColor: colors.errorBackground },
  stateSymbolText: { fontSize: 24, fontWeight: fontWeights.heavy, lineHeight: 28 },
  stateTitle: { textAlign: "center" },
  stateMessage: { maxWidth: 420, paddingBottom: spacing.sm, textAlign: "center" }
});
