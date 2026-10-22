import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AppHeader, Screen } from "../components/Screen";
import { Badge, Button, Chip, EmptyState, ErrorView, LoadingView } from "../components/ui";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "../constants";
import { dateRangeFor, formatDateTime, formatMoney, formatNumber } from "../lib/format";
import { qs } from "../lib/query";
import { errorMessage } from "../lib/utils";
import { useAppNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, spacing } from "../theme";
import type { Paginated, SaleSummaryDTO } from "../types";

const presets = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "30 dias" },
  { value: "all", label: "Todas" },
] as const;

type Preset = (typeof presets)[number]["value"];

const paymentTone: Record<PaymentMethod, "success" | "info" | "brand" | "neutral"> = {
  CASH: "success",
  CARD: "info",
  TRANSFER: "brand",
  OTHER: "neutral",
};

export function SalesScreen() {
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const [preset, setPreset] = useState<Preset>("all");

  const query = useInfiniteQuery({
    queryKey: ["sales", preset],
    queryFn: ({ pageParam }) => {
      const range = dateRangeFor(preset);
      return api.get<Paginated<SaleSummaryDTO>>(
        `/sales${qs({ ...range, page: pageParam, pageSize: 20 })}`,
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const sales = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <Screen>
      <AppHeader
        title="Ventas"
        subtitle={`${formatNumber(total)} ${total === 1 ? "venta registrada" : "ventas registradas"}`}
      />

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {presets.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={preset === option.value}
              onPress={() => setPreset(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingView label="Cargando ventas..." />
      ) : isError && sales.length === 0 ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
            sales.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              colors={[colors.brand[600]]}
              tintColor={colors.brand[600]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No hay ventas en el periodo"
              description="Proba con otro rango de fechas o registra una venta."
              action={
                <Button
                  title="Ir a vender"
                  icon="cart-outline"
                  size="sm"
                  onPress={() => navigation.navigate("Pos")}
                />
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.brand[600]}
                style={styles.footerLoader}
              />
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("SaleDetail", { saleId: item.id })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>#{item.number}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>
                    {item.itemCount} {item.itemCount === 1 ? "articulo" : "articulos"}
                  </Text>
                  <Text style={styles.cardDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTotal}>{formatMoney(item.total)}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Badge
                  label={PAYMENT_METHOD_LABELS[item.paymentMethod]}
                  tone={paymentTone[item.paymentMethod]}
                />
                <View style={styles.userInfo}>
                  <Ionicons name="person-outline" size={12} color={colors.stone[400]} />
                  <Text style={styles.userText}>{item.user?.name ?? "Sin usuario"}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.stone[300]} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chips: { gap: spacing.sm },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  listEmpty: { flexGrow: 1 },
  separator: { height: spacing.md },
  footerLoader: { paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  numberBadge: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.brand[700],
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  cardDate: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  cardTotal: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[100],
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userText: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
});
