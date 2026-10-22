import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../api/client";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";
import { ModalSheet } from "../components/ModalSheet";
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import { useToast } from "../components/Toast";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  SearchField,
  Segmented,
  TextField,
} from "../components/ui";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "../constants";
import { formatMoney, parseNumber } from "../lib/format";
import { errorMessage } from "../lib/utils";
import { useAppNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, shadow, spacing } from "../theme";
import type { SaleDTO, SaleInput, SaleSearchResult } from "../types";

type CartItem = {
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  quantity: number;
};

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "CASH", label: "Efectivo", icon: "cash-outline" },
  { value: "CARD", label: "Tarjeta", icon: "card-outline" },
  { value: "TRANSFER", label: "Transferencia", icon: "phone-portrait-outline" },
  { value: "OTHER", label: "Otro", icon: "wallet-outline" },
];

export function PosScreen() {
  const navigation = useAppNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cartOpen, setCartOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleDTO | null>(null);
  const [priceEditing, setPriceEditing] = useState<CartItem | null>(null);
  const [priceText, setPriceText] = useState("");
  const scanRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const { data: results, isFetching, isError } = useQuery({
    queryKey: ["variant-search", "pos", debounced],
    queryFn: () =>
      api.get<SaleSearchResult[]>(`/variants/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length > 0,
  });

  const addToCart = useCallback(
    (item: SaleSearchResult) => {
      if (item.stock <= 0) {
        showToast("Esa variante no tiene stock", "error");
        return;
      }

      setCart((current) => {
        const existing = current.find((line) => line.variantId === item.variantId);

        if (existing) {
          if (existing.quantity >= item.stock) {
            showToast(`Solo hay ${item.stock} unidades disponibles`, "info");
            return current;
          }

          return current.map((line) =>
            line.variantId === item.variantId
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          );
        }

        return [
          ...current,
          {
            variantId: item.variantId,
            productName: item.productName,
            sku: item.sku,
            size: item.size,
            color: item.color,
            price: item.price,
            stock: item.stock,
            quantity: 1,
          },
        ];
      });

      void Haptics.selectionAsync();
      setTerm("");
      setDebounced("");
    },
    [showToast],
  );

  useEffect(() => {
    if (!scanRef.current || !debounced) return;

    if (isError) {
      scanRef.current = false;
      showToast("No pudimos buscar el codigo escaneado", "error");
      return;
    }

    if (isFetching || results === undefined) return;

    scanRef.current = false;
    const first = results[0];

    if (first) addToCart(first);
    else showToast("No encontramos un producto con ese codigo", "error");
  }, [results, debounced, isFetching, isError, addToCart, showToast]);

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const discountValue = Math.min(Math.max(parseNumber(discount) ?? 0, 0), subtotal);
  const total = Math.max(0, subtotal - discountValue);
  const units = cart.reduce((count, item) => count + item.quantity, 0);

  function changeQuantity(variantId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.variantId !== variantId) return line;
          const next = line.quantity + delta;

          if (next > line.stock) {
            showToast(`Solo hay ${line.stock} unidades disponibles`, "info");
            return line;
          }

          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  function savePrice() {
    if (!priceEditing) return;
    const value = parseNumber(priceText);

    if (value === null || value < 0) {
      showToast("Ingresa un precio valido", "error");
      return;
    }

    setCart((current) =>
      current.map((line) =>
        line.variantId === priceEditing.variantId ? { ...line, price: value } : line,
      ),
    );
    setPriceEditing(null);
  }

  const checkout = useMutation({
    mutationFn: () =>
      api.post<SaleDTO>("/sales", {
        items: cart.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.price,
        })),
        paymentMethod,
        discount: discountValue,
      } satisfies SaleInput),
    onSuccess: (sale) => {
      setLastSale(sale);
      setCart([]);
      setDiscount("0");
      setPaymentMethod("CASH");
      setCartOpen(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["variant-search"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error) => showToast(errorMessage(error), "error"),
  });

  return (
    <Screen>
      <AppHeader
        title="Punto de venta"
        subtitle="Busca, escanea y cobra en segundos"
        right={
          <HeaderAction
            icon="bag-handle-outline"
            accessibilityLabel="Abrir carrito"
            badge={units}
            onPress={() => {
              if (cart.length === 0) {
                showToast("Agrega productos al carrito", "info");
                return;
              }
              setCartOpen(true);
            }}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <View style={styles.flex}>
            <SearchField
              value={term}
              onChangeText={setTerm}
              placeholder="Escanea o busca un producto..."
              autoFocus
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
          </View>
        </View>

        {isFetching ? (
          <View style={styles.searching}>
            <ActivityIndicator size="small" color={colors.brand[600]} />
            <Text style={styles.searchingText}>Buscando...</Text>
          </View>
        ) : null}

        {debounced.length === 0 ? (
          <Card>
            <EmptyState
              icon="search-outline"
              title="Busca un producto"
              description="Escribi el nombre, SKU, color o usa el lector de codigos de barras."
            />
          </Card>
        ) : results && results.length === 0 && !isFetching ? (
          <Card>
            <EmptyState
              icon="bag-outline"
              title="Sin resultados"
              description="Proba con otro nombre, SKU o codigo de barras."
            />
          </Card>
        ) : (
          <Card style={styles.resultsCard}>
            {results?.map((item, index) => (
              <Pressable
                key={item.variantId}
                onPress={() => addToCart(item)}
                disabled={item.stock === 0}
                style={({ pressed }) => [
                  styles.resultRow,
                  index > 0 && styles.resultBorder,
                  pressed && styles.resultPressed,
                  item.stock === 0 && styles.resultDisabled,
                ]}
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
                </View>

                <IconButton
                  icon="add-circle"
                  accessibilityLabel="Agregar al carrito"
                  color={item.stock === 0 ? colors.stone[300] : colors.brand[600]}
                  size={26}
                  onPress={() => addToCart(item)}
                />
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>

      {cart.length > 0 ? (
        <View style={styles.cartBar}>
          <View style={styles.cartBarInfo}>
            <Text style={styles.cartBarUnits}>
              {units} {units === 1 ? "unidad" : "unidades"}
            </Text>
            <Text style={styles.cartBarTotal}>{formatMoney(total)}</Text>
          </View>
          <Button
            title={`Ver carrito (${units})`}
            icon="bag-handle-outline"
            onPress={() => setCartOpen(true)}
          />
        </View>
      ) : null}

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(code) => {
          scanRef.current = true;
          setTerm(code);
          setDebounced(code);
        }}
      />

      <ModalSheet
        visible={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Venta actual"
        description={`${units} ${units === 1 ? "unidad" : "unidades"} en el carrito`}
        fullHeight
        footer={
          <View style={styles.modalFooter}>
            <Button
              title="Vaciar"
              variant="secondary"
              onPress={() => setCart([])}
              disabled={cart.length === 0}
            />
            <Button
              title={cart.length > 0 ? `Cobrar ${formatMoney(total)}` : "Cobrar"}
              icon="checkmark"
              variant="success"
              loading={checkout.isPending}
              disabled={cart.length === 0}
              onPress={() => checkout.mutate()}
              style={styles.flex}
            />
          </View>
        }
      >
        {cart.length === 0 ? (
          <EmptyState
            icon="bag-outline"
            title="El carrito esta vacio"
            description="Agrega productos desde el buscador."
          />
        ) : (
          <>
            <View style={styles.cartList}>
              {cart.map((line, index) => (
                <View key={line.variantId} style={[styles.cartItem, index > 0 && styles.cartItemBorder]}>
                  <View style={styles.cartItemHeader}>
                    <View style={styles.flex}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {line.productName}
                      </Text>
                      <Text style={styles.cartItemVariant}>
                        {line.color} · Talle {line.size} · {line.sku}
                      </Text>
                    </View>
                    <IconButton
                      icon="trash-outline"
                      accessibilityLabel="Quitar del carrito"
                      color={colors.stone[400]}
                      onPress={() =>
                        setCart((current) =>
                          current.filter((item) => item.variantId !== line.variantId),
                        )
                      }
                    />
                  </View>

                  <View style={styles.cartItemActions}>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Restar unidad"
                        onPress={() => changeQuantity(line.variantId, -1)}
                        style={styles.stepperButton}
                      >
                        <Ionicons name="remove" size={16} color={colors.stone[600]} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{line.quantity}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Sumar unidad"
                        onPress={() => changeQuantity(line.variantId, 1)}
                        style={styles.stepperButton}
                      >
                        <Ionicons name="add" size={16} color={colors.stone[600]} />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => {
                        setPriceEditing(line);
                        setPriceText(String(line.price));
                      }}
                      style={styles.priceButton}
                    >
                      <Text style={styles.priceButtonText}>{formatMoney(line.price)}</Text>
                      <Ionicons name="pencil" size={12} color={colors.brand[600]} />
                    </Pressable>

                    <Text style={styles.lineTotal}>{formatMoney(line.price * line.quantity)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Divider />

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
              </View>

              <View style={styles.discountRow}>
                <Text style={styles.totalLabel}>Descuento</Text>
                <TextField
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  containerStyle={styles.discountField}
                  inputStyle={styles.discountInput}
                  placeholder="0"
                />
              </View>

              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{formatMoney(total)}</Text>
              </View>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Medio de pago</Text>
              <Segmented
                options={paymentOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
                columns={2}
              />
            </View>
          </>
        )}
      </ModalSheet>

      <ModalSheet
        visible={priceEditing !== null}
        onClose={() => setPriceEditing(null)}
        title="Editar precio"
        description={priceEditing ? priceEditing.productName : undefined}
        footer={
          <>
            <Button title="Cancelar" variant="secondary" onPress={() => setPriceEditing(null)} />
            <Button title="Guardar" icon="checkmark" onPress={savePrice} style={styles.flex} />
          </>
        }
      >
        <TextField
          label="Precio unitario"
          value={priceText}
          onChangeText={setPriceText}
          keyboardType="decimal-pad"
          autoFocus
          leftIcon="cash-outline"
          onSubmitEditing={savePrice}
        />
      </ModalSheet>

      <ModalSheet
        visible={lastSale !== null}
        onClose={() => setLastSale(null)}
        title="Venta registrada"
        description={lastSale ? `Comprobante #${lastSale.number}` : undefined}
        footer={
          <>
            <Button title="Nueva venta" variant="secondary" onPress={() => setLastSale(null)} />
            {lastSale ? (
              <Button
                title="Ver comprobante"
                icon="receipt-outline"
                onPress={() => {
                  const saleId = lastSale.id;
                  setLastSale(null);
                  navigation.navigate("SaleDetail", { saleId });
                }}
                style={styles.flex}
              />
            ) : null}
          </>
        }
      >
        {lastSale ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successLabel}>TOTAL COBRADO</Text>
              <Text style={styles.successTotal}>{formatMoney(lastSale.total)}</Text>
              <Badge label={PAYMENT_METHOD_LABELS[lastSale.paymentMethod]} tone="success" />
            </View>

            <View style={styles.saleItems}>
              {lastSale.items.map((item) => (
                <View key={item.id} style={styles.saleItemRow}>
                  <View style={styles.flex}>
                    <Text style={styles.saleItemName} numberOfLines={1}>
                      {item.variant.product.name}
                    </Text>
                    <Text style={styles.saleItemVariant}>
                      {item.variant.color} · Talle {item.variant.size} · {item.quantity} u.
                    </Text>
                  </View>
                  <Text style={styles.saleItemSubtotal}>{formatMoney(item.subtotal)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searching: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  searchingText: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  resultsCard: {
    padding: 0,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  resultBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[100],
  },
  resultPressed: {
    backgroundColor: colors.stone[50],
  },
  resultDisabled: {
    opacity: 0.55,
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
    color: colors.stone[800],
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
    ...shadow,
  },
  cartBarInfo: { flex: 1 },
  cartBarUnits: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  cartBarTotal: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    flex: 1,
  },
  cartList: { gap: 0 },
  cartItem: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cartItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[200],
  },
  cartItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  cartItemName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  cartItemVariant: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.stone[50],
  },
  stepperValue: {
    width: 32,
    textAlign: "center",
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  priceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  priceButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.brand[700],
  },
  lineTotal: {
    flex: 1,
    textAlign: "right",
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  totals: { gap: spacing.sm },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
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
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  discountField: { width: 120 },
  discountInput: { textAlign: "right" },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
    borderStyle: "dashed",
    paddingTop: spacing.md,
  },
  grandTotalLabel: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[700],
  },
  grandTotalValue: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  paymentSection: { gap: spacing.sm },
  paymentTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  successBox: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.emerald[50],
  },
  successLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fonts.medium,
    color: colors.emerald[700],
  },
  successTotal: {
    fontSize: 34,
    fontFamily: fonts.medium,
    color: colors.emerald[700],
    letterSpacing: -0.8,
  },
  saleItems: { gap: spacing.sm },
  saleItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stone[100],
  },
  saleItemName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  saleItemVariant: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  saleItemSubtotal: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[700],
  },
});
