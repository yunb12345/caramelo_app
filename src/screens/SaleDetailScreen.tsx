import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Share, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { AppHeader, HeaderAction, ScrollScreen } from "../components/Screen";
import { Badge, Card, Divider, ErrorView, LoadingView } from "../components/ui";
import { PAYMENT_METHOD_LABELS } from "../constants";
import { formatDateTime, formatMoney } from "../lib/format";
import { errorMessage } from "../lib/utils";
import { useRootNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import type { SaleDTO } from "../types";

export function SaleDetailScreen({ route }: { route: { params: { saleId: string } } }) {
  const navigation = useRootNavigation();
  const saleId = route.params.saleId;

  const { data: sale, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => api.get<SaleDTO>(`/sales/${saleId}`),
    enabled: Boolean(saleId),
  });

  async function shareSale() {
    if (!sale) return;

    const lines = sale.items.map(
      (item) =>
        `${item.quantity} x ${item.variant.product.name} (${item.variant.color} / ${item.variant.size}) — ${formatMoney(item.subtotal)}`,
    );

    await Share.share({
      message: [
        `Caramelo · Venta #${sale.number}`,
        formatDateTime(sale.createdAt),
        "",
        ...lines,
        "",
        `Subtotal: ${formatMoney(sale.subtotal)}`,
        sale.discount > 0 ? `Descuento: -${formatMoney(sale.discount)}` : "",
        `Total: ${formatMoney(sale.total)}`,
        `Pago: ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}`,
        "",
        "Gracias por tu compra.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return (
    <ScrollScreen edges={["top"]}>
      <AppHeader
        title="Comprobante"
        subtitle={sale ? `Venta #${sale.number}` : undefined}
        onBack={() => navigation.goBack()}
        right={
          sale ? (
            <HeaderAction
              icon="share-social-outline"
              accessibilityLabel="Compartir comprobante"
              onPress={() => void shareSale()}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingView label="Cargando comprobante..." />
      ) : isError || !sale ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <Card style={styles.receipt}>
            <View style={styles.brandBlock}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>C</Text>
              </View>
              <Text style={styles.brandName}>Caramelo</Text>
              <Text style={styles.brandSub}>Comprobante de venta</Text>
            </View>

            <Divider style={styles.dashed} />

            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Venta</Text>
                <Text style={styles.metaValue}>#{sale.number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fecha</Text>
                <Text style={styles.metaValue}>{formatDateTime(sale.createdAt)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Pago</Text>
                <Badge label={PAYMENT_METHOD_LABELS[sale.paymentMethod]} tone="brand" />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Atendido por</Text>
                <Text style={styles.metaValue}>{sale.user?.name ?? "Usuario eliminado"}</Text>
              </View>
            </View>

            <Divider style={styles.dashed} />

            <View style={styles.items}>
              {sale.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.flex}>
                    <Text style={styles.itemName}>{item.variant.product.name}</Text>
                    <Text style={styles.itemVariant}>
                      {item.variant.color} · Talle {item.variant.size}
                    </Text>
                    <Text style={styles.itemSku}>{item.variant.sku}</Text>
                  </View>

                  <View style={styles.itemNumbers}>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} × {formatMoney(item.unitPrice)}
                    </Text>
                    <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatMoney(sale.subtotal)}</Text>
              </View>

              {sale.discount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Descuento</Text>
                  <Text style={[styles.totalValue, { color: colors.rose[600] }]}>
                    -{formatMoney(sale.discount)}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{formatMoney(sale.total)}</Text>
              </View>
            </View>

            {sale.note ? (
              <View style={styles.note}>
                <Ionicons name="document-text-outline" size={15} color={colors.stone[500]} />
                <Text style={styles.noteText}>{sale.note}</Text>
              </View>
            ) : null}

            <Text style={styles.thanks}>Gracias por tu compra</Text>
            <Text style={styles.footerBrand}>Caramelo · Inventario y ventas</Text>
          </Card>

          <View style={styles.shareHint}>
            <Ionicons name="share-social-outline" size={14} color={colors.stone[400]} />
            <Text style={styles.shareHintText}>
              Usa el boton compartir para enviar el comprobante al cliente.
            </Text>
          </View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  receipt: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  brandBlock: {
    alignItems: "center",
    gap: 3,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  logoText: {
    color: colors.white,
    fontSize: 24,
    fontFamily: fonts.bold,
  },
  brandName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  brandSub: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dashed: {
    borderStyle: "dashed",
  },
  metaBlock: { gap: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  metaLabel: {
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  metaValue: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  items: { gap: spacing.md },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  itemName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  itemVariant: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  itemSku: {
    marginTop: 1,
    fontSize: 10,
    color: colors.stone[400],
    fontFamily: fonts.mono,
  },
  itemNumbers: {
    alignItems: "flex-end",
    gap: 3,
  },
  itemQuantity: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  itemSubtotal: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  totals: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.stone[100],
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: fontSizes.md,
    color: colors.stone[500],
  },
  totalValue: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
    paddingTop: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  grandTotalValue: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.stone[50],
    borderRadius: radius.sm,
  },
  noteText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.stone[600],
    lineHeight: 18,
  },
  thanks: {
    textAlign: "center",
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.brand[700],
  },
  footerBrand: {
    textAlign: "center",
    fontSize: 10,
    color: colors.stone[400],
  },
  shareHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  shareHintText: {
    fontSize: fontSizes.xs,
    color: colors.stone[400],
    flexShrink: 1,
  },
});
