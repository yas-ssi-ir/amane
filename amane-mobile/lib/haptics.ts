/**
 * Helpers haptics (expo-haptics deja installe par le template Expo).
 * Utiliser sur :
 *  - haptic.selection() : tap sur option / chip
 *  - haptic.light()     : navigation / step suivant
 *  - haptic.medium()    : action notable (capture photo)
 *  - haptic.success()   : envoi reussi
 *  - haptic.error()     : erreur / refus
 */

import * as Haptics from "expo-haptics";

export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
