import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import { Button, IconButton } from "./ui";

const BARCODE_TYPES = [
  "qr",
  "ean13",
  "ean8",
  "code128",
  "code39",
  "code93",
  "upc_a",
  "upc_e",
  "itf14",
  "codabar",
] as const;

export function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      scannedRef.current = false;
      setTorch(false);
      return;
    }

    if (permission && !permission.granted && permission.canAskAgain && permission.status === "undetermined") {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  function handleScan(result: BarcodeScanningResult) {
    if (scannedRef.current) return;
    const code = result.data?.trim();
    if (!code) return;

    scannedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScanned(code);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={styles.permissionBox}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={30} color={colors.brand[600]} />
            </View>
            <Text style={styles.permissionTitle}>Permiso de camara</Text>
            <Text style={styles.permissionText}>
              Necesitamos la camara para escanear codigos de barras de tus productos.
            </Text>
            <Button
              title={permission?.canAskAgain === false ? "Abrir ajustes" : "Permitir camara"}
              icon={permission?.canAskAgain === false ? "settings-outline" : "camera"}
              onPress={() => {
                if (permission?.canAskAgain === false) void Linking.openSettings();
                else void requestPermission();
              }}
            />
          </View>
        )}

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <IconButton
            icon="close"
            accessibilityLabel="Cerrar escaner"
            color={colors.white}
            background="rgba(0,0,0,0.4)"
            onPress={onClose}
          />
          <Text style={styles.topTitle}>Escanear codigo</Text>
          <IconButton
            icon={torch ? "flash" : "flash-off"}
            accessibilityLabel="Linterna"
            color={colors.white}
            background="rgba(0,0,0,0.4)"
            onPress={() => setTorch((value) => !value)}
          />
        </View>

        {permission?.granted ? (
          <View pointerEvents="none" style={styles.frameWrapper}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.hint}>Apunta al codigo de barras del producto</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  topTitle: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
  },
  frameWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  frame: {
    width: "72%",
    maxWidth: 320,
    aspectRatio: 1.55,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  corner: {
    position: "absolute",
    width: 26,
    height: 26,
    borderColor: colors.brand[300],
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radius.md,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radius.md,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radius.md,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radius.md,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 14,
    right: 14,
    height: 1.5,
    backgroundColor: colors.brand[300],
    opacity: 0.8,
  },
  hint: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    opacity: 0.9,
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitle: {
    color: colors.white,
    fontSize: fontSizes.xl,
    fontFamily: fonts.medium,
  },
  permissionText: {
    color: colors.stone[300],
    fontSize: fontSizes.md,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
});
