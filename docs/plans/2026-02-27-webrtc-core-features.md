# WebRTC Core Features Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use `executing-plans` (or systematic execution) to implement this plan task-by-task.

**Goal:** Next.js projesine modüler UI bileşenleri eklemek, Film Senkronizasyon (Host) mekanizmasını kurmak, Cinematic Audio SDP ayarlarını yapmak ve Chat sistemini entegre etmek.
**Architecture:** Modüler React bileşenleri, Data Channels (veya Supabase Broadcast) üzerinden Chat ve Sync state yönetimi.
**Tech Stack:** Next.js, WebRTC, Supabase Realtime, Tailwind CSS.

---

### Task 1: Component Mimarisini Kurmak (UI/Architecture)

**Files:**
- Create: `src/components/ControlBar.tsx`
- Create: `src/components/ParticipantGrid.tsx`
- Create: `src/components/ChatBox.tsx`

**Step 1:** İlgili dosyaları boş fonksiyon şablonlarıyla (prop tanımları dahil) oluştur.
**Step 2:** `src/app/room/[id]/page.tsx` içindeki devasa JSX bloklarını bu yeni bileşenlere aktar.
**Step 3:** Çalıştırıp (npm run dev) arayüzün bozulmadan modüler hale geldiğini test et.

---

### Task 2: Yüksek Kaliteli (Cinematic) Ses Kodlaması

**Files:**
- Modify: `src/hooks/useWebRTC.ts`

**Step 1:** `syncVideoConstraints` fonksiyonuna ek olarak `syncAudioConstraints` mantığı ekle.
**Step 2:** `pc.createOffer` ve `createAnswer` sonrasında SDP üzerinde string bazlı değişiklik (SDP munging) yaparak `stereo=1; sprop-stereo=1; maxaveragebitrate=510000` ekle.
**Step 3:** Gerçek bağlantıda uygulandığını doğrula.

---

### Task 3: Oynatıcı Senkronizasyonu (Host Modu)

**Files:**
- Create: `src/hooks/useMediaSync.ts`
- Modify: `src/app/room/[id]/page.tsx`

**Step 1:** Supabase'in `room_media_state` tablosunu Broadcast veya direct db üzerinden dinleyen ve yerel `video` etiketinin `currentTime` değerini güncelleyen bir hook yaz.
**Step 2:** Host olmayanların `video` etiketinde kontrolleri kilitle. Play/Pause/Seek eventlerini Supabase'e yolla (Eğer user Host ise).

---

### Task 4: Metin Sohbeti (Chat) Entegrasyonu

**Files:**
- Modify: `src/hooks/useWebRTC.ts`
- Modify: `src/components/ChatBox.tsx`

**Step 1:** `useWebRTC` içine Supabase Broadcast tabanlı chat mesajı (Type: 'chat-message') yollama mekanizması ekle.
**Step 2:** `ChatBox` arayüzüne gelen mesajları array state olarak listele ve "Glassmorphism" tasarımıyla stillendir.

---

## Execution Handoff
Bu plan `docs/plans/2026-02-27-webrtc-core-features.md` konumuna kaydedilmiştir. Tüm görevler "Bite-Sized" (Küçük Lokmalar) yaklaşımına göre tasarlanmıştır.

Sistem her bir görevi tek tek, hata çıkarsa `systematic-debugging` kuralını işleterek ayağa kaldıracaktır.
