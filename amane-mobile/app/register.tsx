import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, Clock, Eye, EyeOff, ImageIcon, Trash2 } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { api, authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { haptic } from '@/lib/haptics';

const REGIONS = [
  'Tanger-Tetouan-Al Hoceima', 'Oriental', 'Fes-Meknes',
  'Rabat-Sale-Kenitra', 'Beni Mellal-Khenifra', 'Casablanca-Settat',
  'Marrakech-Safi', 'Draa-Tafilalet', 'Souss-Massa',
  'Guelmim-Oued Noun', 'Laayoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab',
];

const ROLES = [
  {
    value: 'relais',
    label: 'Relais de santé',
    desc: 'Agent communautaire de santé — collecte les consultations sur le terrain',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    credentialLabel: null,
    credentialPlaceholder: null,
  },
  {
    value: 'infirmier',
    label: 'Infirmier(e)',
    desc: 'Personnel infirmier — suivi médical et soins de première ligne',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    credentialLabel: 'Numéro ONIP',
    credentialPlaceholder: 'ex: ONIP-2024-XXXXX',
  },
  {
    value: 'medecin',
    label: 'Médecin',
    desc: 'Médecin spécialiste — validation des diagnostics et décisions thérapeutiques',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.3)',
    credentialLabel: 'Numéro CNOM',
    credentialPlaceholder: 'ex: CNOM-XXXX-XXXXXXXX',
  },
];

const schema = z.object({
  full_name: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  username: z.string().min(3, 'Identifiant requis (min. 3 caractères)').regex(/^[a-z0-9_]+$/, 'Identifiant : lettres minuscules, chiffres, _ uniquement'),
  password: z.string().min(6, 'Mot de passe requis (min. 6 caractères)'),
  confirm_password: z.string(),
  phone: z.string().optional(),
  credential_number: z.string().optional(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [role, setRole] = useState<string>('relais');
  const [region, setRegion] = useState<string>('Casablanca-Settat');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', username: '', password: '', confirm_password: '', phone: '', credential_number: '' },
  });

  const selectedRole = ROLES.find((r) => r.value === role);
  const needsCredential = role === 'infirmier' || role === 'medecin';

  // Document justificatif
  const [docUri, setDocUri] = useState<string | null>(null);
  const [docMime, setDocMime] = useState<string>('image/jpeg');
  const [docName, setDocName] = useState<string>('document.jpg');
  const [docType, setDocType] = useState<string>('carte_nationale');

  const DOC_TYPES = [
    { value: 'carte_nationale', label: 'Carte Nationale (CIN)' },
    { value: 'diplome', label: role === 'medecin' ? 'Diplôme de médecine' : 'Diplôme infirmier' },
    { value: 'permis_exercer', label: "Permis d'exercer" },
  ];

  const pickDocFromCamera = async () => {
    haptic.medium();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la caméra pour photographier votre document.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 2],
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      haptic.success();
      setDocUri(a.uri);
      setDocMime(a.mimeType ?? 'image/jpeg');
      setDocName(a.fileName ?? `doc-${Date.now()}.jpg`);
    }
  };

  const pickDocFromGallery = async () => {
    haptic.medium();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 2],
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      haptic.success();
      setDocUri(a.uri);
      setDocMime(a.mimeType ?? 'image/jpeg');
      setDocName(a.fileName ?? `doc-${Date.now()}.jpg`);
    }
  };

  const uploadCredentialDoc = async (userId: string) => {
    if (!docUri) return;
    try {
      const fd = new FormData();
      fd.append('doc', { uri: docUri, name: docName, type: docMime } as any);
      fd.append('doc_type', docType);
      await api.post('/api/auth/credential-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (e: any) {
      console.warn('[CredDoc] upload failed:', e.message);
    }
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    if (needsCredential && !data.credential_number?.trim()) {
      setServerError(`${selectedRole?.credentialLabel} obligatoire pour ce rôle professionnel`);
      return;
    }
    try {
      const registered = await authApi.register({
        full_name: data.full_name,
        username: data.username,
        password: data.password,
        role,
        region,
        phone: data.phone || undefined,
        credential_number: data.credential_number?.trim() || undefined,
      });
      haptic.success();
      const user = await login(data.username, data.password);
      // Upload du document justificatif (non bloquant)
      if (docUri) await uploadCredentialDoc(registered.id ?? user.id);
      if (user.verification_status === 'pending') {
        setPendingModalVisible(true);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      haptic.error();
      setServerError(e.message ?? "Erreur lors de l'inscription");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Modale vérification en attente */}
      <Modal visible={pendingModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View entering={FadeIn.duration(300)} style={{ backgroundColor: '#18181b', borderRadius: 28, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(251,191,36,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Clock size={36} color="#fbbf24" strokeWidth={2} />
            </View>
            <Text style={{ color: '#fafafa', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>Compte en attente</Text>
            <Text style={{ color: '#a1a1aa', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
              Votre demande a bien été reçue. Un administrateur AMANE va vérifier vos justificatifs professionnels dans les meilleurs délais.{'\n\n'}
              Vous pouvez accéder à l'application dès maintenant, mais certaines fonctionnalités seront disponibles après validation.
            </Text>
            <Pressable
              onPress={() => { setPendingModalVisible(false); router.replace('/(tabs)'); }}
              style={{ backgroundColor: '#fbbf24', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }}
            >
              <Text style={{ color: '#09090b', fontWeight: '700', fontSize: 16 }}>Accéder à l'application</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <ArrowLeft size={20} color="#71717a" />
              <Text style={{ color: '#71717a', fontSize: 14 }}>Retour</Text>
            </Pressable>

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500).springify()} style={{ alignItems: 'center', marginBottom: 28 }}>
              <ExpoImage
                source={require('../assets/images/icon.png')}
                style={{ width: 80, height: 80, marginBottom: 16 }}
                contentFit="contain"
              />
              <Text style={{ color: '#fafafa', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Créer un compte</Text>
              <Text style={{ color: '#71717a', fontSize: 14, marginTop: 6, textAlign: 'center' }}>Rejoignez le réseau AMANE de santé communautaire</Text>
            </Animated.View>

            {/* Role selection */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Label>Votre rôle</Label>
              <View style={{ gap: 10, marginBottom: 20 }}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => { haptic.selection(); setRole(r.value); }}
                    style={{
                      borderRadius: 16, padding: 16,
                      backgroundColor: role === r.value ? r.bg : 'rgba(255,255,255,0.03)',
                      borderWidth: 1.5,
                      borderColor: role === r.value ? r.border : 'rgba(255,255,255,0.08)',
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                    }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: role === r.value ? r.color : '#52525b' }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: role === r.value ? '#fafafa' : '#a1a1aa', fontWeight: '700', fontSize: 15 }}>{r.label}</Text>
                      <Text style={{ color: role === r.value ? '#a1a1aa' : '#52525b', fontSize: 12, marginTop: 2 }}>{r.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 20, gap: 16 }}>
              {/* Full name */}
              <View>
                <Label>Nom complet</Label>
                <Controller control={control} name="full_name" render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="ex: Fatima Zahra El Mansouri" placeholderTextColor="#52525b" style={inputStyle} />
                )} />
                {errors.full_name && <ErrorText>{errors.full_name.message}</ErrorText>}
              </View>

              {/* Username */}
              <View>
                <Label>Identifiant de connexion</Label>
                <Controller control={control} name="username" render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="ex: relais_casa1" placeholderTextColor="#52525b" autoCapitalize="none" autoCorrect={false} style={inputStyle} />
                )} />
                {errors.username && <ErrorText>{errors.username.message}</ErrorText>}
              </View>

              {/* Phone */}
              <View>
                <Label>Téléphone (optionnel)</Label>
                <Controller control={control} name="phone" render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="ex: +212 6XX XXX XXX" placeholderTextColor="#52525b" keyboardType="phone-pad" style={inputStyle} />
                )} />
              </View>

              {/* Credential number — infirmier / médecin uniquement */}
              {needsCredential && selectedRole?.credentialLabel && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <BadgeCheck size={14} color={selectedRole.color} strokeWidth={2.5} />
                    <Text style={{ color: '#d4d4d8', fontWeight: '600', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {selectedRole.credentialLabel} <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                  </View>
                  <Controller control={control} name="credential_number" render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={selectedRole.credentialPlaceholder ?? ''}
                      placeholderTextColor="#52525b"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[inputStyle, { borderColor: selectedRole.border }]}
                    />
                  )} />
                  <Text style={{ color: '#71717a', fontSize: 11, marginTop: 5, marginLeft: 4 }}>
                    Ce numéro sera vérifié par un administrateur avant l'activation complète de votre compte.
                  </Text>
                  {errors.credential_number && <ErrorText>{errors.credential_number.message}</ErrorText>}
                </View>
              )}

              {/* Document justificatif — infirmier / médecin uniquement */}
              {needsCredential && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <ImageIcon size={14} color="#a855f7" strokeWidth={2.5} />
                    <Text style={{ color: '#d4d4d8', fontWeight: '600', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Document justificatif <Text style={{ color: '#71717a', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(recommandé)</Text>
                    </Text>
                  </View>

                  {/* Sélecteur de type de document */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {DOC_TYPES.map((dt) => (
                      <Pressable
                        key={dt.value}
                        onPress={() => { haptic.selection(); setDocType(dt.value); }}
                        style={{
                          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                          backgroundColor: docType === dt.value ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                          borderWidth: 1,
                          borderColor: docType === dt.value ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '500', color: docType === dt.value ? '#c084fc' : '#71717a' }}>
                          {dt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {docUri ? (
                    /* Aperçu du document sélectionné */
                    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.05)' }}>
                      <Image
                        source={{ uri: docUri }}
                        style={{ width: '100%', height: 150, resizeMode: 'cover' }}
                      />
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
                        <Text style={{ color: '#c084fc', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                          {DOC_TYPES.find((d) => d.value === docType)?.label}
                        </Text>
                        <Pressable onPress={() => { haptic.selection(); setDocUri(null); }} hitSlop={8}>
                          <Trash2 size={16} color="#f87171" strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    /* Boutons de capture */
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={pickDocFromCamera}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' }}
                      >
                        <Camera size={16} color="#c084fc" strokeWidth={2} />
                        <Text style={{ color: '#c084fc', fontSize: 13, fontWeight: '600' }}>Photographier</Text>
                      </Pressable>
                      <Pressable
                        onPress={pickDocFromGallery}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <ImageIcon size={16} color="#a1a1aa" strokeWidth={2} />
                        <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600' }}>Galerie</Text>
                      </Pressable>
                    </View>
                  )}
                  <Text style={{ color: '#52525b', fontSize: 11, marginTop: 6, marginLeft: 2 }}>
                    CIN, diplôme ou permis d'exercer — JPEG ou PNG, max 10 Mo
                  </Text>
                </View>
              )}

              {/* Password */}
              <View>
                <Label>Mot de passe</Label>
                <View style={{ position: 'relative' }}>
                  <Controller control={control} name="password" render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Min. 6 caractères" placeholderTextColor="#52525b" secureTextEntry={!showPwd} style={[inputStyle, { paddingRight: 48 }]} />
                  )} />
                  <Pressable onPress={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }} hitSlop={10}>
                    {showPwd ? <EyeOff size={18} color="#71717a" /> : <Eye size={18} color="#71717a" />}
                  </Pressable>
                </View>
                {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
              </View>

              {/* Confirm password */}
              <View>
                <Label>Confirmer le mot de passe</Label>
                <View style={{ position: 'relative' }}>
                  <Controller control={control} name="confirm_password" render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Répétez le mot de passe" placeholderTextColor="#52525b" secureTextEntry={!showConfirm} style={[inputStyle, { paddingRight: 48 }]} />
                  )} />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }} hitSlop={10}>
                    {showConfirm ? <EyeOff size={18} color="#71717a" /> : <Eye size={18} color="#71717a" />}
                  </Pressable>
                </View>
                {errors.confirm_password && <ErrorText>{errors.confirm_password.message}</ErrorText>}
              </View>
            </Animated.View>

            {/* Region */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: 20 }}>
              <Label>Région d'activité</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {REGIONS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => { haptic.selection(); setRegion(r); }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: region === r ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1,
                      borderColor: region === r ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '500', color: region === r ? '#6ee7b7' : '#a1a1aa' }}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Error */}
            {serverError && (
              <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginTop: 4, marginRight: 8 }} />
                <Text style={{ color: '#fca5a5', fontSize: 14, flex: 1 }}>{serverError}</Text>
              </Animated.View>
            )}

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ marginTop: 24 }}>
              <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting} style={{ borderRadius: 18, overflow: 'hidden', opacity: isSubmitting ? 0.7 : 1 }}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#09090b" />
                  ) : (
                    <>
                      <Text style={{ color: '#09090b', fontWeight: '700', fontSize: 16 }}>Créer mon compte</Text>
                      <ArrowRight size={18} color="#09090b" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.back()} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: '#71717a', fontSize: 14 }}>Déjà un compte ? <Text style={{ color: '#34d399', fontWeight: '600' }}>Se connecter</Text></Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: '#fafafa',
};

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: '#d4d4d8', fontWeight: '600', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{children}</Text>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: '#f87171', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{children}</Text>;
}
