import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";
import { ModalSheet, OptionSheet } from "../components/ModalSheet";
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import { useToast } from "../components/Toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorView,
  IconButton,
  InfoBanner,
  LoadingView,
  SectionHeader,
  TextField,
} from "../components/ui";
import { SIZE_SUGGESTIONS } from "../constants";
import { formatMoney, parseIntSafe, parseNumber } from "../lib/format";
import { errorMessage, suggestSku } from "../lib/utils";
import { useAppNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import type { CategoryDTO, ProductDTO, ProductInput, VariantInput } from "../types";

type ProductFormState = {
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  basePrice: string;
  baseCost: string;
  active: boolean;
};

type VariantDraft = {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  active: boolean;
};

type VariantFormState = Omit<VariantDraft, "key" | "id">;

const emptyProduct: ProductFormState = {
  name: "",
  description: "",
  brand: "",
  categoryId: "",
  basePrice: "",
  baseCost: "",
  active: true,
};

function newKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyVariant(price = "", cost = ""): VariantFormState {
  return {
    size: "",
    color: "",
    sku: "",
    barcode: "",
    price,
    cost,
    stock: "0",
    minStock: "0",
    active: true,
  };
}

export function ProductFormScreen({ route }: { route: { params?: { productId?: string } } }) {
  const productId = route.params?.productId;
  const isEdit = Boolean(productId);
  const navigation = useAppNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<ProductFormState>(emptyProduct);
  const [drafts, setDrafts] = useState<VariantDraft[]>([
    { key: newKey(), ...emptyVariant() },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [variantOpen, setVariantOpen] = useState(false);
  const [variantIndex, setVariantIndex] = useState<number | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariant());
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);

  const initialized = useRef(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/categories"),
  });

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.get<ProductDTO>(`/products/${productId}`),
    enabled: isEdit,
  });

  const product = productQuery.data;

  useEffect(() => {
    if (!product || initialized.current) return;
    initialized.current = true;
    setForm({
      name: product.name,
      description: product.description ?? "",
      brand: product.brand ?? "",
      categoryId: product.categoryId ?? "",
      basePrice: String(product.basePrice),
      baseCost: String(product.baseCost),
      active: product.active,
    });
    setDrafts(
      product.variants.map((variant) => ({
        key: variant.id,
        id: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode ?? "",
        price: String(variant.price),
        cost: String(variant.cost),
        stock: String(variant.stock),
        minStock: String(variant.minStock),
        active: variant.active,
      })),
    );
  }, [product]);

  useEffect(() => {
    if (!product || !initialized.current) return;
    setDrafts(
      product.variants.map((variant) => ({
        key: variant.id,
        id: variant.id,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode ?? "",
        price: String(variant.price),
        cost: String(variant.cost),
        stock: String(variant.stock),
        minStock: String(variant.minStock),
        active: variant.active,
      })),
    );
  }, [product]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    void queryClient.invalidateQueries({ queryKey: ["product", productId] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  function updateForm(patch: Partial<ProductFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateVariantForm(patch: Partial<VariantFormState>) {
    setVariantForm((current) => ({ ...current, ...patch }));
  }

  function openNewVariant() {
    setVariantIndex(null);
    setEditingExisting(false);
    setVariantForm(emptyVariant(form.basePrice, form.baseCost));
    setVariantErrors({});
    setVariantOpen(true);
  }

  function openVariant(index: number) {
    const draft = drafts[index];
    if (!draft) return;
    setVariantIndex(index);
    setEditingExisting(Boolean(draft.id));
    setVariantForm({
      size: draft.size,
      color: draft.color,
      sku: draft.sku,
      barcode: draft.barcode,
      price: draft.price,
      cost: draft.cost,
      stock: draft.stock,
      minStock: draft.minStock,
      active: draft.active,
    });
    setVariantErrors({});
    setVariantOpen(true);
  }

  function validateVariant(): boolean {
    const next: Record<string, string> = {};
    if (!variantForm.size.trim()) next.size = "Indica el talle";
    if (!variantForm.color.trim()) next.color = "Indica el color";
    if (!variantForm.sku.trim()) next.sku = "El SKU es obligatorio";

    const price = parseNumber(variantForm.price);
    if (variantForm.price.trim() && (price === null || price < 0)) {
      next.price = "Precio invalido";
    }

    const cost = parseNumber(variantForm.cost);
    if (variantForm.cost.trim() && (cost === null || cost < 0)) {
      next.cost = "Costo invalido";
    }

    const minStock = parseNumber(variantForm.minStock);
    if (variantForm.minStock.trim() && (minStock === null || minStock < 0)) {
      next.minStock = "Stock minimo invalido";
    }

    const showStock = !editingExisting;
    if (showStock) {
      const stock = parseNumber(variantForm.stock);
      if (variantForm.stock.trim() && (stock === null || stock < 0)) {
        next.stock = "Stock invalido";
      }
    }

    setVariantErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveVariant() {
    if (!validateVariant()) return;

    const base = {
      size: variantForm.size.trim(),
      color: variantForm.color.trim(),
      sku: variantForm.sku.trim(),
      barcode: variantForm.barcode.trim() || null,
      price: parseNumber(variantForm.price),
      cost: parseNumber(variantForm.cost),
      minStock: parseIntSafe(variantForm.minStock, 0),
    };

    setSavingVariant(true);

    try {
      if (isEdit && productId && editingExisting && variantIndex !== null) {
        const draft = drafts[variantIndex];
        if (!draft?.id) return;

        await api.patch(`/products/${productId}/variants/${draft.id}`, {
          ...base,
          price: base.price ?? 0,
          cost: base.cost ?? 0,
          active: variantForm.active,
        });

        showToast("Variante actualizada", "success");
        await productQuery.refetch();
        invalidate();
      } else if (isEdit && productId) {
        await api.post(`/products/${productId}/variants`, {
          ...base,
          price: base.price,
          cost: base.cost,
          stock: parseIntSafe(variantForm.stock, 0),
        });

        showToast("Variante agregada", "success");
        await productQuery.refetch();
        invalidate();
      } else {
        const draft: VariantDraft = {
          key: variantIndex !== null ? (drafts[variantIndex]?.key ?? newKey()) : newKey(),
          ...variantForm,
          size: base.size,
          color: base.color,
          sku: base.sku,
          barcode: base.barcode ?? "",
          price: variantForm.price.trim(),
          cost: variantForm.cost.trim(),
          stock: variantForm.stock,
          minStock: variantForm.minStock,
        };

        setDrafts((current) => {
          if (variantIndex === null) return [...current, draft];
          return current.map((item, index) => (index === variantIndex ? draft : item));
        });
        showToast(variantIndex === null ? "Variante agregada" : "Variante actualizada", "success");
      }

      setVariantOpen(false);
      setVariantErrors({});
    } catch (error) {
      showToast(errorMessage(error), "error");
    } finally {
      setSavingVariant(false);
    }
  }

  async function deactivateVariant(draft: VariantDraft) {
    if (!productId || !draft.id) return;

    try {
      await api.delete(`/products/${productId}/variants/${draft.id}`);
      showToast("Variante desactivada", "success");
      await productQuery.refetch();
      invalidate();
    } catch (error) {
      showToast(errorMessage(error), "error");
    }
  }

  function removeVariant(index: number) {
    const draft = drafts[index];
    if (!draft) return;

    if (draft.id && productId) {
      Alert.alert(
        "Desactivar variante",
        `Desactivar la variante ${draft.size} / ${draft.color}? Dejara de aparecer en el punto de venta.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar",
            style: "destructive",
            onPress: () => void deactivateVariant(draft),
          },
        ],
      );
      return;
    }

    if (drafts.length <= 1) {
      showToast("El producto necesita al menos una variante", "error");
      return;
    }

    setDrafts((current) => current.filter((_, position) => position !== index));
  }

  function validateProduct(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Ingresa el nombre del producto";

    const basePrice = parseNumber(form.basePrice);
    if (basePrice === null || basePrice < 0) next.basePrice = "Ingresa un precio valido";

    const baseCost = parseNumber(form.baseCost);
    if (form.baseCost.trim() && (baseCost === null || baseCost < 0)) {
      next.baseCost = "Costo invalido";
    }

    if (!isEdit) {
      if (drafts.length === 0) {
        showToast("Agrega al menos una variante", "error");
        return false;
      }

      const incomplete = drafts.some(
        (draft) => !draft.size.trim() || !draft.color.trim() || !draft.sku.trim(),
      );
      if (incomplete) {
        showToast("Completa talle, color y SKU de todas las variantes", "error");
        return false;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validateProduct()) return;

    const basePrice = parseNumber(form.basePrice) ?? 0;
    const baseCost = parseNumber(form.baseCost) ?? 0;

    setSaving(true);

    try {
      if (isEdit && productId) {
        await api.patch<ProductDTO>(`/products/${productId}`, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          brand: form.brand.trim() || null,
          categoryId: form.categoryId || null,
          basePrice,
          baseCost,
          active: form.active,
        });

        showToast("Producto actualizado", "success");
        invalidate();
        await productQuery.refetch();
      } else {
        const variants: VariantInput[] = drafts.map((draft) => ({
          size: draft.size.trim(),
          color: draft.color.trim(),
          sku: draft.sku.trim(),
          barcode: draft.barcode.trim() || null,
          price: parseNumber(draft.price),
          cost: parseNumber(draft.cost),
          stock: parseIntSafe(draft.stock, 0),
          minStock: parseIntSafe(draft.minStock, 0),
        }));

        const payload: ProductInput = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          brand: form.brand.trim() || null,
          categoryId: form.categoryId || null,
          basePrice,
          baseCost,
          active: form.active,
          variants,
        };

        const created = await api.post<ProductDTO>("/products", payload);
        showToast("Producto creado", "success");
        invalidate();
        navigation.replace("ProductForm", { productId: created.id });
      }
    } catch (error) {
      showToast(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  function openRestock(draft: VariantDraft) {
    if (!product || !draft.id) return;

    navigation.navigate("MovementForm", {
      initialVariant: {
        variantId: draft.id,
        productId: product.id,
        productName: product.name,
        sku: draft.sku,
        barcode: draft.barcode || null,
        size: draft.size,
        color: draft.color,
        price: parseNumber(draft.price) ?? product.basePrice,
        stock: parseIntSafe(draft.stock, 0),
      },
    });
  }

  const selectedCategory = categories?.find((category) => category.id === form.categoryId) ?? null;
  const initialLoading = isEdit && !product && (productQuery.isLoading || productQuery.isFetching);

  return (
    <Screen>
      <AppHeader
        title={isEdit ? "Editar producto" : "Nuevo producto"}
        subtitle={isEdit ? product?.name : "Datos base y variantes"}
        onBack={() => navigation.goBack()}
      />

      {initialLoading ? (
        <LoadingView label="Cargando producto..." />
      ) : isEdit && productQuery.isError ? (
        <ErrorView
          message={errorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.section}>
              <SectionHeader title="Datos del producto" />
              <View style={styles.fields}>
                <TextField
                  label="Nombre *"
                  value={form.name}
                  onChangeText={(value) => {
                    updateForm({ name: value });
                    setErrors((current) => ({ ...current, name: "" }));
                  }}
                  placeholder="Remera oversize basica"
                  error={errors.name}
                />

                <View style={styles.row}>
                  <TextField
                    label="Marca"
                    value={form.brand}
                    onChangeText={(value) => updateForm({ brand: value })}
                    placeholder="Caramelo"
                    containerStyle={styles.flex}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Categoria</Text>
                  <Pressable
                    onPress={() => setCategoryOpen(true)}
                    style={({ pressed }) => [styles.select, pressed && { opacity: 0.8 }]}
                  >
                    {selectedCategory ? (
                      <View
                        style={[
                          styles.selectDot,
                          { backgroundColor: selectedCategory.color ?? colors.stone[400] },
                        ]}
                      />
                    ) : (
                      <Ionicons name="pricetag-outline" size={16} color={colors.stone[400]} />
                    )}
                    <Text
                      style={[styles.selectText, !selectedCategory && styles.selectPlaceholder]}
                      numberOfLines={1}
                    >
                      {selectedCategory?.name ?? "Sin categoria"}
                    </Text>
                    <Ionicons name="chevron-down" size={17} color={colors.stone[400]} />
                  </Pressable>
                </View>

                <View style={styles.row}>
                  <TextField
                    label="Precio de venta *"
                    value={form.basePrice}
                    onChangeText={(value) => {
                      updateForm({ basePrice: value });
                      setErrors((current) => ({ ...current, basePrice: "" }));
                    }}
                    placeholder="14900"
                    keyboardType="decimal-pad"
                    leftIcon="cash-outline"
                    containerStyle={styles.flex}
                    error={errors.basePrice}
                  />
                  <TextField
                    label="Costo"
                    value={form.baseCost}
                    onChangeText={(value) => updateForm({ baseCost: value })}
                    placeholder="6200"
                    keyboardType="decimal-pad"
                    containerStyle={styles.flex}
                    error={errors.baseCost}
                  />
                </View>

                <TextField
                  label="Descripcion"
                  value={form.description}
                  onChangeText={(value) => updateForm({ description: value })}
                  placeholder="Material, calce, detalles..."
                  multiline
                  maxLength={1000}
                />

                {isEdit ? (
                  <View style={styles.switchRow}>
                    <View style={styles.flex}>
                      <Text style={styles.switchTitle}>Producto activo</Text>
                      <Text style={styles.switchHint}>Visible en el punto de venta</Text>
                    </View>
                    <Switch
                      value={form.active}
                      onValueChange={(value) => updateForm({ active: value })}
                      trackColor={{ false: colors.stone[300], true: colors.brand[400] }}
                      thumbColor={colors.white}
                    />
                  </View>
                ) : null}
              </View>
            </Card>

            <Card style={styles.section}>
              <SectionHeader
                title="Variantes"
                description={
                  isEdit
                    ? `${drafts.length} ${drafts.length === 1 ? "variante cargada" : "variantes cargadas"}`
                    : "Talle, color y stock inicial"
                }
                right={
                  <Button
                    title="Agregar"
                    icon="add"
                    variant="secondary"
                    size="sm"
                    onPress={openNewVariant}
                  />
                }
              />

              {drafts.length === 0 ? (
                <EmptyState
                  icon="layers-outline"
                  title="Sin variantes"
                  description="Agrega al menos una variante de talle y color."
                  action={<Button title="Agregar variante" icon="add" size="sm" onPress={openNewVariant} />}
                />
              ) : (
                <View style={styles.variantList}>
                  {drafts.map((draft, index) => (
                    <Pressable
                      key={draft.key}
                      onPress={() => openVariant(index)}
                      style={({ pressed }) => [
                        styles.variantCard,
                        index > 0 && styles.variantCardBorder,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <View style={styles.variantHeader}>
                        <View style={styles.variantTitleRow}>
                          <Text style={styles.variantTitle}>
                            {draft.size || "Talle"} / {draft.color || "Color"}
                          </Text>
                          {!draft.active ? <Badge label="Inactiva" tone="neutral" /> : null}
                          {draft.active &&
                          parseIntSafe(draft.stock, 0) <= parseIntSafe(draft.minStock, 0) ? (
                            <Badge label="Reponer" tone="warning" />
                          ) : null}
                        </View>
                        <Text style={styles.variantPrice}>
                          {formatMoney(parseNumber(draft.price) ?? product?.basePrice ?? 0)}
                        </Text>
                      </View>

                      <Text style={styles.variantSku} numberOfLines={1}>
                        {draft.sku || "SKU pendiente"}
                        {draft.barcode ? ` · ${draft.barcode}` : ""}
                      </Text>

                      <View style={styles.variantFooter}>
                        <View style={styles.variantStats}>
                          <Ionicons name="cube-outline" size={13} color={colors.stone[400]} />
                          <Text style={styles.variantStatText}>
                            Stock {draft.stock || 0} · Min {draft.minStock || 0}
                          </Text>
                        </View>

                        <View style={styles.variantActions}>
                          {draft.id ? (
                            <IconButton
                              icon="add-circle-outline"
                              accessibilityLabel="Registrar movimiento"
                              background={colors.emerald[50]}
                              color={colors.emerald[700]}
                              onPress={() => openRestock(draft)}
                            />
                          ) : null}
                          <IconButton
                            icon="pencil"
                            accessibilityLabel="Editar variante"
                            background={colors.stone[100]}
                            onPress={() => openVariant(index)}
                          />
                          <IconButton
                            icon="trash-outline"
                            accessibilityLabel="Quitar variante"
                            background={colors.rose[50]}
                            color={colors.rose[600]}
                            onPress={() => removeVariant(index)}
                          />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </Card>

            <InfoBanner
              icon="information-circle-outline"
              text={
                isEdit
                  ? "El stock se ajusta desde Movimientos. Usa el boton + de cada variante para reponer."
                  : "El stock inicial se registra como un ingreso en el historial de movimientos."
              }
            />
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Button
              title={isEdit ? "Guardar cambios" : "Crear producto"}
              icon="save-outline"
              size="lg"
              fullWidth
              loading={saving}
              onPress={() => void handleSave()}
            />
          </View>
        </>
      )}

      <OptionSheet
        visible={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="Categoria"
        description="Agrupa el producto en el catalogo"
        options={(categories ?? []).map((category) => ({
          value: category.id,
          label: category.name,
          color: category.color,
        }))}
        selected={form.categoryId || null}
        onSelect={(value) => updateForm({ categoryId: value ?? "" })}
        allowClear
        clearLabel="Sin categoria"
      />

      <ModalSheet
        visible={variantOpen}
        onClose={() => setVariantOpen(false)}
        title={editingExisting ? "Editar variante" : variantIndex === null ? "Nueva variante" : "Editar variante"}
        description={
          editingExisting
            ? "El stock se modifica desde Movimientos"
            : "Se registrara el stock inicial como ingreso"
        }
        fullHeight
        footer={
          <>
            <Button title="Cancelar" variant="secondary" onPress={() => setVariantOpen(false)} />
            <Button
              title="Guardar"
              icon="checkmark"
              loading={savingVariant}
              onPress={() => void saveVariant()}
              style={styles.flex}
            />
          </>
        }
      >
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Talle *</Text>
            <TextField
              value={variantForm.size}
              onChangeText={(value) => updateVariantForm({ size: value })}
              placeholder="M"
              autoCapitalize="characters"
              error={variantErrors.size}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizes}>
              {SIZE_SUGGESTIONS.map((size) => (
                <Pressable
                  key={size}
                  onPress={() => updateVariantForm({ size })}
                  style={[
                    styles.sizeChip,
                    variantForm.size === size && styles.sizeChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      variantForm.size === size && styles.sizeChipTextSelected,
                    ]}
                  >
                    {size}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <TextField
            label="Color *"
            value={variantForm.color}
            onChangeText={(value) => updateVariantForm({ color: value })}
            placeholder="Negro"
            error={variantErrors.color}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SKU *</Text>
            <View style={styles.inline}>
              <TextField
                value={variantForm.sku}
                onChangeText={(value) => updateVariantForm({ sku: value })}
                placeholder="REM-OVR-M-NEG"
                autoCapitalize="characters"
                autoCorrect={false}
                containerStyle={styles.flex}
                error={variantErrors.sku}
              />
              <Button
                title="Generar"
                icon="sparkles-outline"
                variant="secondary"
                onPress={() =>
                  updateVariantForm({
                    sku: suggestSku(form.name, variantForm.size, variantForm.color),
                  })
                }
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Codigo de barras</Text>
            <View style={styles.inline}>
              <TextField
                value={variantForm.barcode}
                onChangeText={(value) => updateVariantForm({ barcode: value })}
                placeholder="Opcional"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.flex}
              />
              <IconButton
                icon="scan-outline"
                accessibilityLabel="Escanear codigo de barras"
                background={colors.brand[50]}
                color={colors.brand[700]}
                onPress={() => setScannerOpen(true)}
                style={styles.scanButton}
              />
            </View>
          </View>

          <View style={styles.row}>
            <TextField
              label="Precio"
              value={variantForm.price}
              onChangeText={(value) => updateVariantForm({ price: value })}
              placeholder={form.basePrice || "0"}
              keyboardType="decimal-pad"
              containerStyle={styles.flex}
              error={variantErrors.price}
            />
            <TextField
              label="Costo"
              value={variantForm.cost}
              onChangeText={(value) => updateVariantForm({ cost: value })}
              placeholder={form.baseCost || "0"}
              keyboardType="decimal-pad"
              containerStyle={styles.flex}
              error={variantErrors.cost}
            />
          </View>

          <View style={styles.row}>
            {!editingExisting ? (
              <TextField
                label="Stock inicial"
                value={variantForm.stock}
                onChangeText={(value) => updateVariantForm({ stock: value })}
                keyboardType="number-pad"
                containerStyle={styles.flex}
                error={variantErrors.stock}
              />
            ) : null}
            <TextField
              label="Stock minimo"
              value={variantForm.minStock}
              onChangeText={(value) => updateVariantForm({ minStock: value })}
              keyboardType="number-pad"
              containerStyle={styles.flex}
              error={variantErrors.minStock}
            />
          </View>

          {editingExisting ? (
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>Variante activa</Text>
                <Text style={styles.switchHint}>Disponible en el punto de venta</Text>
              </View>
              <Switch
                value={variantForm.active}
                onValueChange={(value) => updateVariantForm({ active: value })}
                trackColor={{ false: colors.stone[300], true: colors.brand[400] }}
                thumbColor={colors.white}
              />
            </View>
          ) : null}

          {editingExisting ? (
            <InfoBanner
              icon="swap-vertical-outline"
              text="Para cambiar el stock actual registra un ingreso, egreso o ajuste desde Movimientos."
            />
          ) : null}
        </View>
      </ModalSheet>

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(code) => updateVariantForm({ barcode: code })}
      />
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
  section: { gap: spacing.xs },
  fields: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stone[300],
    backgroundColor: colors.white,
  },
  selectDot: { width: 12, height: 12, borderRadius: 6 },
  selectText: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.stone[900],
  },
  selectPlaceholder: { color: colors.stone[400] },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  switchTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  switchHint: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.stone[500],
  },
  variantList: { gap: 0 },
  variantCard: {
    paddingVertical: spacing.md,
    gap: 5,
  },
  variantCardBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[200],
  },
  variantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  variantTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  variantTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  variantPrice: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[800],
  },
  variantSku: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
    fontFamily: fonts.mono,
  },
  variantFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: 2,
  },
  variantStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  variantStatText: {
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  variantActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stone[200],
    backgroundColor: colors.white,
  },
  sizes: {
    gap: 6,
    paddingVertical: 2,
  },
  sizeChip: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.stone[200],
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeChipSelected: {
    borderColor: colors.brand[400],
    backgroundColor: colors.brand[50],
  },
  sizeChipText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  sizeChipTextSelected: {
    color: colors.brand[700],
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
});
