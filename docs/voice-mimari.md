# Hafta 8 — Voice Chat Mimari Notu

Bu doküman, Talk2People projesinin **Hafta 8** kapsamında hazırlanan sesli iletişim mimari planını açıklar.

> **Önemli:** Bu hafta WebRTC **entegre edilmedi** — mimari zemin ve UI placeholder'lar oluşturuldu. Tam entegrasyon proje kapsamı dışındadır.

---

## 1. Bu Hafta Yapılanlar

### Backend: `features/voice/`
| Dosya | Açıklama |
|---|---|
| `model/voice-session.model.js` | VoiceSession şeması: kanal, kullanıcı, mute/deafen, oturum süreleri |
| `repo/voice-session.repo.js` | Aktif katılımcı listeleme, oturum bulma |
| `service/voice.service.js` | Join / leave / status update logic'i |
| `controller/voice.controller.js` | REST API endpoint'leri |
| `voice.module.js` | NestJS modül tanımı |

**Aktif Endpoint'ler:**
- `POST /channels/:id/voice/join` — Kanala katıl
- `DELETE /channels/:id/voice/leave` — Kanaldan ayrıl
- `PATCH /channels/:id/voice/status` — Mute/deafen durumunu güncelle
- `GET /channels/:id/voice/participants` — Aktif katılımcıları listele

### Web & Mobil: UI Placeholder
- Voice kanal kartlarına tıklandığında artık ayrı bir **Voice ekranına** yönlendirme yapılıyor.
- Ekranda **katılımcı listesi**, **katıl/ayrıl butonu**, **mute/deafen kontrolleri** ve bir `🚧 Yakında` banner'ı mevcut.

---

## 2. Planlanan WebRTC Mimarisi (Hafta 9-10 / Kapsam Dışı)

```
Kullanıcı A (Browser/Mobile)
    |
    |--(1) WebSocket Signaling --> NestJS VoiceGateway
    |                                   |
    |                              MongoDB (VoiceSession)
    |
    |--(2) SDP Offer/Answer -------> Kullanıcı B
    |
    |--(3) ICE Candidates ---------> Kullanıcı B
    |
    |--(4) P2P Medya Akışı (WebRTC RTCPeerConnection) ----> Kullanıcı B
```

### 2.1 Signaling Sunucusu Alternatifleri

| Seçenek | Artı | Eksi |
|---|---|---|
| **Native WebRTC + NestJS Gateway** | Bağımlılık yok, tam kontrol | Kompleks TURN/STUN yönetimi |
| **mediasoup** | Yüksek kalite SFU, ölçeklenebilir | Kurulum karmaşık, ek sunucu gerekir |
| **Agora SDK** | Hazır, kolay entegrasyon | Ücretli, 3rd party bağımlılık |
| **LiveKit** | Açık kaynak SFU, Docker ready | İlk kurulum süresi |

> **Öneri:** MVP için **Native WebRTC** (tarayıcı P2P) yeterli. Ölçekleme gerekirse **LiveKit** tercih edilmeli.

---

## 3. VoiceSession Modeli Açıklaması

```js
{
  kanal: ObjectId,           // Hangi kanal
  kullanici: ObjectId,       // Hangi kullanıcı
  sessiz_mi: Boolean,        // Mikrofon kapalı mı (muted)
  sagir_mi: Boolean,         // Ses kapalı mı (deafened)
  katilma_tarihi: Date,      // Oturum başlangıcı
  ayrilma_tarihi: Date,      // Oturum bitişi (null = aktif)
  aktif_mi: Boolean,         // Mevcut oturum aktif mi
}
```

---

## 4. Gelecek Hafta İçin Notlar (Hafta 9 — DRY Refactor)
- Mevcut feature'larda tekrarlayan validation ve pagination kodları ortak bir katmana taşınacak.
- Tüm CRUD endpoint'lerinin response formatları kontrol edilecek.
- `VoiceModule`'un WebRTC entegrasyonu için `VoiceGateway` hook noktası hazır bırakıldı.
