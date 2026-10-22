import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { BarChart } from "../components/BarChart";
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorView,
  KpiCard,
  LoadingView,
  SectionHeader,
} from "../components/ui";
import { PAYMENT_METHOD_LABELS } from "../constants";
import {
  formatDateTime,
  formatDayShort,
  formatLongDate,
  formatMoney,
  formatNumber,
} from "../lib/format";
import { errorMessage } from "../lib/utils";
import { useAppNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import type { DashboardDTO } from "../types";

export function DashboardScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardDTO>("/dashboard"),
    refetchInterval: 60_000,
  });

  const today = formatLongDate();
  const subtitle = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <Screen>
      <AppHeader
        title="Panel"
        subtitle={subtitle}
        right={
          <HeaderAction
            icon="refresh-outline"
            accessibilityLabel="Actualizar panel"
            onPress={() => void refetch()}
          />
        }
      />

      {isLoading ? (
        <LoadingView label="Cargando resumen..." />
      ) : isError || !data ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              colors={[colors.brand[600]]}
              tintColor={colors.brand[600]}
            />
          }
        >
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Ventas de hoy"
              value={formatNumber(data.today.sales)}
              hint={`${formatNumber(data.today.units)} unidades vendidas`}
              icon="receipt-outline"
            />
            <KpiCard
              label="Ingresos de hoy"
              value={formatMoney(data.today.revenue)}
              hint={`${formatNumber(data.month.sales)} ventas este mes`}
              icon="trending-up-outline"
              tone="success"
            />
            <KpiCard
              label="Productos activos"
              value={formatNumber(data.products)}
              hint={`${formatNumber(data.variants)} variantes en catalogo`}
              icon="shirt-outline"
              tone="info"
            />
            <KpiCard
              label="Requieren reposicion"
              value={formatNumber(data.lowStock)}
              hint={`${formatNumber(data.outOfStock)} variantes sin stock`}
              icon="warning-outline"
              tone="warning"
            />
          </View>

          <Button
            title="Nueva venta"
            icon="cart-outline"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate("Pos")}
          />

          <Card>
            <SectionHeader
              title="Últimos 7 días"
              description={`Valor del stock: ${formatMoney(data.stockValue)}`}
            />
            <BarChart
              data={data.last7Days.map((day) => ({
                label: formatDayShort(day.date),
                value: day.revenue,
              }))}
            />
            <Divider style={styles.chartDivider} />
            <View style={styles.monthRow}>
              <Text style={styles.mutedText}>Este mes</Text>
              <Text style={styles.strongText}>
                {formatMoney(data.month.revenue)} · {formatNumber(data.month.sales)} ventas
              </Text>
            </View>
          </Card>

          <Card style={styles.listCard}>
            <View style={styles.cardHeaderPadding}>
              <SectionHeader
                title="Stock bajo"
                description="Variantes en o por debajo del minimo"
                right={
                  data.lowStockVariants.length > 0 ? (
                    <Pressable
                      onPress={() => navigation.navigate("Products", { lowStock: true })}
                      hitSlop={8}
                    >
                      <Text style={styles.link}>Ver todo</Text>
                    </Pressable>
                  ) : undefined
                }
              />
            </View>

            {data.lowStockVariants.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title="Todo el stock esta en orden"
                description="No hay variantes por debajo del minimo."
              />
            ) : (
              data.lowStockVariants.map((item, index) => (
                <Pressable
                  key={item.variantId}
                  onPress={() => navigation.navigate("ProductForm", { productId: item.productId })}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {item.color} · Talle {item.size} · {item.sku}
                    </Text>
                  </View>
                  <Badge
                    label={item.stock === 0 ? "Sin stock" : `${item.stock} u.`}
                    tone={item.stock === 0 ? "danger" : "warning"}
                  />
                  <Ionicons name="chevron-forward" size={16} color={colors.stone[300]} />
                </Pressable>
              ))
            )}
          </Card>

          <Card style={styles.listCard}>
            <View style={styles.cardHeaderPadding}>
              <SectionHeader
                title="Últimas ventas"
                right={
                  data.recentSales.length > 0 ? (
                    <Pressable onPress={() => navigation.navigate("Sales")} hitSlop={8}>
                      <Text style={styles.link}>Ver historial</Text>
                    </Pressable>
                  ) : undefined
                }
              />
            </View>

            {data.recentSales.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="Todavia no hay ventas"
                description="Cuando registres la primera venta va a aparecer aca."
                action={
                  <Button
                    title="Registrar venta"
                    icon="cart-outline"
                    size="sm"
                    onPress={() => navigation.navigate("Pos")}
                  />
                }
              />
            ) : (
              data.recentSales.map((sale, index) => (
                <Pressable
                  key={sale.id}
                  onPress={() => navigation.navigate("SaleDetail", { saleId: sale.id })}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.saleNumber}>
                    <Text style={styles.saleNumberText}>#{sale.number}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {sale.itemCount} {sale.itemCount === 1 ? "articulo" : "articulos"} ·{" "}
                      {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {formatDateTime(sale.createdAt)} · {sale.user?.name ?? "Sin usuario"}
                    </Text>
                  </View>
                  <Text style={styles.saleTotal}>{formatMoney(sale.total)}</Text>
                </Pressable>
              ))
            )}
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  chartDivider: {
    marginVertical: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  mutedText: {
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  strongText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  cardHeaderPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  link: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.brand[600],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[100],
  },
  rowPressed: {
    backgroundColor: colors.stone[50],
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  saleNumber: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.stone[100],
    alignItems: "center",
    justifyContent: "center",
  },
  saleNumberText: {
    fontSize: 10.5,
    fontFamily: fonts.medium,
    color: colors.stone[500],
  },
  saleTotal: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
});
