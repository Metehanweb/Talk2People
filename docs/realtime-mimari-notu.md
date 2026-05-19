# Hafta 7 — Realtime Chat (Socket.IO) Mimari Notu

Bu doküman, Hafta 7'de eklenecek olan gerçek zamanlı mesajlaşma altyapısının nasıl kurulacağını açıklar. Mevcut yapı (Hafta 6) tamamen HTTP (REST API) üzerinden çalışmaktadır.

## 1. Neden Socket.IO?
- NestJS ile %100 uyumlu çalışır (`@nestjs/websockets`, `@nestjs/platform-socket.io`).
- Cihaz bağlantısı koptuğunda otomatik yeniden bağlanma (auto-reconnect) özelliğine sahiptir.
- "Oda" (Room) mantığı vardır. Bir kanala giren kullanıcı o kanalın "odasına" katılır, böylece mesajlar sadece o kanaldakilere iletilir.

## 2. Kurulacak Paketler
```bash
# Backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io

# Web & Mobil Frontend
npm install socket.io-client
```

## 3. NestJS Gateway Tasarımı (`ChatGateway`)
Önerilen dosya: `src/features/messages/gateway/chat.gateway.js`

Gateway şu olayları (events) dinleyecek:
- `join_channel`: Kullanıcı bir kanala girdiğinde, o kanalın ID'si ile bir Socket.IO odasına (`room`) katılmasını sağlar.
- `leave_channel`: Kullanıcı kanaldan çıktığında odadan ayrılır.
- `send_message`: Yeni mesaj geldiğinde Gateway bu mesajı alır, veritabanına kaydetmesi için `MessagesService`'e gönderir ve ardından o odadaki herkese `new_message` olayı ile fırlatır (yayınlar).

## 4. Frontend Akışı (Web & Mobil)
1. Kullanıcı uygulamaya giriş yaptığında token ile Socket'e bağlanır.
2. `ChannelList` ekranından bir **Kanala tıklandığında**:
   - HTTP ile geçmiş mesajlar (`/channels/:id/messages`) çekilir.
   - Eş zamanlı olarak Socket üzerinden `join_channel` eventi gönderilir.
3. **Yeni bir mesaj geldiğinde**:
   - UI'daki mesaj state'ine (FlatList / React State) yeni mesaj anında eklenir (sayfa yenilemeye gerek kalmaz).
4. Kullanıcı kanaldan geri çıktığında `leave_channel` eventi gönderilir.

## 5. Güvenlik & Yetkilendirme (Auth)
WebSocket bağlantıları da JWT ile korunmalıdır. 
NestJS'teki normal `JwtAuthGuard`, WebSocket tabanlı istekleri doğrudan koruyamaz. Bu yüzden `WsJwtGuard` adında yeni bir Guard oluşturulup, bağlantı aşamasında (handshake/auth) token kontrol edilmelidir. Yalnızca geçerli JWT'si olanlar WebSocket'e bağlanıp mesaj gönderebilir/dinleyebilir.

---
**Özet Olarak Hafta 7 İş Yükü:**
1. Backend: ChatGateway ve WsJwtGuard yazılacak.
2. Web: `socket.io-client` ile `ChatPage.jsx` bağlanacak.
3. Mobil: `socket.io-client` ile `ChatScreen.js` bağlanacak.
