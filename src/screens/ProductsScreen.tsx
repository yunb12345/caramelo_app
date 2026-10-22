import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRoute, type RouteProp } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
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
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorView,
  LoadingView,
  SearchField,
} from "../components/ui";
import { formatMoney, formatNumber } from "../lib/format";
import { qs } from "../lib/query";
import { errorMessage } from "../lib/utils";
import { useAppNavigation, type TabParamList } from "../navigation/types";
import { colors, fontSizes, fonts, spacing } from "../theme";
import type { CategoryDTO, Paginated, ProductDTO } from "../types";

export function ProductsScreen() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<TabParamList, "Products">>();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStock, setLowStock] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.lowStock) {
        setLowStock(true);
        navigation.setParams({ lowStock: undefined });
      }
    }, [route.params?.lowStock, navigation]),
  );

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/categories"),
  });

  const productsQuery = useInfiniteQuery({
    queryKey: ["products", debounced, categoryId, lowStock],
    queryFn: ({ pageParam }) =>
      api.get<Paginated<ProductDTO>>(
        `/products${qs({
          search: debounced,
          categoryId,
          lowStock: lowStock || undefined,
          page: pageParam,
          pageSize: 15,
        })}`,
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
  } = productsQuery;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const products = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <Screen>
      <AppHeader
        title="Productos"
        subtitle={`${formatNumber(total)} ${total === 1 ? "producto" : "productos"} en catalogo`}
        right={
          <HeaderAction
            icon="add"
            accessibilityLabel="Nuevo producto"
            onPress={() => navigation.navigate("ProductForm")}
          />
        }
      />

      <View style={styles.filters}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Nombre, marca o descripcion..."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todas" selected={categoryId === ""} onPress={() => setCategoryId("")} />
          {categories?.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.lowStockRow}>
          <Chip
            label="Solo stock bajo"
            icon="alert-circle-outline"
            selected={lowStock}
            onPress={() => setLowStock((value) => !value)}
          />
          {isRefetching ? (
            <ActivityIndicator size="small" color={colors.brand[600]} />
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <LoadingView label="Cargando productos..." />
      ) : isError && products.length === 0 ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
            products.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
              icon="shirt-outline"
              title="No hay productos"
              description="Proba con otro filtro o crea tu primer producto."
              action={
                <Button
                  title="Crear producto"
                  icon="add"
                  size="sm"
                  onPress={() => navigation.navigate("ProductForm")}
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
            <ProductCard
              product={item}
              onPress={() => navigation.navigate("ProductForm", { productId: item.id })}
            />
          )}
        />
      )}
    </Screen>
  );
}

function ProductCard({ product, onPress }: { product: ProductDTO; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}
    >
      <View style={styles.productHeader}>
        <View style={styles.flex}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.productMetaRow}>
            {product.category ? (
              <>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: product.category.color ?? colors.stone[400] },
                  ]}
                />
                <Text style={styles.productMeta} numberOfLines={1}>
                  {product.category.name}
                  {product.brand ? ` · ${product.brand}` : ""}
                </Text>
              </>
            ) : (
              <Text style={styles.productMeta} numberOfLines={1}>
                {product.brand ?? "Sin categoria"}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.productPrice}>{formatMoney(product.basePrice)}</Text>
      </View>

      <View style={styles.productFooter}>
        <View style={styles.productStats}>
          <View style={styles.stat}>
            <Ionicons name="layers-outline" size={13} color={colors.stone[400]} />
            <Text style={styles.statText}>{product.variants.length} variantes</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cube-outline" size={13} color={colors.stone[400]} />
            <Text
              style={[
                styles.statText,
                product.totalStock === 0 && { color: colors.rose[600], fontFamily: fonts.medium },
              ]}
            >
              {product.totalStock} en stock
            </Text>
          </View>
        </View>

        <View style={styles.productBadges}>
          {product.lowStock ? (
            <Badge label="Reponer" tone="warning" icon="warning" />
          ) : null}
          {!product.active ? <Badge label="Inactivo" tone="neutral" /> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.stone[300]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 34,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  listEmpty: { flexGrow: 1 },
  separator: { height: spacing.md },
  footerLoader: { paddingVertical: spacing.lg },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.8 },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  productName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  productMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  productMeta: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  productPrice: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  productStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  productBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
