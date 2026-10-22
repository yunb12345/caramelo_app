import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { checkHealth, getDefaultApiUrl, normalizeApiUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ModalSheet } from "../components/ModalSheet";
import { AppHeader, ScrollScreen } from "../components/Screen";
import { useToast } from "../components/Toast";
import {
  Button,
  Card,
  InfoBanner,
  ListRow,
  SectionHeader,
  TextField,
} from "../components/ui";
import { APP_NAME, APP_VERSION } from "../constants";
import { errorMessage } from "../lib/utils";
import { useAppNavigation, useRootNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";

export function MoreScreen() {
  const { user, logout, apiUrl, updateApiUrl } = useAuth();
  const navigation = useAppNavigation();
  const rootNavigation = useRootNavigation();
  const { showToast } = useToast();

  const [serverOpen, setServerOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  function openServer() {
    setServerUrl(apiUrl);
    setTestResult(null);
    setServerOpen(true);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      await checkHealth(serverUrl);
      setTestResult({ ok: true, text: "Conexion exitosa. La API esta respondiendo." });
    } catch (error) {
      setTestResult({ ok: false, text: errorMessage(error) });
    } finally {
      setTesting(false);
    }
  }

  async function saveServer() {
    setSaving(true);

    try {
      const next = normalizeApiUrl(serverUrl);
      const changed = next !== apiUrl;
      await updateApiUrl(next);
      setServerOpen(false);
      showToast(
        changed ? "Servidor actualizado. Inicia sesion de nuevo." : "Servidor sin cambios",
        "success",
      );
    } catch (error) {
      showToast(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert("Cerrar sesion", "Seguro que queres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  }

  const initials = (user?.name ?? "C")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollScreen>
      <AppHeader title="Más" subtitle="Cuenta, ajustes y herramientas" />

      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name ?? "Usuario"}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email ?? ""}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.emerald[700]} />
          <Text style={styles.roleText}>Admin</Text>
        </View>
      </Card>

      <Card style={styles.menuCard}>
        <ListRow
          icon="swap-horizontal-outline"
          title="Movimientos"
          description="Ingresos, egresos y ajustes de stock"
          onPress={() => rootNavigation.navigate("Movements")}
        />
        <View style={styles.rowDivider} />
        <ListRow
          icon="pricetags-outline"
          title="Categorias"
          description="Agrupa los productos del catalogo"
          onPress={() => rootNavigation.navigate("Categories")}
        />
        <View style={styles.rowDivider} />
        <ListRow
          icon="server-outline"
          title="Servidor"
          description={apiUrl.replace(/^https?:\/\//, "")}
          onPress={openServer}
        />
      </Card>

      <Card style={styles.menuCard}>
        <ListRow
          icon="log-out-outline"
          title="Cerrar sesion"
          description="Salir de tu cuenta en este dispositivo"
          onPress={handleLogout}
          danger
          right={<View />}
        />
      </Card>

      <Card>
        <SectionHeader title="Acerca de" />
        <View style={styles.aboutRow}>
          <View style={styles.aboutLogo}>
            <Text style={styles.aboutLogoText}>C</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.aboutTitle}>{APP_NAME}</Text>
            <Text style={styles.aboutText}>Inventario y ventas · Version {APP_VERSION}</Text>
            <Text style={styles.aboutText}>Aplicacion movil para Android con React Native.</Text>
          </View>
        </View>

        <InfoBanner
          icon="information-circle-outline"
          text="Este cliente trabaja contra la API de Caramelo. Necesita conexion al servidor para consultar y registrar datos."
        />
      </Card>

      <Text style={styles.footer}>Caramelo · Sistema interno de gestion</Text>

      <ModalSheet
        visible={serverOpen}
        onClose={() => setServerOpen(false)}
        title="Servidor"
        description="Direccion de la API que usa la aplicacion"
        footer={
          <>
            <Button title="Cancelar" variant="secondary" onPress={() => setServerOpen(false)} />
            <Button
              title="Guardar"
              icon="checkmark"
              loading={saving}
              onPress={() => void saveServer()}
              style={styles.flex}
            />
          </>
        }
      >
        <TextField
          label="URL de la API"
          value={serverUrl}
          onChangeText={(value) => {
            setServerUrl(value);
            setTestResult(null);
          }}
          placeholder="http://192.168.0.10:3001"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="link-outline"
          hint="La app agrega /api automaticamente si no lo incluis."
        />

        <View style={styles.serverActions}>
          <Button
            title="Probar conexion"
            icon="pulse-outline"
            variant="secondary"
            size="sm"
            loading={testing}
            onPress={() => void testConnection()}
            style={styles.flex}
          />
          <Button
            title="Detectada"
            variant="ghost"
            size="sm"
            onPress={() => {
              setServerUrl(getDefaultApiUrl());
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

        <InfoBanner
          icon="bulb-outline"
          text="En un emulador Android usa 10.0.2.2. En un celular fisico, la IP de la computadora en la misma red WiFi."
        />
      </ModalSheet>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
  },
  profileName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  profileEmail: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.emerald[50],
  },
  roleText: {
    fontSize: 10.5,
    fontFamily: fonts.medium,
    color: colors.emerald[700],
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.stone[100],
    marginLeft: spacing.lg + 38 + spacing.md,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  aboutLogo: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  aboutLogoText: {
    color: colors.brand[600],
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  aboutTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  aboutText: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  serverActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footer: {
    textAlign: "center",
    fontSize: fontSizes.xs,
    color: colors.stone[400],
  },
});
