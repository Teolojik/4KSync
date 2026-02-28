# 🔍 Kapsamlı Proje Analiz Raporu (Research Report)

## Mevcut Durum (Ne Yapıldı?)
1. **Veritabanı ve Şema**: Supabase `rooms`, `participants`, `room_media_state` tabloları hazır.
2. **Next.js Mimaris**: Tailwind CSS ve temel yapı kurulu.
3. **P2P Temeli**: `useWebRTC.ts` ile basic SDP/ICE değişimi ve Supabase Realtime bağlantısı sağlandı.
4. **Anayasa**: `GEMINI.md`, `SKILL_EXPERT.md` ve Memory Bank sistemi kusursuz olarak entegre edildi.

## Tespit Edilen Eksiklikler (GAP Analizi)

### 1. Modüler Arayüz (Architecture/UI)
*   **Sorun:** Şu an `app/room/[id]/page.tsx` dosyası çok büyük (monolithic). Video gösterimi, katılımcı listesi ve butonlar aynı dosyanın içinde.
*   **Çözüm:** `src/components/` klasörü açılmalı. `VideoPlayer`, `ParticipantGrid`, `ControlBar`, ve `ChatBox` gibi modüler bileşenlere (component) bölünmeli.

### 2. Film Senkronizasyon Mantığı (Media Sync)
*   **Sorun:** Veritabanımızda `room_media_state` adında bir tablo var ancak bu tabloyu frontend tarafında dinleyen veya güncelleyen bir hook yok. Odaya giren bir kişi videoyu durdurduğunda diğerlerinde durmuyor.
*   **Çözüm:** Supabase'in yayın (broadcast) özelliği veya doğrudan RLS korumalı DB update'leri kullanılarak `useMediaSync` hook'u yazılmalı. Sadece `host_id` yetkisine sahip kişi videoyu kontrol edebilmeli.

### 3. Gerçek "Cinematic Audio" (Ses Kodlaması)
*   **Sorun:** Mevcut WebRTC yapılandırmasında `echoCancellation` sadece `getUserMedia` isteğinde kapatılmış durumda. Ancak `RTCRtpSender` tarafında ses bit hızı (bitrate) ve stereo özelliklerini zorlayan (force) SDP parametreleri eklenmemiş.
*   **Çözüm:** Ses track'lerini gönderirken SDP munging veya `setParameters` ile "stereo=1; sprop-stereo=1; maxaveragebitrate=510000" gibi Opus codec parametreleri zorlanmalı.

### 4. Anlık Sohbet Sistemi (Chat)
*   **Sorun:** Kullanıcıların odaya katılma/ayrılma bilgisi Realtime üzerinden geliyor ancak konuşabilecekleri bir metin (text) sohbeti yok.
*   **Çözüm:** DataChannel üzerinden (düşük gecikme) veya Supabase Broadcast üzerinden çalışan bir chat bileşeni eklenmeli.

---

## 🚀 Sonraki Adım: Aksiyon Planı
Bu tespitlerin ışığında, Vibe Coder `writing-plans` yeteneği (skill) kurallarına uygun olarak adım adım uygulanabilir bir kodlama planı oluşturulmuştur. Plan dosyası `docs/plans/2026-02-27-webrtc-core-features.md` dizinine kaydedilecektir. Yürütme kararı verildiğinde bu plan görev görev uygulanacaktır.
