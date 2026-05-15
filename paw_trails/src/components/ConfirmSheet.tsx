import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemeStore } from "../stores/themeStore";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmSheet({
  visible, title, message, confirmLabel, cancelLabel = "キャンセル",
  destructive = false, onConfirm, onCancel,
}: Props) {
  const { colors } = useThemeStore();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>
          <View style={styles.dividerH} />
          <TouchableOpacity
            style={styles.action}
            onPress={onConfirm}
            activeOpacity={0.6}
          >
            <Text style={[styles.actionText, destructive ? styles.destructive : { color: colors.primary }]}>
              {confirmLabel}
            </Text>
          </TouchableOpacity>
          <View style={styles.dividerH} />
          <TouchableOpacity style={styles.action} onPress={onCancel} activeOpacity={0.6}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center", padding: 40,
  },
  sheet: {
    backgroundColor: "#F2F2F7", borderRadius: 14, width: "100%",
    overflow: "hidden",
  },
  content: { padding: 20, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "600", color: "#1C1C1E", textAlign: "center" },
  message: { fontSize: 13, color: "#6C6C70", marginTop: 6, textAlign: "center", lineHeight: 18 },
  dividerH: { height: StyleSheet.hairlineWidth, backgroundColor: "#C6C6C8" },
  action: { paddingVertical: 16, alignItems: "center" },
  actionText: { fontSize: 17, fontWeight: "600" },
  destructive: { color: "#FF3B30" },
  cancelText: { fontSize: 17, fontWeight: "400", color: "#1C1C1E" },
});
