import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AppHeader, Screen } from "../components/Screen";
import { useToast } from "../components/Toast";
import {
  Badge,
  Button,
  Card,
  InfoBanner,
  SectionHeader,
  Segmented,
  TextField,
} from "../components/ui";
import { VariantPicker } from "../components/VariantPicker";
import { MANUAL_MOVEMENT_TYPES } from "../constants";
import { parseIntSafe } from "../lib/format";
import { errorMessage } from "../lib/utils";
import { useRootNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, spacing } from "../theme";
import type { MovementDTO, MovementInput, SaleSearchResult } from "../types";

type ManualType = (typeof MANUAL_MOVEMENT_TYPES)[number];

const typeOptions: { value: ManualType; label: string; icon: "arrow-down" | "arrow-up" | "options" }[] = [
  { value: "IN", label: "Ingreso", icon: "arrow-down" },
  { value: "OUT", label: "Egreso", icon: "arrow-up" },
  { value: "ADJUSTMENT", label: "Ajuste", icon: "options" },
];

export function MovementFormScreen({ route }: { route: { params?: { initialVariant?: SaleSearchResult } } }) {
  const navigation = useRootNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<SaleSearchResult | null>(
    route.params?.initialVariant ?? null,
  );
  const [type, setType] = useState<ManualType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const quantityValue = parseIntSafe(quantity, 0);
  const currentStock = selected?.stock ?? 0;
  const resultingStock =
    type === "IN"
      ? currentStock + quantityValue
      : type === "OUT"
        ? currentStock - quantityValue
        : quantityValue;

  const delta = resultingStock - currentStock;

  const createMovement = useMutation({
    mutationFn: () =>
      api.post<MovementDTO>("/movements", {
        variantId: selected?.variantId ?? "",
        type,
        quantity: quantityValue,
        reason: reason.trim() || null,
        reference: reference.trim() || null,
      } satisfies MovementInput),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Movimiento registrado", "success");
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["variant-search"] });
      navigation.goBack();
    },
    onError: (error) => showToast(errorMessage(error), "error"),
  });

  function handleSubmit() {
    if (!selected) {
      showToast("Selecciona una variante", "error");
      return;
    }

    if (quantity.trim() === "" || quantityValue < 0) {
      showToast("Ingresa una cantidad valida", "error");
      return;
    }

    if (type !== "ADJUSTMENT" && quantityValue === 0) {
      showToast("La cantidad debe ser mayor a cero", "error");
      return;
    }

    if (type === "ADJUSTMENT" && delta === 0) {
      showToast("El ajuste no modifica el stock actual", "error");
      return;
    }

    if (resultingStock < 0) {
      showToast("El stock no puede quedar en negativo", "error");
      return;
    }

    createMovement.mutate();
  }

  const quantityLabel =
    type === "ADJUSTMENT"
      ? "Stock final real"
      : type === "IN"
        ? "Cantidad a ingresar"
        : "Cantidad a egresar";

  return (
    <Screen>
      <AppHeader
        title="Registrar movimiento"
        subtitle="Se guarda con tu usuario"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.section}>
            <SectionHeader
              title="Variante"
              description="Busca por nombre, SKU o codigo de barras"
            />
            <VariantPicker selected={selected} onSelect={setSelected} />
          </Card>

          <Card style={styles.section}>
            <SectionHeader title="Tipo de movimiento" />
            <Segmented options={typeOptions} value={type} onChange={setType} columns={3} />

            <View style={styles.balance}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Stock actual</Text>
                <Text style={styles.balanceValue}>{currentStock}</Text>
              </View>
              <View style={styles.balanceArrow}>
                <Text style={[styles.delta, { color: delta >= 0 ? colors.emerald[700] : colors.rose[600] }]}>
                  {delta > 0 ? `+${delta}` : delta < 0 ? delta : "0"}
                </Text>
                <Text style={styles.balanceLabel}>diferencia</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Stock final</Text>
                <Text
                  style={[
                    styles.balanceValue,
                    { color: resultingStock < 0 ? colors.rose[600] : colors.stone[900] },
                  ]}
                >
                  {resultingStock}
                </Text>
              </View>
            </View>

            <TextField
              label={quantityLabel}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="0"
              hint={
                type === "ADJUSTMENT"
                  ? "Se registra la diferencia contra el stock actual"
                  : type === "IN"
                    ? "Suma unidades al stock"
                    : "Resta unidades del stock"
              }
            />

            <TextField
              label="Motivo"
              value={reason}
              onChangeText={setReason}
              placeholder="Reposicion, rotura, recuento..."
              maxLength={200}
            />

            <TextField
              label="Referencia"
              value={reference}
              onChangeText={setReference}
              placeholder="Factura, remito (opcional)"
              maxLength={120}
            />

            {selected ? (
              <View style={styles.variantInfo}>
                <Badge
                  label={selected.stock === 0 ? "Sin stock" : `${selected.stock} u. disponibles`}
                  tone={selected.stock === 0 ? "danger" : "neutral"}
                />
                <Text style={styles.variantInfoText} numberOfLines={1}>
                  {selected.productName} · {selected.color} / {selected.size}
                </Text>
              </View>
            ) : null}

            <InfoBanner
              icon={type === "ADJUSTMENT" ? "options-outline" : "information-circle-outline"}
              tone={resultingStock < 0 ? "warning" : "neutral"}
              text={
                type === "ADJUSTMENT"
                  ? "El ajuste fija el stock real contado. La diferencia queda en el historial."
                  : type === "IN"
                    ? "El ingreso suma unidades al stock de la variante."
                    : "El egreso resta unidades. No se permite dejar el stock en negativo."
              }
            />
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            title="Registrar movimiento"
            icon="checkmark"
            size="lg"
            fullWidth
            loading={createMovement.isPending}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  section: { gap: spacing.md },
  balance: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.stone[50],
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  balanceLabel: {
    fontSize: 10,
    color: colors.stone[500],
    textAlign: "center",
  },
  balanceValue: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  balanceArrow: {
    alignItems: "center",
    gap: 1,
  },
  delta: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
  },
  variantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  variantInfoText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[200],
    backgroundColor: colors.white,
  },
});
