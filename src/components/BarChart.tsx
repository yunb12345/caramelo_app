import { StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, fonts, radius, spacing } from "../theme";
import { formatCompact } from "../lib/format";

export type BarDatum = { label: string; value: number };

export function BarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.chart}>
      {data.map((item, index) => {
        const ratio = item.value > 0 ? Math.max(item.value / max, 0.04) : 0;
        return (
          <View key={`${item.label}-${index}`} style={styles.column}>
            <Text style={styles.value} numberOfLines={1}>
              {item.value > 0 ? formatCompact(item.value) : ""}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${ratio * 100}%` as `${number}%`,
                    backgroundColor: item.value > 0 ? colors.brand[500] : colors.stone[200],
                  },
                ]}
              />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    height: 168,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 9,
    color: colors.stone[400],
    fontFamily: fonts.medium,
    height: 12,
  },
  track: {
    height: 112,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  label: {
    fontSize: 9.5,
    color: colors.stone[500],
    fontFamily: fonts.medium,
  },
});
