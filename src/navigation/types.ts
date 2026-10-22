import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  type CompositeNavigationProp,
  type NavigatorScreenParams,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SaleSearchResult } from "../types";

export type TabParamList = {
  Dashboard: undefined;
  Pos: undefined;
  Products: { lowStock?: boolean } | undefined;
  Sales: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ProductForm: { productId?: string } | undefined;
  SaleDetail: { saleId: string };
  Movements: undefined;
  MovementForm: { initialVariant?: SaleSearchResult } | undefined;
  Categories: undefined;
};

export type AppTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function useAppNavigation(): AppTabNavigation {
  return useNavigation<AppTabNavigation>();
}

export function useRootNavigation(): RootNavigation {
  return useNavigation<RootNavigation>();
}
