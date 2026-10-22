import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../api/client";
import { ModalSheet } from "../components/ModalSheet";
import { AppHeader, HeaderAction, Screen } from "../components/Screen";
import { useToast } from "../components/Toast";
import {
  Badge,
  Button,
  EmptyState,
  ErrorView,
  IconButton,
  LoadingView,
  TextField,
} from "../components/ui";
import { CATEGORY_COLORS } from "../constants";
import { errorMessage } from "../lib/utils";
import { useRootNavigation } from "../navigation/types";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import type { CategoryDTO, CategoryInput } from "../types";

export function CategoriesScreen() {
  const navigation = useRootNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]!);
  const [nameError, setNameError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: categories, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/categories"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      showToast("Categoria eliminada", "success");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => showToast(errorMessage(error), "error"),
  });

  function openCreate() {
    setEditing(null);
    setName("");
    setColor(CATEGORY_COLORS[0]!);
    setNameError(null);
    setColorError(null);
    setModalOpen(true);
  }

  function openEdit(category: CategoryDTO) {
    setEditing(category);
    setName(category.name);
    setColor(category.color ?? CATEGORY_COLORS[0]!);
    setNameError(null);
    setColorError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    let valid = true;

    if (name.trim().length < 2) {
      setNameError("Ingresa un nombre de al menos 2 caracteres");
      valid = false;
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color.trim())) {
      setColorError("Usa un color hex como #f59e0b");
      valid = false;
    }

    if (!valid) return;

    setSaving(true);

    try {
      const payload: CategoryInput = {
        name: name.trim(),
        color: color.trim().toLowerCase(),
      };

      if (editing) {
        await api.patch(`/categories/${editing.id}`, payload);
        showToast("Categoria actualizada", "success");
      } else {
        await api.post("/categories", payload);
        showToast("Categoria creada", "success");
      }

      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(category: CategoryDTO) {
    Alert.alert(
      "Eliminar categoria",
      `Eliminar "${category.name}"? Los productos quedaran sin categoria.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => remove.mutate(category.id),
        },
      ],
    );
  }

  return (
    <Screen>
      <AppHeader
        title="Categorias"
        subtitle="Organiza el catalogo por tipo de prenda"
        onBack={() => navigation.goBack()}
        right={
          <HeaderAction
            icon="add"
            accessibilityLabel="Nueva categoria"
            onPress={openCreate}
          />
        }
      />

      {isLoading ? (
        <LoadingView label="Cargando categorias..." />
      ) : isError ? (
        <ErrorView message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={categories ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
            (categories ?? []).length === 0 && styles.listEmpty,
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
          ListEmptyComponent={
            <EmptyState
              icon="pricetags-outline"
              title="Todavia no hay categorias"
              description="Crea categorias para agrupar tus productos."
              action={
                <Button title="Crear categoria" icon="add" size="sm" onPress={openCreate} />
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
            >
              <View
                style={[
                  styles.colorBadge,
                  { backgroundColor: item.color ?? colors.stone[300] },
                ]}
              >
                <Ionicons name="pricetag" size={17} color={colors.white} />
              </View>

              <View style={styles.flex}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.categoryMeta}>
                  {item.productCount ?? 0}{" "}
                  {(item.productCount ?? 0) === 1 ? "producto" : "productos"}
                </Text>
              </View>

              <Badge label={String(item.productCount ?? 0)} tone="brand" />

              <View style={styles.actions}>
                <IconButton
                  icon="pencil"
                  accessibilityLabel="Editar categoria"
                  background={colors.stone[100]}
                  onPress={() => openEdit(item)}
                />
                <IconButton
                  icon="trash-outline"
                  accessibilityLabel="Eliminar categoria"
                  background={colors.rose[50]}
                  color={colors.rose[600]}
                  onPress={() => handleDelete(item)}
                />
              </View>
            </Pressable>
          )}
        />
      )}

      <ModalSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar categoria" : "Nueva categoria"}
        description="Se usa para identificar la categoria en el catalogo"
        footer={
          <>
            <Button title="Cancelar" variant="secondary" onPress={() => setModalOpen(false)} />
            <Button
              title="Guardar"
              icon="checkmark"
              loading={saving}
              onPress={() => void handleSave()}
              style={styles.flex}
            />
          </>
        }
      >
        <TextField
          label="Nombre"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setNameError(null);
          }}
          placeholder="Camisetas"
          error={nameError ?? undefined}
          autoFocus
        />

        <View style={styles.colorSection}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.swatches}>
            {CATEGORY_COLORS.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setColor(option);
                  setColorError(null);
                }}
                style={[
                  styles.swatch,
                  { backgroundColor: option },
                  color.toLowerCase() === option.toLowerCase() && styles.swatchSelected,
                ]}
              >
                {color.toLowerCase() === option.toLowerCase() ? (
                  <Ionicons name="checkmark" size={17} color={colors.white} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <TextField
            label="Hex"
            value={color}
            onChangeText={(value) => {
              setColor(value);
              setColorError(null);
            }}
            placeholder="#f59e0b"
            autoCapitalize="none"
            autoCorrect={false}
            error={colorError ?? undefined}
            leftIcon="color-palette-outline"
          />
        </View>
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  listEmpty: { flexGrow: 1 },
  separator: { height: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.md,
  },
  colorBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: fontSizes.md,
    fontFamily: fonts.medium,
    color: colors.stone[900],
  },
  categoryMeta: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: colors.stone[500],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.stone[600],
  },
  colorSection: { gap: spacing.sm },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
