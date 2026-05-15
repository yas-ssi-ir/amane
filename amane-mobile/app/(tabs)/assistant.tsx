import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Bot, Send, Trash2, User } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chatApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantScreen() {
  const t = useT();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('assistant_welcome') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    scrollDown();

    try {
      const { reply } = await chatApi.send(messages, text);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      console.error('[Assistant]', e.message);
      setMessages([...next, { role: 'assistant', content: t('assistant_error') }]);
    } finally {
      setLoading(false);
      scrollDown();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : tabBarHeight}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-5 py-3 border-b border-white/[0.06] flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 items-center justify-center">
              <Bot size={20} color="#34d399" />
            </View>
            <View>
              <Text className="text-zinc-100 font-semibold text-sm">{t('assistant_title')}</Text>
              <Text className="text-zinc-500 text-xs">{t('assistant_subtitle')}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setMessages([{ role: 'assistant', content: t('assistant_welcome') }])}
            hitSlop={10}
            className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 items-center justify-center"
          >
            <Trash2 size={15} color="#71717a" />
          </Pressable>
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(i === 0 ? 0 : 50).duration(300)}
              style={{ marginBottom: 12, flexDirection: 'row', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.role === 'assistant' && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginRight: 8, flexShrink: 0 }}>
                  <Bot size={14} color="#34d399" />
                </View>
              )}
              <View
                style={{
                  maxWidth: '75%',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 18,
                  borderTopLeftRadius: msg.role === 'assistant' ? 4 : 18,
                  borderTopRightRadius: msg.role === 'user' ? 4 : 18,
                  backgroundColor: msg.role === 'user' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: msg.role === 'user' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ fontSize: 14, lineHeight: 20, color: msg.role === 'user' ? '#d1fae5' : '#e4e4e7' }}>
                  {msg.content}
                </Text>
              </View>
              {msg.role === 'user' && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#27272a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginLeft: 8, flexShrink: 0 }}>
                  <User size={14} color="#a1a1aa" />
                </View>
              )}
            </Animated.View>
          ))}

          {loading && (
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Bot size={14} color="#34d399" />
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#34d399" />
                <Text style={{ color: '#71717a', fontSize: 14 }}>{t('assistant_thinking')}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant_placeholder')}
            placeholderTextColor="#52525b"
            multiline
            maxLength={500}
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, color: '#fafafa', fontSize: 14, maxHeight: 120 }}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              backgroundColor: input.trim() && !loading ? '#10b981' : 'rgba(255,255,255,0.04)',
              borderWidth: input.trim() && !loading ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Send size={18} color={input.trim() && !loading ? '#09090b' : '#52525b'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
