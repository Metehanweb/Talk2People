# 📐 Talk2People — Kodlama Kuralları

> Belge dili: Türkçe | Kapsam: Backend, Web Frontend, Mobil Frontend
> Bu kurallar tüm haftalarda geçerlidir ve asla ihlal edilmez.

---

## 1. Dil Kuralı — TypeScript KESİNLİKLE YASAK

- Tüm dosyalar `.js` veya `.jsx` uzantılı olacak.
- `.ts`, `.tsx` uzantılı hiçbir dosya oluşturulmaz.
- Kod içinde aşağıdakiler **kesinlikle kullanılmaz**:
  - `interface`, `type`, `enum` (TypeScript anlamında)
  - `: string`, `: number`, `: boolean` gibi tip anotasyonları
  - Generic syntax: `Array<T>`, `Promise<T>`, `Record<K,V>` vb.
- NestJS her zaman `--language JS` flag'i ile başlatılır.

---

## 2. Tek Dosya Kuralı

- Her yanıtta yalnızca **1 dosya** üretilir veya düzenlenir.
- Bir dosya tamamlanıp onay alınmadan ikinci dosyaya geçilmez.
- Onay kelimesi: kullanıcının açık "tamam", "devam", "onayla" vb. ifadesi.

---

## 3. Package by Feature Mimarisi ve Klasör Yapısı

```
src/
├── core/              ← Teknik altyapı (config, database)
├── base/              ← DRY merkezi (BaseModel, BaseRepo, BaseManager)
├── shared/            ← Ortak araçlar (guards, middleware, utils, response)
├── features/
│   ├── auth/
│   ├── users/
│   ├── channels/
│   ├── messages/
│   └── voice/
└── main.js
```

- Her feature kendi klasöründe barındırılır.
- Layer-by-layer genel klasörleme (`controllers/`, `services/` gibi üst klasörler) yapılmaz.

### core/ Klasörü
- Projenin teknik altyapısını içerir: veritabanı bağlantısı, konfigürasyon, global hata yakalayıcılar.
- Feature'lardan bağımsızdır.

### base/ Klasörü (DRY Merkezi)
- `BaseModel.js`: Tüm Mongoose schema'larının miras alacağı ortak alanlar.
- `BaseRepo.js`: Full CRUD, filtreleme, sıralama, sayfalama, soft/hard delete.
- `BaseManager.js`: Temel iş mantığı. Constructor'dan repo alır (Dependency Injection).
- Yeni bir feature eklerken, model/repo/manager **base sınıflardan** miras alır.

### shared/ Klasörü
- Guards, middleware, response helper, constants gibi feature'a özgü olmayan araçlar burada.
- Yeni bir ortak yapı eklemeden önce mutlaka sorulur.

---

## 4. Backend Katman Sorumlulukları

| Katman | Sorumluluk | Yasak |
|---|---|---|
| **model** | DB şeması / Mongoose schema. BaseModel'den miras alır. | İş kuralı, validation mantığı |
| **dto** | Request/response payload şemaları, `class-validator` dekoratörleri | DB erişimi, iş kuralı |
| **repo** | Mongoose sorguları. BaseRepo'dan miras alır. | İş kuralı, başka repo çağrısı |
| **service** | Domain iş kuralları, yetki yardımcıları | Doğrudan DB erişimi |
| **manager** | Use-case orkestrasyonu. Gerekirse BaseManager'dan miras alır. | Doğrudan DB erişimi |
| **controller** | Route tanımı, DTO doğrulama, auth/permission bağlama, response dönüşü | Business logic |

> Her katman **tek bir sorumluluğa** sahiptir. Sınır ihlali teknik borç sayılır.

---

## 5. BaseModel Zorunlu Alanları

Her model (schema) aşağıdaki alanları BaseModel'den miras alır:

| Alan | Tip | Açıklama |
|---|---|---|
| `ad` | String (required) | Kaydın adı |
| `kisa_ad` | String | Kod adı veya kısaltma |
| `aciklama` | String | Açıklama metni |
| `etiketler` | [String] | Etiketler dizisi |
| `aktif_mi` | Boolean (default: true) | Aktiflik durumu |
| `silindi_mi` | Boolean (default: false) | Soft delete bayrağı |
| `olusturulma_tarihi` | Date (auto) | Oluşturulma zamanı |
| `degistirilme_tarihi` | Date (auto) | Son değişiklik zamanı |

---

## 6. Soft Delete Kuralı

- Kayıtlar varsayılan olarak fiziksel silinmez, `silindi_mi = true` yapılır.
- Tüm sorgular otomatik olarak `silindi_mi: false` filtresi uygular.
- Cascade soft delete: Ana kayıt silindiğinde bağlı alt kayıtlar da `silindi_mi = true` yapılır.
- Hard delete yalnızca özel durumlarda kullanılır.

---

## 7. API Response Standardı

Tüm endpoint'ler aşağıdaki format ile yanıt döner:

**Başarı (tekil):**
```json
{ "success": true, "data": { } }
```

**Başarı (liste):**
```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "page": 1, "limit": 20, "total": 100, "totalPages": 5,
    "sort": "createdAt:desc", "filters": { }
  }
}
```

**Hata:**
```json
{ "success": false, "message": "Hata açıklaması", "code": "ERROR_CODE", "details": { } }
```

---

## 8. Katmanlı Mimari Altın Kurallar

1. **Tek Yönlü Bağımlılık:** Controller → Manager → Repo → Model. Asla ters yönde çağrı yapılmaz.
2. **Şişman Manager, Zayıf Controller:** İş mantığı sadece Manager'da olur. Controller sadece yönlendirici, Repo sadece sorgu işçisidir.
3. **Modelleri Dışarı Sızdırma:** Veritabanı modeli asla doğrudan API'den dönmez. DTO/toJSON ile filtrelenir.
4. **Sıkı Bağımlılıklardan Kaçınma:** Katmanlar birbirini `new` ile yaratmaz. Dependency Injection kullanılır.

---

## 9. DRY (Don't Repeat Yourself)

- Tekrarlayan validation, error handling, pagination, response kodu **`shared/`** altında ortaklaştırılır.
- Standart CRUD işlemleri **`base/`** altında merkezileştirilir, feature'lar miras alır.
- Auth/permission kontrolleri merkezi guard/middleware ile yönetilir.
- **Aşırı soyutlama da teknik borçtur.** 2'den fazla yerde kullanılmayan kod ortaklaştırılmaz.

---

## 10. Environment ve Güvenlik

- Tüm gizli bilgiler (JWT secret, DB URI, port vb.) `.env` dosyasında tutulur.
- `.env` dosyası Git'e commit edilmez; `.env.example` şablon olarak commit edilir.
- JWT secret minimum 32 karakter uzunluğunda belirlenir.

---

## 11. Hata Yönetimi

- Backend'de merkezi exception filter kullanılır (`shared/errors/`).
- Her olası hata için anlamlı HTTP kodu ve `code` alanı döner.
- `try/catch` bloğu controller'da yazılmaz; exception filter yakalar.
- Frontend'de API hataları merkezi bir `apiService` katmanı üzerinden yakalanır.

---

## 12. İsimlendirme Kuralları

| Öğe | Kural | Örnek |
|---|---|---|
| Dosya | kebab-case | `auth.service.js`, `create-user.dto.js` |
| Sınıf / Fonksiyon | PascalCase (sınıf), camelCase (fonksiyon) | `AuthService`, `createUser()` |
| Değişken | camelCase | `accessToken`, `userId` |
| Sabit | UPPER_SNAKE_CASE | `JWT_EXPIRES_IN` |
| MongoDB koleksiyon | PascalCase (Mongoose model adı) | `User`, `Channel`, `Message` |
| Route | kebab-case | `/api/v1/auth/register`, `/api/v1/channels` |

---

## 13. Import Kuralları

- Göreli import kullanılır: `./`, `../`
- Alias (`@/`) kullanımı için `jsconfig.json` ayarı yapılmadan alias eklenmez.
- Import path tahmin edilmez; dosya gerçekten oluşturulduktan sonra import yazılır.

---

## 14. context7 MCP Kuralı

- Next.js, React, NestJS, Mongoose, Expo ile ilgili API/hook/dekoratör kullanımlarında **context7 MCP** üzerinden güncel dokümantasyon okunur.
- Ezbere veya eski bilgiyle framework kararı verilmez.

---

## 15. Tahmin Yasağı

- Başka bir dosyanın içeriği gerekiyorsa tahmin yapılmaz; dosya açıkça istenir veya okunur.
- Import path, fonksiyon adı, env değişken adı uydurulmaz.
- Schema/DTO alanları varsayılmaz; model dosyası görülmeden yazılmaz.

---

## 16. Onay Mekanizması

> ⛔ Her hafta tamamlandığında kullanıcıdan açık onay alınır. Onay gelmeden:
> - Yeni haftaya geçilmez.
> - İkinci dosyaya geçilmez.
> - TypeScript'e dönülmez.
> - Package-by-feature dışına çıkılmaz.
> - Mevcut dosyalar görülmeden refactor varsayılmaz.
> - Backend API kontratı haber verilmeden değiştirilmez.

---

*Son güncelleme: Hafta 3 Sonu — Backend Mimari Refactor*
