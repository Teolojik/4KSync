# 🚀 Supabase Realtime & WebRTC Kurulum Talimatları

Bu proje, geleneksel bir Node.js/Socket.io sunucusu yerine WebRTC sinyalleşmesi (SDP Offers, Answers, ICE Candidates) için **Supabase Realtime** yayın (broadcast) kanallarını kullanmaktadır. 

Uygulamanızın sorunsuz çalışması için Supabase projenizde aşağıdaki adımları tamamlamanız gerekmektedir:

## 1. Veritabanı Şemasını Uygulayın (SQL)
Proje dizininde yer alan `supabase_schema.sql` dosyasının içeriğini kopyalayın.
Supabase panonuzda (Dashboard) **SQL Editor** bölümüne gidin ve kopyaladığınız kodu yapıştırıp "Run" tuşuna basarak çalıştırın. Bu komutlar şunları kuracaktır:
*   `rooms`, `participants` ve `room_media_state` (film senkronizasyonu için kritik) tabloları.
*   Row Level Security (RLS) politikaları.
*   Realtime yayınları için veritabanı replikasyonu (publication).

## 2. Realtime Ayarlarını Kontrol Edin
SQL dosyasındaki `ALTER PUBLICATION supabase_realtime ADD TABLE ...` komutları Realtime özelliğini tablolarınız için otomatik açacaktır. Emin olmak için:
1. Supabase Dashboard'da **Database** > **Replication** ayarlarına veya **Table Editor** üzerinden tabloların gelişmiş ayarlarına gidin.
2. `participants` ve `room_media_state` tablolarında "Realtime" seçeneğinin "On" (Açık) olduğundan emin olun.
3. Biz WebRTC sinyalleşmesi için Presence ve Broadcast kullanıyoruz. Bu özellikler public schema tablolarında Realtime ile sorunsuz çalışır.

## 3. Ortam Değişkenlerini Ekleyin (Environment Variables)
Projenizin ana dizininde (root) `.env.local` adlı bir dosya oluşturun ve Supabase "Project Settings > API" bölümünden alacağınız değerleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<SİZİN_PROJE_İDNİZ>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SİZİN_ANON_KEY_DEĞERİNİZ>
```

## 4. TURN Sunucu Ayarları (Önemli Uyarı)
`src/hooks/useWebRTC.ts` dosyasında `ICE_SERVERS` değişkeninde Google'ın ücretsiz STUN sunucularını tanımladık. Güvenli ağlarda (büyük şirket ağları, simetrik NAT arkası sistemler) WebRTC P2P bağlantısının sorunsuz kurulabilmesi için ücretsiz bir TURN sunucusu eklemeniz gerekebilir.  (Örn: [Metered.ca](https://www.metered.ca/stun-turn) veya [OpenRelay Project](https://openrelay.metered.ca/) üzerinden ücretsiz API alıp `urls: 'turn:...'` kısmını aktif edebilirsiniz).

## 5. Projeyi Çalıştırma
Her şey hazır! Uygulamayı başlatabilirsiniz:
```bash
npm run dev
```
