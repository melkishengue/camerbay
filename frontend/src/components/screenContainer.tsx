import { useHeaderHeight } from "@react-navigation/elements";
import { useThemeColor } from "heroui-native";
import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets
} from "react-native-safe-area-context";

export default function ScreenContainer({
  children,
  withSchrollView,
  refreshing,
  onRefresh,
  immersiveHeader,
  noPadding,
  noHeader
}: {
  children: ReactNode;
  withSchrollView?: boolean;
  refreshing?: boolean;
  immersiveHeader?: boolean;
  noPadding?: boolean;
  noHeader?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  const [backgroundColor, tintColor] = useThemeColor([
    "background",
    "background-inverse"
  ]);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const noop = () => {};

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor }}
      edges={noHeader ? ["left", "right", "top"] : ["left", "right"]}
    >
      {withSchrollView ? (
        <ScrollView
          className={noPadding ? "" : "px-4"}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            immersiveHeader
              ? { paddingTop: headerHeight }
              : {
                  paddingTop: headerHeight + 10,
                  paddingBottom: 20
                }
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh ?? noop}
              colors={[tintColor]} // Android
              tintColor={tintColor} // iOS
              progressViewOffset={insets.top + 60}
            />
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            paddingTop: headerHeight + 10,
            paddingBottom: 20
          }}
          className={noPadding ? "" : "px-4"}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
