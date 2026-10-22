import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import { Badge, Chip, EmptyState, ErrorView, LoadingView, type BadgeTone } from "../components/ui";
import {
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
  type MovementType,
} from "../constants";
import { formatDateTime, formatNumber } from "../lib/format";
import { qs } from "../lib/query";
import { errorMessage } from "../lib/utils";
import { useRootNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, spacing } from "../theme";
import type { MovementDTO, Paginated } from "../types";

const toneByType: Record<MovementType, BadgeTone> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
  SALE: "info",
  RETURN: "violet",
};

const filterOptions: { value: "" | MovementType; label: string }[] = [
  { value: "", label: "Todos" },
  ...MOVEMENT_TYPES.map((type) => ({
    value: type,
    label: MOVEMENT_TYPE_LABELS[type],
  })),
];

export function MovementsScreen() {
  const navigation = useRootNavigation();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<"" | MovementType>("");

  const query = useInfiniteQuery({
    queryKey: ["movements", type],
    queryFn: ({ pageParam }) =>
      api.get<Paginated<MovementDTO>>(
        `/movements${qs({ type: type || undefined, page: pageParam, pageSize: 25 })}`,
      ),
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

  const movements = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <Screen>
      <AppHeader
        title="Movimientos"
        subtitle={`${formatNumber(total)} registros de stock`}
        onBack={() => navigation.goBack()}
        right={
          <HeaderAction
            icon="add"
            accessibilityLabel="Registrar movimiento"
            onPress={() => navigation.navigate("MovementForm")}
          />
        }
      />

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filterOptions.map((option) => (
            <Chip
              key={option.value || "all"}
              label={option.label}
              selected={type === option.value}
              onPress={() => setType(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingView label="Cargando movimientos..." />
      ) : isError && movements.length === 0 ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
            movements.length === 0 && styles.listEmpty,
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
              icon="swap-horizontal-outline"
              title="No hay movimientos"
              description="Los ingresos, ajustes y ventas van a aparecer aca."
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
          renderItem={({ item }) => {
            const positive = item.quantity > 0;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.flex}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.variant.product.name}
                    </Text>
                    <Text style={styles.variantText} numberOfLines={1}>
                      {item.variant.color} · Talle {item.variant.size} · {item.variant.sku}
                    </Text>
                  </View>
                  <Badge label={MOVEMENT_TYPE_LABELS[item.type]} tone={toneByType[item.type]} />
                </View>

                <View style={styles.quantityRow}>
                  <View
                    style={[
                      styles.quantityBadge,
                      {
                        backgroundColor: positive ? colors.emerald[50] : colors.rose[50],
                      },
                    ]}
                  >
                    <Ionicons
                      name={positive ? "arrow-up" : "arrow-down"}
                      size={13}
                      color={positive ? colors.emerald[700] : colors.rose[600]}
                    />
                    <Text
                      style={[
                        styles.quantityText,
                        { color: positive ? colors.emerald[700] : colors.rose[600] },
                      ]}
                    >
                      {positive ? `+${item.quantity}` : item.quantity}
                    </Text>
                  </View>

                  <Text style={styles.stockText}>
                    Stock resultante: <Text style={styles.stockValue}>{item.resultingStock}</Text>
                  </Text>
                </View>

                {item.reason || item.reference ? (
                  <Text style={styles.reasonText} numberOfLines={2}>
                    {item.reason ?? item.reference}
                    {item.reason && item.reference ? ` · ${item.reference}` : ""}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>{formatDateTime(item.createdAt)}</Text>
                  <Text style={styles.footerText}>{item.user?.name ?? "Sin usuario"}</Text>
                </View>
              </View>
            );
          }}
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
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  productName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  variantText: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  quantityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.sm,
  },
  quantityText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  stockText: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  stockValue: {
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  reasonText: {
    fontSize: fontSizes.sm,
    color: colors.stone[600],
    lineHeight: 18,
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
  footerText: {
    fontSize: 10.5,
    color: colors.stone[400],
  },
});
