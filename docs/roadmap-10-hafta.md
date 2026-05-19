# 📋 Talk2People — 10 Haftalık Proje Yol Haritası

> **TeamSpeak Benzeri İletişim Platformu (MVP)**
> Belge dili: Türkçe | Kod dili: JavaScript / JSX (TypeScript KESİNLİKLE yasak)

---

## 1. Projenin Kısa Tanımı

**Talk2People**
TeamSpeak / Discord benzeri bir gerçek zamanlı iletişim platformudur.

Kapsam:
- Kullanıcı yönetimi (kayıt, giriş, rol/yetki sistemi)
- Kanal yönetimi (metin kanalları, sesli kanal mimarisi hazırlığı)
- Gerçek zamanlı mesajlaşma (web + mobil)
- Sesli iletişim için mimari hazırlık (WebRTC/signaling altyapısı)
- Web istemcisi (Next.js) + Mobil istemci (React Native + Expo)
- Ortak RESTful backend API

Hedef: Katmanlı mimari, CRUD, kullanıcı/rol/yetki sistemi, web ve mobil istemci ile MVP teslimi.

---

## 2. Teknoloji Karar Alanları

| Katman | Seçenekler | Seçilen | Gerekçe |
|---|---|---|---|
| **Backend** | FastAPI / Next API / NestJS JS / Spring Boot | **NestJS (JavaScript modu)** | Katmanlı mimari (module/controller/service) doğal desteği; package-by-feature uyumu kolay; TS kullanmadan JS moduyla çalışır |
| **Veritabanı** | MongoDB / PostgreSQL / SQLite | **MongoDB** | Esnek şema; kanal/mesaj/kullanıcı gibi değişken yapılar için uygun; Mongoose ile ODM katmanı net ayrım sağlar |
| **Web Frontend** | — | **Next.js (JS/JSX)** | Zorunlu seçim; App Router; SSR/SSG/CSR esnekliği |
| **Mobil Frontend** | — | **React Native + Expo (JS/JSX)** | Zorunlu seçim; çapraz platform; web ile kod paylaşımı mümkün |

> ⚠️ TypeScript ASLA kullanılmayacak. Tüm dosyalar `.js` veya `.jsx` uzantılı olacak.
> NestJS'de `--language JS` flag'i ile başlatılacak.

---

## 3. Klasör Yapısı (Package by Feature)

```
talk2people/
├── backend/                        # NestJS (JavaScript modu)
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   │   ├── model/
│       │   │   ├── dto/
│       │   │   ├── repo/
│       │   │   ├── manager/
│       │   │   ├── service/
│       │   │   └── controller/
│       │   ├── users/
│       │   ├── roles/
│       │   ├── channels/
│       │   ├── messages/
│       │   └── voice/
│       └── shared/
│           ├── config/
│           ├── db/
│           ├── errors/
│           ├── utils/
│           ├── middleware/
│           ├── guards/
│           ├── constants/
│           ├── pagination/
│           └── response/
│
├── frontend-web/                   # Next.js (JS/JSX)
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── channels/
│       │   ├── messages/
│       │   └── admin/
│       └── shared/
│           ├── components/
│           ├── lib/
│           ├── hooks/
│           ├── services/
│           ├── utils/
│           └── constants/
│
├── frontend-mobile/                # React Native + Expo (JS/JSX)
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── channels/
│       │   ├── messages/
│       │   ├── profile/
│       │   └── admin/
│       └── shared/
│           ├── components/
│           ├── hooks/
│           ├── services/
│           ├── utils/
│           ├── constants/
│           └── navigation/
│
└── docs/
    ├── roadmap-10-hafta.md         ← bu dosya
    └── ...
```

---

## 4. Backend Katman Sorumlulukları

| Katman | Sorumluluk |
|---|---|
| **model** | Veritabanı şeması/mapping; iş kuralı YOK |
| **dto** | Request/response payload şemaları; validation kuralları |
| **repo** | Veri erişimi ve DB sorguları; iş kuralı YOK |
| **manager** | Use-case orkestrasyonu; birden fazla service/repo koordinasyonu |
| **service** | İş kuralları, domain kararları, yetki karar yardımcıları |
| **controller** | Route tanımı, DTO doğrulama, auth/permission bağlama, response dönüşü |

---

## 5. 10 Haftalık Detaylı Plan

---

### 📅 Hafta 1 — Proje Kurulumu ve Mimari Kararlar

**Hedefler:**
- Proje yol haritasını oluştur
- Teknoloji kararlarını belgele
- Klasör planını hazırla
- Kodlama kurallarını belgele

**Teknik Çıktılar (Deliverables):**
- `docs/roadmap-10-hafta.md` (bu dosya)
- `docs/kodlama-kurallari.md`
- Proje kök klasör yapısı (boş `README.md` dosyaları ile)

**Üretilecek Dosya Türleri:**
- `.md` (dokümantasyon)
- Klasör iskeletleri

**Riskler / Bağımlılıklar:**
- Teknoloji seçimi değişirse plan revize edilmeli
- Ekip üyeleri kurallar konusunda hemfikir olmalı

**Tamamlananlar / Kalanlar:**
- [x] `roadmap-10-hafta.md` oluşturuldu
- [x] `kodlama-kurallari.md` oluşturuldu

**Teknik Borçlar:** Yok (başlangıç haftası)

**Demo Senaryosu:** Klasör yapısını ve dokümanları göster.

---

### 📅 Hafta 2 — Backend Temel Kurulum

**Hedefler:**
- NestJS (JS modu) projesini kur
- MongoDB bağlantısını kur
- Shared katmanları oluştur
- Health endpoint ekle
- DTO validation altyapısını hazırla

**Teknik Çıktılar:**
- `backend/` NestJS projesi (JS modunda)
- `shared/config/` — environment config
- `shared/db/` — Mongoose bağlantısı
- `shared/errors/` — merkezi hata sınıfları
- `shared/response/` — standart response formatı
- `shared/pagination/` — pagination yardımcısı
- `GET /health` endpoint'i

**Üretilecek Dosya Türleri:**
- `.js` (NestJS modüller, config, middleware)
- `package.json`, `.env.example`

**Riskler / Bağımlılıklar:**
- NestJS JS modunun doğru kurulumu kritik
- MongoDB bağlantısı (Atlas veya local) önceden karar verilmeli

**Tamamlananlar / Kalanlar:**
- [x] NestJS kurulumu
- [x] MongoDB bağlantısı
- [x] Shared katmanlar

**Teknik Borçlar:** Yok

**Demo Senaryosu:** `GET /health` isteği; MongoDB bağlantı logu.

---

### 📅 Hafta 3 — Auth Feature (Kimlik Doğrulama)

**Hedefler:**
- Kullanıcı kayıt / giriş / çıkış
- Şifre hash'leme (bcrypt)
- JWT tabanlı auth
- Web auth ekran iskeletleri (Next.js)
- Mobil auth ekran iskeletleri (Expo)

**Teknik Çıktılar:**
- `backend/src/features/auth/` tüm katmanlar
- `backend/src/features/users/` temel katmanlar
- `frontend-web/src/features/auth/` — register/login sayfaları
- `frontend-mobile/src/features/auth/` — register/login ekranları

**Üretilecek Dosya Türleri:**
- `.js` (NestJS), `.jsx` (Next.js, Expo)

**Riskler / Bağımlılıklar:**
- JWT secret yönetimi `.env` üzerinden yapılmalı
- Refresh token vs. access-only karar verilmeli

**Tamamlananlar / Kalanlar:**
- [x] Auth backend
- [x] Auth web ekranları
- [x] Auth mobil ekranları

**Teknik Borçlar:** Refresh token ileri haftaya bırakılabilir

**Demo Senaryosu:** Kullanıcı kaydı ve girişi; JWT alımı; web + mobil ekran gösterimi.

---

### 📅 Hafta 4 — Rol / Yetki Sistemi ve Kullanıcı Yönetimi

**Hedefler:**
- Rol sistemi (admin, moderator, user)
- Guard/middleware yetki kontrolleri (backend)
- Kullanıcı listeleme + filtreleme + sıralama + sayfalama
- Web admin kullanıcı listesi
- Mobil kullanıcı ekranı (rol bazlı görünürlük)

**Teknik Çıktılar:**
- `backend/src/features/roles/` tüm katmanlar
- `backend/src/shared/guards/` — rol guard'ları
- `backend/src/features/users/` — listeleme endpoint'leri
- `frontend-web/src/features/admin/` — kullanıcı yönetim sayfası
- `frontend-mobile/src/features/users/` — kullanıcı listesi ekranı

**Üretilecek Dosya Türleri:**
- `.js` (NestJS guard, decorator), `.jsx` (Next.js, Expo)

**Riskler / Bağımlılıklar:**
- Yetki kontrolleri sadece UI'da değil, backend'de de zorunlu
- Pagination standartları bu hafta netleşmeli

**Tamamlananlar / Kalanlar:**
- [ ] Rol sistemi backend
- [ ] Guard'lar
- [ ] Kullanıcı listeleme
- [ ] Web admin sayfası
- [ ] Mobil kullanıcı ekranı

**Teknik Borçlar:** İnce yetki senaryoları ileriye alınabilir

**Demo Senaryosu:** Admin ile giriş; kullanıcı listesini filtrele/sırala/sayfalı gör; unauthorized erişimi engelle.

---

### 📅 Hafta 5 — Channels Feature (Kanal Yönetimi)

**Hedefler:**
- Kanal CRUD (oluştur/görüntüle/güncelle/sil)
- Kanal listeleme: filtreleme + sıralama + sayfalama
- Web kanal ekranları
- Mobil kanal ekranları

**Teknik Çıktılar:**
- `backend/src/features/channels/` tüm katmanlar
- `frontend-web/src/features/channels/` — kanal listesi ve detay sayfaları
- `frontend-mobile/src/features/channels/` — kanal ekranları

**Üretilecek Dosya Türleri:**
- `.js` (NestJS), `.jsx` (Next.js, Expo)

**Riskler / Bağımlılıklar:**
- Kanal modeli sesli kanal genişlemesine hazır olmalı
- Kanal üyeliği / erişim yetkisi tasarımı kritik

**Tamamlananlar / Kalanlar:**
- [ ] Kanal backend
- [ ] Web kanal sayfaları
- [ ] Mobil kanal ekranları

**Teknik Borçlar:** Kanal üyeliği sistemi ileriki haftada detaylandırılabilir

**Demo Senaryosu:** Kanal oluştur; listele; filtrele; sil; web + mobil eşzamanlı göster.

---

### 📅 Hafta 6 — Messages Feature (Mesajlaşma MVP)

**Hedefler:**
- Mesaj CRUD (gönder/görüntüle/sil yetkiyle)
- Mesaj listeleme: filtreleme + sıralama + sayfalama
- Web chat ekranı (MVP)
- Mobil chat ekranı (MVP)
- Realtime entegrasyon planı hazırla

**Teknik Çıktılar:**
- `backend/src/features/messages/` tüm katmanlar
- `frontend-web/src/features/messages/` — chat sayfası
- `frontend-mobile/src/features/messages/` — chat ekranı
- Realtime entegrasyon mimarisi dokümanı

**Üretilecek Dosya Türleri:**
- `.js` (NestJS), `.jsx` (Next.js, Expo), `.md` (mimari notu)

**Riskler / Bağımlılıklar:**
- Mesaj silme yetkisi (sadece kendi mesajı / moderator+)
- Realtime için WebSocket altyapısı planlama gerekir

**Tamamlananlar / Kalanlar:**
- [ ] Mesaj backend
- [ ] Web chat sayfası
- [ ] Mobil chat ekranı
- [ ] Realtime mimari notu

**Teknik Borçlar:** Realtime bağlantı Hafta 7'ye bırakılıyor

**Demo Senaryosu:** Kanala mesaj gönder; listele (sayfalı); yetkisiz silmeyi engelle.

---

### 📅 Hafta 7 — Realtime Chat Entegrasyonu

**Hedefler:**
- WebSocket entegrasyonu (NestJS Gateway)
- Kanal bazlı gerçek zamanlı mesajlaşma
- Presence / online durumu (MVP)
- Hata yönetimi ve edge-case'ler

**Teknik Çıktılar:**
- `backend/src/features/messages/` — WebSocket Gateway
- `frontend-web/src/features/messages/` — realtime chat güncelleme
- `frontend-mobile/src/features/messages/` — realtime chat güncelleme
- `backend/src/features/users/` — presence/online durumu

**Üretilecek Dosya Türleri:**
- `.js` (NestJS Gateway, hook), `.jsx` (Next.js, Expo)

**Riskler / Bağımlılıklar:**
- Mobil'de WebSocket bağlantı yönetimi dikkatli yapılmalı
- Auth token WebSocket handshake'te de doğrulanmalı

**Tamamlananlar / Kalanlar:**
- [ ] WebSocket gateway
- [ ] Web realtime güncelleme
- [ ] Mobil realtime güncelleme
- [ ] Presence sistemi

**Teknik Borçlar:** Reconnect stratejisi ileriye alınabilir

**Demo Senaryosu:** İki pencerede aynı kanal; mesaj anlık görünsün; online sayısı göster.

---

### 📅 Hafta 8 — Voice Chat Mimari Hazırlığı

**Hedefler:**
- Voice domain / model tasarımı
- Kanal / oturum mantığı (voice session)
- Kullanıcı durumları (mute / deafen / online)
- Signaling / entegrasyon noktaları için mimari hazırlık
- Web ve mobilde voice UI placeholder

**Teknik Çıktılar:**
- `backend/src/features/voice/` — model, dto, repo, service (iskelet)
- `frontend-web/src/features/channels/` — voice kanal UI placeholder
- `frontend-mobile/src/features/channels/` — voice kanal UI placeholder
- `docs/voice-mimari.md` — signaling planı belgesi

**Üretilecek Dosya Türleri:**
- `.js`, `.jsx`, `.md`

**Riskler / Bağımlılıklar:**
- WebRTC production entegrasyonu 10 hafta dışına taşınabilir
- Signaling sunucusu (mediasoup / Agora vb.) kararı bu hafta netleşmeli

**Tamamlananlar / Kalanlar:**
- [ ] Voice model
- [ ] Voice session mantığı
- [ ] Kullanıcı durumları
- [ ] UI placeholder'lar
- [ ] Mimari doküman

**Teknik Borçlar:** Tam WebRTC entegrasyonu kapsam dışı bırakılabilir

**Demo Senaryosu:** Voice kanalına "katıl" butonu; kullanıcı durumu (muted vs. online) görünümü.

---

### 📅 Hafta 9 — DRY Refactor ve Güvenlik Sertleştirme

**Hedefler:**
- DRY refactor (tekrarlayan kod ortaklaştırma)
- Yetki kontrollerini sertleştir
- Filtre / sort / pagination standardizasyonu
- Test ve demoya hazırlık
- Hata response formatı kontrolü

**Teknik Çıktılar:**
- `backend/src/shared/` — ortak validation, pagination, response güncellemeleri
- Tüm feature'larda konsistans kontrolü
- API dokümanı güncellemesi (Swagger / Postman collection)

**Üretilecek Dosya Türleri:**
- `.js` (refactor), `.md` (doküman güncellemesi)

**Riskler / Bağımlılıklar:**
- Refactor sırasında mevcut endpoint'ler bozulmamalı
- Regression testleri (manuel veya otomatik) önemli

**Tamamlananlar / Kalanlar:**
- [ ] DRY refactor
- [ ] Yetki sertleştirme
- [ ] Pagination standardizasyonu
- [ ] API dokümanı

**Teknik Borçlar:** Kapsamlı otomasyon testleri kapsam dışı bırakılabilir

**Demo Senaryosu:** Tüm CRUD endpoint'leri Postman'da çalıştır; hata response'larını göster.

---

### 📅 Hafta 10 — Final Polish ve Sunum Hazırlığı

**Hedefler:**
- Final polish (UI/UX iyileştirmeleri)
- Dokümantasyon tamamlama
- Demo / sunum hazırlığı
- Tüm haftalık video özetlerinin final revizyonu
- Bilinen borçların dökümantasyonu

**Teknik Çıktılar:**
- `docs/` — tüm dokümanlar güncel
- Sunum materyali
- Final demo senaryosu

**Üretilecek Dosya Türleri:**
- `.md` (doküman), `.jsx` (son UI iyileştirmeleri)

**Riskler / Bağımlılıklar:**
- Son dakika büyük değişiklik riski (yeni feature ekleme)
- Demo ortamı stabilitesi

**Tamamlananlar / Kalanlar:**
- [ ] UI polish
- [ ] Dokümantasyon
- [ ] Sunum hazırlığı
- [ ] Video revizyonları

**Teknik Borçlar:** Bilinen tüm borçlar belgelenerek teslim edilir

**Demo Senaryosu:** Uçtan uca tam akış: kayıt → giriş → kanal oluştur → mesajlaş → sesli kanal placeholder → admin paneli.

---

## 6. Haftalık Özet Video Şablonu

Her hafta sonunda aşağıdaki yapıda video özeti üretilecektir.

---

### 🎬 Örnek: Hafta 1 Video Özeti

**Video Başlığı:**
> Talk2People — Hafta 1: Proje Kurulumu ve Mimari Kararlar

**Konuşma Metni Taslağı (45–120 sn):**
> Bu videoda Talk2People projesinin ilk haftasını tamamladık. Proje, TeamSpeak benzeri bir
> iletişim platformunun üniversite MVP sürümüdür. Bu hafta teknolojiyi seçtik: Backend için
> NestJS JavaScript modu, veritabanı için MongoDB, web için Next.js ve mobil için React Native
> Expo kullandık. Package-by-feature klasör yapısını oluşturduk ve 10 haftalık yol haritamızı
> hazırladık. TypeScript kullanmama kararımız kesin — tüm kodlar JavaScript ile yazılacak.
> Sonraki hafta backend kurulumuna geçiyoruz.

**Ekran Kaydı Sahne Planı:**

| Sahne | İçerik |
|---|---|
| Sahne 1 | Proje kök klasör yapısı (VS Code'da); `docs/` içeriği |
| Sahne 2 | `roadmap-10-hafta.md` sayfası (bu doküman) |
| Sahne 3 | Web: (henüz yok — Next.js kurulumu Hafta 2'de) |
| Sahne 4 | Mobil: (henüz yok — Expo kurulumu Hafta 3'te) |
| Sahne 5 | Kapanış: 10 haftalık planın özeti; Hafta 2 hedefleri |

**Teknik Kazanımlar:**
- Teknoloji stack kesinleşti
- Package-by-feature mimarisi planlandı
- Katman sorumlulukları belirlendi
- 10 haftalık sprint planı oluşturuldu

**Sorunlar + Çözüm Özeti:**
- Sorun yok (başlangıç haftası)

**Sonraki Hafta Hedefi:**
- NestJS (JS modu) backend kurulumu
- MongoDB bağlantısı
- Shared katmanlar (config, errors, response, pagination)
- Health endpoint

> 📌 **Not:** Diğer haftaların video özetleri, o haftanın tüm çıktıları tamamlandıktan sonra doldurulacaktır.

---

## 7. Kurallara Uyum Kontrol Listesi

Her dosya üretiminde aşağıdaki liste kontrol edilecektir:

### ✅ TypeScript Yasağı
- [ ] `.ts` veya `.tsx` uzantılı hiçbir dosya oluşturulmadı
- [ ] Kod içinde `interface`, `type`, `generic`, `type annotation` kullanılmadı
- [ ] NestJS `--language JS` ile başlatıldı

### ✅ Tek Dosya Kuralı
- [ ] Yanıtta yalnızca 1 kod bloğu var
- [ ] Onay alınmadan ikinci dosyaya geçilmedi

### ✅ Package by Feature
- [ ] Her feature kendi klasöründe: `model/`, `dto/`, `repo/`, `manager/`, `service/`, `controller/`
- [ ] Layer-by-layer genel klasörleme yapılmadı
- [ ] Ortak yapılar sadece `shared/` altında

### ✅ Katmanlar (model / dto / repo / manager / service / controller)
- [ ] Her katmanın sorumluluğu net ayrılmış
- [ ] Controller'da business logic yok
- [ ] Repo'da iş kuralı yok
- [ ] Model'de iş kuralı yok

### ✅ DRY
- [ ] Tekrarlayan validation, error handling, pagination ortaklaştırıldı
- [ ] Auth/permission kontrolleri merkezi
- [ ] Aşırı soyutlama yapılmadı

### ✅ context7 MCP
- [ ] Next.js, React, NestJS, Mongoose, Expo dokümantasyonu için context7 kullanıldı
- [ ] Ezbere/eski bilgiyle framework kararı verilmedi

### ✅ Tahmin Yasağı
- [ ] Başka dosya içeriği gerekiyorsa tahmin yapılmadı; açıkça istendi
- [ ] Import path, fonksiyon adı, env değişkeni uydurulmadı

### ✅ API Response Standardı
- [ ] Başarı: `{ success: true, data, meta? }`
- [ ] Hata: `{ success: false, message, code, details? }`
- [ ] Liste meta: `{ page, limit, total, totalPages, sort, filters }`

---

## 8. Kritik Not

> ⛔ **ONAY ALINDIKTAN SONRA BİR SONRAKİ HAFTAYA GEÇİLECEKTİR.**
>
> Her hafta tamamlandığında, asistan kullanıcıdan açık onay alacaktır.
> Kullanıcı onay vermeden:
> - Yeni haftaya geçilmez
> - İkinci dosyaya geçilmez
> - TypeScript'e dönülmez
> - Package-by-feature dışına çıkılmaz
> - Mevcut dosyalar görülmeden refactor varsayılmaz
> - Backend API kontratı haber verilmeden değiştirilmez

---

*Son güncelleme: Hafta 1 — Başlangıç*
