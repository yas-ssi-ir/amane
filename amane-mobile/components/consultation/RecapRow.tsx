import { StyleSheet, Text, View } from 'react-native';

interface RecapRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function RecapRow({ label, value, isLast }: RecapRowProps) {
  return (
    <View style={[s.row, !isLast && s.rowBorder]}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  label: { color: '#71717a', fontSize: 13 },
  value: { color: '#f4f4f5', fontSize: 13, fontWeight: '500' },
});
