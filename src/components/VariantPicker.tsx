import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { formatMoney } from "../lib/format";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import type { SaleSearchResult } from "../types";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { Badge, IconButton, InfoBanner, SearchField } from "./ui";

export function VariantPicker({
  selected,
  onSelect,
  autoFocus = false,
}: {
  selected: SaleSearchResult | null;
  onSelect: (variant: SaleSearchResult | null) => void;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["variant-search", "picker", debounced],
    queryFn: () =>
      api.get<SaleSearchResult[]>(`/variants/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length > 0 && !selected,
  });

  if (selected) {
    return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName} numberOfLines={1}>
            {selected.productName}
          </Text>
          <Text style={styles.selectedVariant}>
            {selected.color} · Talle {selected.size} · {selected.sku}
          </Text>
          <View style={styles.selectedMeta}>
            <Badge
              label={selected.stock === 0 ? "Sin stock" : `${selected.stock} u.`}
              tone={selected.stock === 0 ? "danger" : selected.stock <= 3 ? "warning" : "neutral"}
            />
            <Text style={styles.price}>{formatMoney(selected.price)}</Text>
          </View>
        </View>

        <IconButton
          icon="swap-horizontal"
          accessibilityLabel="Cambiar variante"
          background={colors.white}
          color={colors.brand[700]}
          onPress={() => {
            onSelect(null);
            setTerm("");
          }}
          style={styles.changeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchField
        value={term}
        onChangeText={setTerm}
        placeholder="Producto, SKU o codigo..."
        autoFocus={autoFocus}
        rightAccessory={
          <IconButton
            icon="scan-outline"
            accessibilityLabel="Escanear codigo de barras"
            color={colors.brand[700]}
            background={colors.brand[50]}
            onPress={() => setScannerOpen(true)}
          />
        }
      />

      {debounced.length === 0 ? (
        <InfoBanner
          icon="search-outline"
          text="Busca por nombre, SKU, color o escanea un codigo de barras."
        />
      ) : (
        <View style={styles.results}>
          {isFetching && !results ? (
            <Text style={styles.status}>Buscando...</Text>
          ) : results && results.length === 0 ? (
            <Text style={styles.status}>No encontramos variantes con ese criterio.</Text>
          ) : (
            results?.map((item) => (
              <Pressable
                key={item.variantId}
                onPress={() => {
                  onSelect(item);
                  setTerm("");
                }}
                style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.resultVariant} numberOfLines={1}>
                    {item.color} · Talle {item.size} · {item.sku}
                  </Text>
                </View>

                <View style={styles.resultMeta}>
                  <Badge
                    label={item.stock === 0 ? "Sin stock" : `${item.stock} u.`}
                    tone={item.stock === 0 ? "danger" : item.stock <= 3 ? "warning" : "neutral"}
                  />
                  <Text style={styles.resultPrice}>{formatMoney(item.price)}</Text>
                  <Ionicons name="add-circle" size={22} color={colors.brand[600]} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(code) => {
          setTerm(code);
          setDebounced(code);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  selectedInfo: { flex: 1, gap: 2 },
  selectedName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  selectedVariant: {
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  selectedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 3,
  },
  price: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  changeButton: {
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  results: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  status: {
    padding: spacing.lg,
    textAlign: "center",
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stone[100],
  },
  resultRowPressed: {
    backgroundColor: colors.stone[50],
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  resultVariant: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  resultMeta: {
    alignItems: "flex-end",
    gap: 3,
  },
  resultPrice: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[700],
  },
});
