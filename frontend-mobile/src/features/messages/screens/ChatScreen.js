import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { messagesService, channelsService, authService } from '../../../shared/api/api';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export default function ChatScreen({ route, navigation }) {
    const { channelId } = route.params;
    const [channel, setChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [meta, setMeta] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        checkAuth();
        fetchChannel();
        fetchMessages();
    }, []);

    useEffect(() => {
        const initSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            socketRef.current = io(SOCKET_URL, {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_channel', channelId);
            });

            socketRef.current.on('new_message', (msg) => {
                // Inverted FlatList olduğu için yeni mesajı en başa (üstte görünecek şekilde) ekliyoruz
                setMessages((prev) => [msg, ...prev]);
            });

            socketRef.current.on('exception', (err) => {
                console.error('Socket Hatası:', err);
                Alert.alert('Bağlantı Hatası', err.message || 'Sunucu ile bağlantı kurulamadı');
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave_channel', channelId);
                socketRef.current.disconnect();
            }
        };
    }, [channelId]);

    async function checkAuth() {
        try {
            const res = await authService.getMe();
            setCurrentUser(res.data.user);
        } catch { }
    }

    async function fetchChannel() {
        try {
            const res = await channelsService.getChannelById(channelId);
            setChannel(res.data);
            navigation.setOptions({ title: res.data.tur === 'voice' ? `🔊 ${res.data.ad}` : `💬 ${res.data.ad}` });
        } catch { }
    }

    async function fetchMessages() {
        setLoading(true);
        try {
            const res = await messagesService.getMessages(channelId, { limit: 50 });
            setMessages(res.data || []);
            setMeta(res.meta);
        } catch (err) {
            Alert.alert('Hata', err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend() {
        if (!newMessage.trim() || !socketRef.current) return;
        try {
            // WebSocket üzerinden gönderiyoruz
            socketRef.current.emit('send_message', {
                channelId,
                icerik: newMessage.trim()
            });
            setNewMessage('');
        } catch (err) {
            Alert.alert('Hata', err.message);
        }
    }

    async function handleDelete(messageId) {
        Alert.alert('Sil', 'Bu mesajı silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil', style: 'destructive', onPress: async () => {
                    try {
                        await messagesService.deleteMessage(channelId, messageId);
                        fetchMessages();
                    } catch (err) { Alert.alert('Hata', err.message); }
                }
            }
        ]);
    }

    function renderMessage({ item }) {
        const isOwn = item.gonderen?._id === currentUser?._id;
        const isAdmin = currentUser?.role === 'admin';

        return (
            <View style={[styles.msgContainer, isOwn ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.msgBubble, isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther]}>
                    {!isOwn && <Text style={styles.msgSender}>{item.gonderen?.username || 'Bilinmeyen'}</Text>}
                    <Text style={[styles.msgText, isOwn ? styles.textWhite : styles.textBlack]}>{item.icerik}</Text>
                    <View style={styles.msgFooter}>
                        <Text style={[styles.msgTime, isOwn ? styles.textLightWhite : styles.textGray]}>
                            {new Date(item.olusturulma_tarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {(isOwn || isAdmin) && (
                            <TouchableOpacity onPress={() => handleDelete(item._id)}>
                                <Text style={[styles.deleteText, isOwn ? styles.textLightWhite : styles.textRed]}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    if (loading && messages.length === 0) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null} keyboardVerticalOffset={90}>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                inverted // Mesaj listesi alttan yukarı dökülür
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>İlk mesajı sen gönder! 🎉</Text>}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Mesajınızı yazın..."
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                    <Text style={styles.sendBtnText}>Gönder</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 16, paddingVertical: 16 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
    msgContainer: { marginVertical: 4, flexDirection: 'row' },
    msgLeft: { justifyContent: 'flex-start' },
    msgRight: { justifyContent: 'flex-end' },
    msgBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
    msgBubbleOwn: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
    msgBubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
    msgSender: { fontSize: 12, fontWeight: '700', color: '#3b82f6', marginBottom: 4 },
    msgText: { fontSize: 15, lineHeight: 20 },
    textWhite: { color: '#fff' },
    textBlack: { color: '#111' },
    msgFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 12 },
    msgTime: { fontSize: 11 },
    textLightWhite: { color: 'rgba(255,255,255,0.7)' },
    textGray: { color: '#9ca3af' },
    deleteText: { fontSize: 13, fontWeight: '700' },
    textRed: { color: '#dc2626' },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
    input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
    sendBtn: { marginLeft: 12, backgroundColor: '#3b82f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
    sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 }
});
