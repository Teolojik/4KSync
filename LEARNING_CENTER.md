# 🎓 Skill Öğrenme Merkezi (Skill Learning Center)

Hoş geldin! Bu merkez, bir **Vibe Coder** olarak yapay zekayı ve Antigravity araçlarını en üst seviyede kullanmanı sağlamak için tasarlandı.

## 🚀 Hızlı Başlangıç: Temel Eğitim Paketleri

Aşağıdaki skill'ler, AI ile kod yazarken "sihri" kontrol etmeni sağlar:

### 1. [Systematic Debugging](file:///.agent/skills/systematic-debugging/SKILL.md)
**Neden Öğrenmelisin?** AI bazen hatalı kod yazabilir. Bu skill, o hataları tahmin etmek yerine "kanıtlarla" bulmanı sağlar. Rastgele denemelerle vakit kaybetmezsin.

### 2. [Writing Plans](file:///.agent/skills/writing-plans/SKILL.md)
**Neden Öğrenmelisin?** "Şunu yap" demek yerine adım adım plan yapmak, karmaşık projeleri çocuk oyuncağına dönüştürür. Büyük lokmaları küçük parçalara böler.

### 3. [Brainstorming](file:///.agent/skills/brainstorming/SKILL.md)
**Neden Öğrenmelisin?** Sadece kod değil, fikir aşamasında da AI'dan maksimum verim almanı sağlar.

### 4. [Smart Commit](file:///.agent/skills/smart-commit/SKILL.md)
**Neden Öğrenmelisin?** Değişikliklerini analiz eder ve mükemmel formatta commit mesajları yazar. "Skill" sisteminin pratik bir örneğidir.

## 🧠 İleri Seviye: "Mutfak Düzeni" (Pipeline) Yaklaşımı

Yeni nesil AI coding dünyasında (2026+), sadece "kod yaz" demek yerine projeyi bir mutfak gibi yönetiyoruz:

*   **Tarif Kartları (Skills):** Her skill, AI'a belirli bir görevi nasıl yapacağını öğretem bir "tarif kartıdır".
*   **İzole Mutfak (Forked Context):** AI, karmaşık işleri ana sohbeti kirletmeden "arka odada" (forked context) yapar. Bu sayede hata mesajları ve loglar projenin genel "vibe"ını bozmaz.
*   **Alt Temsilciler (Subagents):** İşi parçalara bölen uzmanlar.

## 🧠 Bellek ve Anayasa: Unutmayan AI

Sohbet uzadıkça AI'ın "nereye geldik biz?" demesini engellemek için iki sihirli silahımız var:

### 1. GEMINI.md (Proje Anayasası)
Projenin köküne bu dosyayı koyduğunda, AI'a "Sen kimsin, bu proje ne, kuralların ne?" baştan öğretmiş olursun. Senin tarzını ve yasaklarını her zaman hatırlar.

### 2. Hafıza Bankası (Memory Bank)
Projeyi parçalara bölerek AI'ın bağlamını taze tutar:
*   [activeContext.md](file:///memory-bank/activeContext.md): "Şu an ne yapıyoruz?"
*   [progress.md](file:///memory-bank/progress.md): "Neler bitti, neler kaldı?"
*   [projectBrief.md](file:///memory-bank/projectBrief.md): "Projenin ana fikri ne?"

---

## 🌐 Dış Kaynaklı Skill'leri Uyarlama (GitHub & X)

İnternette bulduğun yetenekleri Antigravity sistemine saniyeler içinde dahil edebilirsin.

### 📥 Nasıl Yapılır?
1.  **Klasörü Kopyala:** Bulduğun skill'in klasörünü (içinde `SKILL.md` olan) `.agent/skills/skill dizinine yapıştır.
2.  **Format Kontrolü:** Skill dosyasının başında `name` ve `description` olduğundan emin ol. Antigravity bunu otomatik tanıyacaktır.
3.  **Aktivasyon:** AI'a "Yeni bir skill ekledim, onu oku ve bu projede kullan" demen yeterli.

## 🎼 Skill Orkestrasyonu: Karmaşa Nasıl Önlenir?

Çok fazla skill olması bir karmaşa yaratmaz, aksine AI'ı daha zeki yapar. İşte sistemin "tıkır tıkır" çalışmasını sağlayan 3 kural:

### 1. Seçici Yükleme (Just-in-Time)
AI her konuşmada yüklü tüm skilleri bir defada işlemez. Sadece o anki göreve (yani `activeContext.md` dosyasındaki hedefe) uygun olan "tarif kartını" masaya çeker. 
*   *Örnek:* Veritabanı ile uğraşırken "Frontend Design" skill'i arka planda uyur, seni rahatsız etmez.

### 2. Anayasa'nın Gücü (GEMINI.md)
Eğer iki skill çelişirse, AI her zaman `GEMINI.md` dosyasındaki "Anayasa" kurallarına bakar. O projenin en üst otoritesidir.

### 3. Planlama Zorunluluğu
`writing-plans` skill'i sayesinde AI bir işe başlamadan önce adımlarını yazar. Eğer bir karmaşa olacaksa, AI bunu plan aşamasında fark eder ve sana "Şu skill ile bu kural çelişiyor" diye rapor verir.

> [!IMPORTANT]
> **Güvenle Ekle:** Yeni bir proje açtığında bu klasörü (Skill sever) referans olarak gösterirsen, AI ihtiyacı olanı "alet çantasından" seçer gibi alıp kullanacaktır.

---

## 🏗️ Yeni Bir Projeye Nasıl Başlanır? (Miras Bırakma)

Bu kurduğumuz sistemin boşa gitmemesi ve her seferinde manuel kopyalama yapmaman için 3 yolun var:

### 1. Şablon (Template) Yöntemi
Bu "Skill sever" klasörünü bir **"Master Template"** olarak tut. Yeni bir işe başlayacağında klasörün kopyasını al ve ismini değiştir. İçerideki her şey (anayasa, hafıza bankası, skill'ler) hazır olarak seni bekler.

### 2. "Project Starter" Skill'i Kullanmak
Yeni ve boş bir klasörde bana şunları demen yeterli:
> *"Bana [Proje Adı] projesini başlat. Skill Merkezin'deki standart altyapıyı (Memory Bank, GEMINI.md) buraya kur."*
AI, `project-starter` skill'ini kullanarak her şeyi saniyeler içinde hazırlar.

### 3. Referans Yöntemi (Zero-Copy)
Boş bir klasörde başlasan bile, bana bu "Skill sever" klasörünün yolunu verirsen;
> *"Şu yoldaki (.agent/skills/...) skill'leri bu proje için de kullan"*
dersen, dosyaları fiziksel olarak taşımana gerek kalmadan hepsini bu projeye de uygulayabilirim.

---

## 🛠️ Skill Nasıl Kullanılır?

1.  **Kurulum:** `npx antigravity-awesome-skills --id [id]`
2.  **Okuma:** `.agent/skills` altındaki `SKILL.md` dosyasını aç ve "AI'a bu skill'i kullan" de.
3.  **Uygulama:** AI artık o dosyadaki kurallara göre hareket edecektir.

> [!TIP]
> **Kritik İpucu:** Karmaşık bir işe başlamadan önce mutlaka bir `writing-plans` skill'i ile plan yaptır. Bu, AI'ın "halüsinasyon" görmesini %90 oranında engeller.

## 📈 Senin Yol Haritan

- [ ] **Hafta 1:** Planlama ve Debugging temelleri.
- [ ] **Hafta 2:** Prompt Engineering kalıpları.
- [ ] **Hafta 3:** Kendi özel skill'lerini oluşturma.

---
*Unutma: Kod yazmak sadece bir araçtır, asıl olan problem çözme yeteneğidir.*
