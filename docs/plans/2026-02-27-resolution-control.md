# Yayın Kalitesi ve Çözünürlük Seçici (Resolution Control) Planı

> **For Gemini:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** Kullanıcıların internet ve donanım limitlerine göre ekran paylaşım kalitesini değiştirebileceği (1080p, 1440p, 4K) bir arayüz ve mantık geliştirmek.

**Architecture:** Modüler React bileşenleri, WebRTC getDisplayMedia constraints manipülasyonu.

**Tech Stack:** Next.js, WebRTC, Tailwind CSS, Lucide Icons.

---

### Task 1: ControlBar UI Güncellemesi
*ControlBar'da "4K Share" butonu yerine, çözünürlük seçebileceğimiz bir açılıp-kapanan menü (Dropdown/Select) eklenmesi.*

**Files:**
- Modify: `src/features/webrtc/ui/ControlBar.tsx`

**Step 1:** `ControlBarProps` arayüzüne (1080p, 1440p, 2160p) gibi string parametreler alan yeni bir fonksiyon ekle.
**Step 2:** "4K Share" butonunu çıkart, yerine Lucide ikonu içeren modern bir (Glassmorphism veya dark) `<select>` veya dropdown menüsü yerleştir.

---

### Task 2: useWebRTC.ts Resolution Desteği
*Hook'un paylaşılan kaliteye göre getDisplayMedia constraint'lerini ve maxBitrate'i ayarlaması.*

**Files:**
- Modify: `src/features/webrtc/hooks/useWebRTC.ts`

**Step 1:** `startScreenShare` fonksiyonunu `resolution: '1080p' | '1440p' | '4k'` parametresi alacak şekilde refaktör et.
**Step 2:** Seçilebilecek her kalite için ayrı bir konfigürasyon (bitrate, frameRate, width, height) ayarla:
  - 1080p: w:1920, h:1080, maxBitrate: 4Mbps, 30fps
  - 1440p: w:2560, h:1440, maxBitrate: 8Mbps, 60fps
  - 4K: w:3840, h:2160, maxBitrate: 20Mbps, 60fps
**Step 3:** Seçilen kaliteye göre `syncVideoConstraints` içindeki maxBitrate limitini dinamikleştir.

---

### Task 3: page.tsx Entegrasyonu
*Ana sayfanın yeni ControlBar'ı ve useWebRTC'yi haberleştirmesi.*

**Files:**
- Modify: `src/app/room/[id]/page.tsx`

**Step 1:** `ControlBar`'dan gelen kalite seçimini `startScreenShare(quality)` şeklinde pasla ve değişiklik anında akışın kopmadan yeni ekran paylaşımı penceresi açmasını sağla.

Bu işlem, düşük internet hızlarında bile izleyicilere kesintisiz bir deneyim sunacaktır.
