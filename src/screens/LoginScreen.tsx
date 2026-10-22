import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkHealth, getDefaultApiUrl, normalizeApiUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Button, InfoBanner, TextField } from "../components/ui";
import { APP_NAME } from "../constants";
import { errorMessage } from "../lib/utils";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";

export function LoginScreen() {
  const { login, apiUrl, updateApiUrl } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(apiUrl);
  const [serverOpen, setServerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setApiUrlInput(apiUrl);
  }, [apiUrl]);

  async function handleSubmit() {
    if (loading) return;

    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }

    if (!password) {
      setError("Ingresa tu contrasena");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextUrl = normalizeApiUrl(apiUrlInput);
      if (nextUrl !== apiUrl) await updateApiUrl(nextUrl);
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      await checkHealth(apiUrlInput);
      setTestResult({ ok: true, text: "Conexion exitosa. La API esta respondiendo." });
    } catch (err) {
      setTestResult({ ok: false, text: errorMessage(err) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
          <View style={styles.hero}>
            <View style={styles.blobLarge} />
            <View style={styles.blobSmall} />

            <SafeAreaView edges={["top"]} style={styles.heroContent}>
              <View style={styles.brandRow}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>C</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>{APP_NAME}</Text>
                  <Text style={styles.brandSub}>Inventario y ventas</Text>
                </View>
              </View>

              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Todo tu local de ropa, ordenado.</Text>
                <Text style={styles.heroDescription}>
                  Controla stock por talle y color, vende en segundos y entérate al instante
                  cuando hay que reponer.
                </Text>
              </View>

              <View style={styles.heroChips}>
                <View style={styles.heroChip}>
                  <Ionicons name="shirt-outline" size={14} color={colors.brand[100]} />
                  <Text style={styles.heroChipText}>Variantes y stock</Text>
                </View>
                <View style={styles.heroChip}>
                  <Ionicons name="scan-outline" size={14} color={colors.brand[100]} />
                  <Text style={styles.heroChipText}>Lector de codigos</Text>
                </View>
              </View>
            </SafeAreaView>
          </View>

          <View style={styles.formWrapper}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Iniciar sesion</Text>
              <Text style={styles.formSubtitle}>
                Ingresa con tu usuario para administrar el local.
              </Text>

              <View style={styles.fields}>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError(null);
                  }}
                  placeholder="admin@caramelo.local"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  leftIcon="mail-outline"
                  returnKeyType="next"
                />

                <TextField
                  label="Contrasena"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  placeholder="Tu contrasena"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  leftIcon="lock-closed-outline"
                  returnKeyType="go"
                  onSubmitEditing={() => void handleSubmit()}
                  right={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                      }
                      hitSlop={8}
                      onPress={() => setShowPassword((value) => !value)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={19}
                        color={colors.stone[400]}
                      />
                    </Pressable>
                  }
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.rose[700]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                title="Entrar"
                icon="log-in-outline"
                size="lg"
                fullWidth
                loading={loading}
                onPress={() => void handleSubmit()}
              />

              <Pressable
                onPress={() => setServerOpen((value) => !value)}
                style={styles.serverToggle}
                accessibilityRole="button"
              >
                <Ionicons name="server-outline" size={15} color={colors.stone[500]} />
                <Text style={styles.serverToggleText}>
                  Servidor: {apiUrl.replace(/^https?:\/\//, "")}
                </Text>
                <Ionicons
                  name={serverOpen ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={colors.stone[400]}
                />
              </Pressable>

              {serverOpen ? (
                <View style={styles.serverBox}>
                  <TextField
                    label="Direccion de la API"
                    value={apiUrlInput}
                    onChangeText={(value) => {
                      setApiUrlInput(value);
                      setTestResult(null);
                    }}
                    hint="En un celular usa la IP de la computadora, por ejemplo http://192.168.0.10:3001"
                    placeholder="http://192.168.0.10:3001"
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <View style={styles.serverActions}>
                    <Button
                      title="Probar conexion"
                      icon="pulse-outline"
                      variant="secondary"
                      size="sm"
                      loading={testing}
                      onPress={() => void handleTestConnection()}
                      style={styles.flex}
                    />
                    <Button
                      title="Detectada"
                      variant="ghost"
                      size="sm"
                      onPress={() => {
                        const detected = getDefaultApiUrl();
                        setApiUrlInput(detected);
                        setTestResult(null);
                      }}
                    />
                  </View>

                  {testResult ? (
                    <InfoBanner
                      icon={testResult.ok ? "checkmark-circle" : "alert-circle"}
                      tone={testResult.ok ? "success" : "warning"}
                      text={testResult.text}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>

            <Text style={styles.footer}>
              Caramelo · Sistema interno de gestion{"\n"}
              Las credenciales iniciales estan en apps/api/.env
            </Text>
          </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.stone[100] },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: colors.brand[800],
    paddingBottom: 48,
    overflow: "hidden",
  },
  blobLarge: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.brand[600],
    opacity: 0.55,
    right: -100,
    top: -90,
  },
  blobSmall: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.brand[500],
    opacity: 0.35,
    left: -80,
    bottom: -90,
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xxl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  brandName: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
  },
  brandSub: {
    color: colors.brand[200],
    fontSize: fontSizes.sm,
  },
  heroText: { gap: spacing.sm },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.medium,
    letterSpacing: -0.6,
  },
  heroDescription: {
    color: colors.brand[100],
    fontSize: fontSizes.md,
    lineHeight: 21,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroChipText: {
    color: colors.brand[50],
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },
  formWrapper: {
    marginTop: -32,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.xl,
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
    letterSpacing: -0.4,
  },
  formSubtitle: {
    marginTop: -spacing.md,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  fields: { gap: spacing.lg },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rose[200],
    backgroundColor: colors.rose[50],
  },
  errorText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.rose[700],
    lineHeight: 18,
  },
  serverToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: spacing.xs,
  },
  serverToggleText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  serverBox: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.stone[50],
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  serverActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: "center",
    fontSize: fontSizes.xs,
    color: colors.stone[400],
    lineHeight: 17,
  },
});
