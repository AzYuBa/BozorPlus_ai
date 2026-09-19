# Bozor-Puls.Ai
## To‘liq texnik topshiriq va kreativ UI/UX konsepsiyasi

Versiya: 1.2 • Sana: 19.09.2026 • Holat: ishlab chiqish uchun taklif etilgan spetsifikatsiya.

Ushbu hujjat foydalanuvchi taqdim etgan talablarni amalga oshiriladigan mahsulot talablariga aylantiradi. Muddatlar, tariflar, aniq hamkorlar va tashqi ma’lumot provayderlari hali tasdiqlanmagan. Yonidagi veb-dizayn — sintetik ma’lumotli interaktiv prototip; u haqiqiy bank, AI, autentifikatsiya yoki bozor servisi emas.

## 1. Maqsad va mahsulot chegarasi

Bozor-Puls.Ai — yosh va tajribali tadbirkorlar, shuningdek ekspeditorlar uchun o‘zbek tilidagi B2B yordamchi. U biznes bilimlarini o‘rgatish, rejalashtirish, bozor ma’lumotlarini taqqoslash, mahsulot savdosi, tashish buyurtmalari va boshqaruv hisobini bitta ish maydoniga birlashtiradi. Maqsad — foydalanuvchining qaror qabul qilish, hisob-kitob va xizmat izlash vaqtini qisqartirish. Tejaladigan vaqt, xarajat yoki daromad bo‘yicha isbotlanmagan kafolatlar berilmaydi.

Asosiy natijalar: foydalanuvchi reja tuzadi; birlik iqtisodiyotini tushunadi; mahsulot va logistika takliflarini taqqoslaydi; kirim-chiqimni qayd etadi; haqiqiy ma’lumot bilan taxminni ajrata oladi.

“Barcha iqtisodiy, moliyaviy, qonuniy bilimlar” maqsadi cheksiz kontent va vakolat degani emas. Kontent katalogi bosqichma-bosqich kengayadi; yurisdiksiya, amal qilish sanasi va manba har bir tegishli javobda ko‘rsatiladi. Platforma davlat reyestri, bank yoki litsenziyalangan mutaxassis o‘rnini egallamaydi.

## 2. Rollar va kirish huquqlari

| Rol | Huquqlar | Cheklovlar |
|---|---|---|
| Mehmon | Learning katalogi, ochiq mahsulotlar va tariflar | Shaxsiy daftar, buyurtma va hamyon yo‘q |
| Tadbirkor | Biznes profil, reja, bozor, xarid, ekspeditor buyurtmasi, daftar | Faqat a’zo bo‘lgan biznes ma’lumotlari |
| Ekspeditor | Shaxs/avtomobil, logistika taklifi, buyurtmalar, kalkulyator, daftar | Boshqa ekspeditorning shaxsiy hisoblari yopiq |
| Biznes egasi | Jamoa, a’zolik, eksport, biznes sozlamalari | Boshqa biznesga kirish yo‘q |
| Operator | Murojaatlar, e’lon moderatsiyasi, nizolarni ko‘rib chiqish | Pul qoldig‘ini ixtiyoriy tahrirlash mumkin emas |
| Kontent muharriri | Kurslar, yangiliklar va tasdiqlangan bilimlar | Moliyaviy va shaxsiy ma’lumotlarga kirish yo‘q |
| Administrator | Rol va platforma sozlamalari, audit | Muhim amallar audit qilinadi; moliyaviy tuzatish ikki bosqichli |

Bir shaxs bir nechta biznes a’zosi va ekspeditor bo‘lishi mumkin. Faol ish maydoni aniq ko‘rsatiladi. Rolni UI’da almashtirish serverdagi ruxsatni o‘zgartirmaydi. MVPda biznes egasi va bitta asosiy rol yetarli; jamoaviy kirish keyingi bosqichga o‘tishi mumkin.

## 3. Axborot arxitekturasi va yo‘llar

| Guruh | Sahifalar |
|---|---|
| Ochiq | `/learn`, `/learn/:courseId`, `/login`, `/register`, `/onboarding/role`, `/pricing`, `/help` |
| Tadbirkor | `/business/overview`, `/business/profile`, `/business/plan`, `/business/adviser`, `/business/market`, `/business/market/:productId`, `/business/logistics`, `/business/notebook`, `/business/wallet`, `/business/settings` |
| Reja ichida | `plan`, `calculator`, `stress-test`, `tax`, `credit`, `cases` tablari |
| Bozor ichida | `pulse`, `gainers`, `losers`, `prices`, `forecasts`, `listings`, `bulk`, `arbitrage`, `news` tablari |
| Ekspeditor | `/forwarder/overview`, `/forwarder/profile`, `/forwarder/market`, `/forwarder/orders`, `/forwarder/orders/:id`, `/forwarder/history`, `/forwarder/calculator`, `/forwarder/notebook`, `/forwarder/wallet`, `/forwarder/settings` |
| Boshqaruv | `/admin/users`, `/admin/content`, `/admin/listings`, `/admin/disputes`, `/admin/audit`, `/admin/data-quality` |

Learning — yangi foydalanuvchi uchun birinchi ochiq sahifa. Tizimga qaytgan foydalanuvchi o‘z kabinetiga yo‘naltiriladi. “Learning page” ta’lim sahifasi deb qabul qilindi; marketing landing sahifasi zarur bo‘lsa, alohida `/` bo‘lishi mumkin.

## 4. Asosiy foydalanuvchi oqimlari

1. Learning → darsni ko‘rish → ro‘yxatdan o‘tish → kontaktni tasdiqlash → rol → profil → kabinet.
2. Tadbirkor → mahsulot → hudud/narx taqqoslash → sotuvchiga buyurtma so‘rovi → kelishuv → tashish buyurtmasi → qabul qilish → hisob qaydi.
3. Ekspeditor → avtomobil/profil → mavjudlikni yoqish → kelgan so‘rov → xarajat hisobi → taklif yuborish → buyurtma tasdig‘i → yuk qabul qilish → yetkazish → hisob qaydi.
4. Daftar → matn yoki ovoz → AI tuzilgan qoralama → foydalanuvchi tekshirishi → saqlash → davr bo‘yicha hisobot.
5. Biznes reja → savolnoma → parametrlar → hisob-kitob → stress-test → reja PDF/XLSX eksporti.
6. Karmon → hamkor orqali identifikatsiya → karta tokeni → operatsiya tafsilotlari → tasdiqlash → provayder natijasi → tarix.

## 5. Learning va ro‘yxatdan o‘tish

### 5.1 Learning
Kategoriyalar: biznes asoslari, moliyaviy savodxonlik, birlik iqtisodiyoti, soliqlar, huquqiy asoslar, savdo va marketing, logistika, platformadan foydalanish. Kurs kartasi: nom, daraja, davomiylik, darslar soni, til, muallif, yangilanish sanasi, bepul/pullik holat. Dars: video yoki matn, transkript, misol, kichik topshiriq, test. Davom etish joyi va o‘zlashtirish saqlanadi. AI tushuntirishi kurs manbasiga tayanadi. Sertifikat bo‘lsa, uning davlat tomonidan tan olinishi haqida asossiz da’vo qilinmaydi.

Qabul mezoni: darsni tugatish progressni yangilaydi; keyingi kirishda shu joydan davom etadi; test natijasi javob va izohlarni ko‘rsatadi; mualliflik huquqi ruxsatsiz kontent chop etilmaydi.

### 5.2 Kirish va profil yaratish
Telefon + OTP yoki email + tasdiqlash. OTP amal qilish muddati, qayta yuborish oralig‘i va urinishlar cheklovi serverda boshqariladi. Shartlar va maxfiylikka rozilik versiyasi qayd etiladi. Parol tanlansa xavfsiz hash va qayta tiklash oqimi bo‘ladi. Sessiya HttpOnly/Secure cookie bilan yuritiladi. Qurilmalar ro‘yxati, sessiyani yakunlash, chiqish mavjud.

Rol tanlash: “Tadbirkor” va “Ekspeditor” kartalari; vazifa va talablar qisqa tushuntiriladi. Majburiy maydonlar xato bilan aniq belgilanadi. Kiritilgan ma’lumot yo‘qolmaydi. Hisob o‘chirish va ma’lumot eksport qilish so‘rovi sozlamalarda mavjud.

## 6. Tadbirkor kabineti

### 6.1 Profil
Shaxs: F.I.Sh., avatar, telefon, email, til, viloyat/tuman. Biznes: nom, faoliyat turi, yuridik shakl, STIR (zarur bo‘lganda), manzil, bozor, aloqa, ish vaqti, tasdiqlash holati. To‘liq shaxsiy hujjatlar ommaviy kartada chiqmaydi. Sotuvchi kartasida faqat ruxsat etilgan aloqa va biznes ma’lumotlari ko‘rsatiladi. “Tasdiqlangan” belgisi tekshiruv yakunlangandagina beriladi.

### 6.2 Biznes reja
Savolnoma: g‘oya, soha, hudud, mijoz segmenti, raqobat, kapital, mahsulot, xarid/sotuv narxi, oylik hajm, doimiy/o‘zgaruvchan xarajatlar, xodimlar, moliyalashtirish. Natija: xulosa, bozor farazlari, operatsion reja, marketing, 12 oylik pul oqimi, xavflar, harakatlar rejasi. Qoralama/versiya saqlash, parametrlarni o‘zgartirib qayta hisoblash, PDF va XLSX eksporti.

Biznes kalkulyator formulalari:
- Tushum = sotilgan miqdor × sotuv narxi.
- O‘zgaruvchan xarajat = miqdor × birlik o‘zgaruvchan xarajati.
- Hissa foyda = tushum − o‘zgaruvchan xarajat.
- Operatsion foyda = hissa foyda − doimiy xarajat.
- Sof foyda = operatsion foyda − foiz − tegishli soliq ± boshqa daromad/xarajat.
- Zararsizlik hajmi = doimiy xarajat / (narx − birlik o‘zgaruvchan xarajati); maxraj ≤ 0 bo‘lsa “zararsizlikka erishib bo‘lmaydi”.
- Marja = foyda / tushum × 100%; tushum nol bo‘lsa aniqlanmagan.
- Ustama = (narx − tannarx) / tannarx × 100%; marja bilan adashtirilmaydi.
- Pul oqimi foydadan alohida: kredit olish daromad emas, asosiy qarzni qaytarish xarajat hisobidagi foizdan alohida.

Stress-test: sotuv hajmi −10/−20/−30%, xarid narxi +10/20%, kechikkan to‘lov 15/30/60 kun, yoqilg‘i +10/20%, valyuta o‘zgarishi. Har bir ssenariy uchun foyda, naqd pul qoldig‘i va zararsizlik nuqtasi. Bazaviy farazlar o‘zgarmaydi; ssenariy alohida saqlanadi.

Soliq markazi: faoliyat va yuridik shakl bo‘yicha ma’lumot, manba havolasi, amal qilish davri, yangilanish sanasi. Stavkalar kodga tasdiqsiz yozilmaydi. Hisob dastlabki baho deb belgilanadi; deklaratsiya yuborish faqat alohida rasmiy integratsiya bilan.

Kredit markazi: bank takliflari manba va tekshiruv sanasi bilan; summa, muddat, foiz, komissiya, garov, imtiyozli davr. Smart kalkulyator annuitet/differensial jadval, umumiy to‘lov, foiz va komissiyalarni alohida chiqaradi. Annuitet A=P×i×(1+i)^n/((1+i)^n−1); i=oylik stavka, n=oylar; i=0 bo‘lsa P/n. Differensial to‘lov=P/n+qolgan qarz×i. Yillik nominal stavkani 12 ga bo‘lish faqat nominal oylik hisob farazi bo‘lganda ishlatiladi. To‘liq kredit qiymati provayder uslubiga mos hisoblanadi. Hujjatlar paketi: reja, pul oqimi, zarur hujjatlar ro‘yxati. Kredit tasdiqlanishiga va’da berilmaydi.

Keyslar: soha/hudud/kapital bo‘yicha qidirish, vaziyat, harakat, natija, saboq. Misol yoki haqiqiy keys ekanligi aniq yoziladi.

### 6.3 AI Biznes-Adviser
Matnli chat, suhbat tarixi, ovozdan matnga, ovozli javob. Ish rejimlari: g‘oya, reja, hisob, bozor, soliq/huquq, hujjat tushuntirish. Foydalanuvchi ruxsati bilan o‘z reja/daftar ma’lumotlari kontekstga olinadi. Javoblarda manba, sana va farazlar; yetarli ma’lumot bo‘lmasa aniqlashtiruvchi savol. Hisoblash ishonchli hisoblash servisi orqali; LLM hisob natijasini o‘zi taxmin qilmaydi. AI pul o‘tkazmaydi va yozuvni tasdiqsiz saqlamaydi. Internetdan topilgan yoki yuklangan matnlar ishonchsiz ma’lumot sifatida qayta ishlanadi; tizim ko‘rsatmasi sifatida qabul qilinmaydi.

Ovoz: mikrofon uchun rozilik, yozuv boshlash/to‘xtatish/bekor qilish, transkriptni tahrirlash, yuklash va xato holatlari. O‘zbek lotin/kirill va rus tilidagi tanish nomlar sinov to‘plamida tekshiriladi. Brauzer yoki STT ishlamasa matnli kiritish qoladi. Xom audio saqlash alohida rozilik va saqlash siyosati bilan.

### 6.4 Bozor
Bozor pulsi: tanlangan davr/hudud/kategoriya bo‘yicha median narx, hajm (manba mavjud bo‘lsa), o‘zgarish. Eng o‘sgan/tushgan mahsulotlar bir xil birlik, sifat, geografiya va davrda taqqoslanadi. Ma’lumotsiz mahsulot “0” emas, “ma’lumot yo‘q” deb chiqadi.

Narx jadvali: mahsulot, nav, o‘lchov birligi, narx turi (taklif/yakunlangan savdo), viloyat, tuman, bozor, vaqt, manba, kuzatuv soni. Viloyat → tuman → bozor bog‘liq filtrlari. Qidiruv, saralash, sahifalash, CSV eksporti. Kg/tonna va valyutalarni yashirin aralashtirmaslik.

Svecha grafigi: kun/hafta/oy; OHLC faqat ishonchli bir xil seriyali kuzatuvlardan. Birinchi/eng yuqori/eng past/oxirgi narx ta’rifi ko‘rsatiladi. Haqiqiy savdo oqimi bo‘lmasa “e’lon narxlari OHLC” deb belgilanadi, hajm uydirilmaydi. TradingView uslubidagi grafik talabi qabul qilindi; kutubxona litsenziyasi va brend atributsiyasi integratsiyadan oldin tekshiriladi.

Maxsus AI yangiliklar: biznesga tegishli tasdiqlangan yangilik xulosasi, asl manba, nashr va yangilanish vaqti, mahsulot teglar. Fakt, manba fikri va AI izohi farqlanadi.

Prognoz: 7/14/30/60/90 kun, markaziy baho va noaniqlik oralig‘i, tarixiy/prognoz chegarasi, model sanasi, ma’lumot qamrovi, backtest xatosi. Kam tarix bo‘lsa prognoz berilmaydi. Model MAE/sMAPE bilan vaqt bo‘yicha ajratilgan holda baholanadi; kelajak ma’lumotlari o‘qitishga sizib kirmaydi. Prognoz kafolat emas.

E’lon joylashtirish: mahsulot/kategoriya/nav, fotosurat, miqdor/birlik, narx/valyuta, MOQ, hudud/bozor, sifat hujjati, yetkazish sharti, amal qilish muddati. Qoralama → moderatsiya → faol → tugagan/arxiv. Mahsulot kartasi barcha shu ma’lumotlarni ko‘rsatadi. E’lon egasi o‘zgartirishi/yopishi mumkin; ko‘ruvchi ko‘chira olmaydi. Shubhali e’lon haqida shikoyat.

Partiya xaridi: MOQ, mavjud qoldiq, buyurtma miqdori, narx pog‘onalari, xaridorlar rezervlari. Rezerv muddati tugasa miqdor qaytariladi. Parallel so‘rovda qoldiq manfiy bo‘lmaydi. Jamoaviy xarid bilan oddiy ulgurji xarid alohida tushuncha; birinchi versiyada oddiy ulgurji buyurtma, keyin guruhli xarid.

Arbitraj: hududlar narx farqi − transport − yuklash − saqlash − yo‘qotish − komissiya − tegishli soliq. Natija sof imkoniyat bahosi, manba va vaqt bilan. Bu kafolatlangan foyda yoki avtomatik savdo emas. “Nizo arbitraji” esa buyurtma yuzasidan yordam jarayoni sifatida alohida nomlanadi.

### 6.5 Ekspeditor izlash
Filtrlar: viloyat, tuman, bozor, marshrut, avtomobil turi, yuk sig‘imi, sovitkich, bo‘sh vaqt. Kartada ism/biznes, tasdiqlash, mashina, sig‘im, tarif asoslari, haqiqiy yakunlangan buyurtmalardan reyting. Buyurtma: qayerdan/qayerga, manzil, sana/vaqt, yuk turi/og‘irligi/hajmi, yuklash, aloqa, izoh, taxminiy narx. Ekspeditor taklifi alohida tasdiqlanadi. Bekor qilish sababi va narx o‘zgarishi qayd etiladi.

### 6.6 B.P.Ai-daftar
Qo‘lda, matn yoki ovoz orqali kiritish: “Bugun 500 kg kartoshkani 3 800 so‘mdan sotdim, yo‘lga 150 ming ketdi”. Natija saqlashdan oldin qoralama: daromad 1 900 000, transport xarajati 150 000, sana, kategoriya, kontragent, buyurtma, valyuta. Xarid tannarxi noma’lum bo‘lsa 1 750 000 ni sof foyda deb ko‘rsatmaslik.

Yozuv maydonlari: turi, summa, valyuta, vaqt, kategoriya, izoh, kontragent, bog‘liq buyurtma, manba, tasdiqlash holati. Kirim, chiqim, pul oqimi va sof foyda alohida. Dastlab MVP pul asosidagi boshqaruv hisobi sifatida belgilanadi; sof foyda faqat barcha zarur tannarx, majburiyat va soliqlar hisobga olinganda chiqariladi. Kredit, avans va ichki o‘tkazma operatsion daromadga aralashtirilmaydi.

Davrlar: soat, kun, hafta, oy, yil va maxsus interval; Asia/Tashkent ko‘rsatilishi, serverda UTC. Kategoriya, buyurtma, kontragent filtrlari. Tahrir audit izi bilan; o‘chirish o‘rniga bekor qilish yozuvi; CSV/XLSX eksport. Takroriy audio/xabar bitta idempotency kaliti bilan ikkinchi yozuv yaratmaydi.

## 7. Ekspeditor kabineti

### 7.1 Profil va bozor
Shaxs: ism, kontakt, hudud, tasdiqlash. Avtomobil: rusum/model, yil, davlat raqami (ommaviylik cheklovi), kuzov turi, yuk sig‘imi kg/m³, yoqilg‘i turi, yukli/bo‘sh sarf l/100 km, sovitkich, hujjat muddati. Bir nechta avtomobil keyingi bosqichda; tanlangan avtomobil hisob-kitobda aniq ko‘rsatiladi.

Ekspeditor bozorida hudud/tuman/bozor bo‘yicha ro‘yxat ko‘rinadi. “Xizmatimni joylashtirish” orqali yo‘nalish, vaqt, narx sharti va mavjudlik e’loni. Tasdiqlanmagan profil tegishli belgida chiqadi; mavjud bo‘lmagan buyurtma yoki reyting uydirilmaydi.

### 7.2 Buyurtmalar va tarix
Buyurtma kodi, tadbirkor, yuk, manzillar, sana, taklif, kelishilgan narx, to‘lov holati. Holatlar: yangi so‘rov → taklif yuborildi → tasdiqlandi → yuk qabul qilindi → yo‘lda → yetkazildi → qabul tasdiqlandi → yopildi. Muqobil holatlar: rad etildi, bekor qilindi, nizo. Har bir o‘tishning roli, vaqti va sababi auditda. Yetkazilganlik tasdig‘i: mijoz kodi/elektron tasdiq va zarur fayl; kuzatuv GPS faqat alohida integratsiya va rozilik bilan.

Tarix: sana, kod, mijoz, yo‘nalish, tushum, xarajat, natija, holat; qidirish/filtrlash/eksport. Yakunlangan buyurtma ma’lumotini jimgina almashtirish mumkin emas.

### 7.3 Ekspeditor kalkulyatori
Kod bo‘yicha foydalanuvchiga tegishli buyurtma olinadi. Boshqa buyurtma kodi kiritilsa ma’lumot berilmaydi. Profil avtomobili parametrlari oldindan qo‘yiladi, safar uchun tuzatish mumkin.

Yoqilg‘i = (yukli km × yukli sarf + bo‘sh km × bo‘sh sarf) / 100 × litr narxi. Umumiy xarajat = yoqilg‘i + yuklash/tushirish + haydovchi + yo‘l to‘lovi + turargoh + amortizatsiya/km × km + boshqa xarajat. Sof safar natijasi = kelishilgan haq − barcha safar xarajatlari − tegishli soliq/komissiya. Minimal tarif va maqsadli marja uchun tarif = xarajat / (1−marja), 0≤marja<1. Qaytishdagi bo‘sh yurish alohida. Xarita masofasi manbasi mavjud bo‘lmasa foydalanuvchi qo‘lda kiritadi.

### 7.4 AI Ekspeditor-daftar
Tadbirkor daftaridagi umumiy mexanizm; har yozuv buyurtma va avtomobilga bog‘lanishi mumkin. Ovoz/matn, qoralama tasdiqlash, davrlar, safar/avtomobil kesimi, maslahat, tarix. Buyurtmadan import va qo‘lda kirim bir operatsiyani takror hisoblamaydi. AI maslahatida real xarajat va faraz aniq ajratiladi.

## 8. Karmon, sozlamalar, yordam va obuna

### 8.1 Karmon
Ikkala rolda ham balans, mavjud/bloklangan/kutilayotgan mablag‘, hamkor hisob identifikatori, operatsiyalar tarixi, kartalar, yechish va o‘tkazma. Pul xizmatlari faqat mos huquqiy model va vakolatli provayder bilan yoqiladi. UI’dagi balans provayder yoki tekshirilgan ledger bilan mos bo‘lishi kerak; mijoz yuborgan summa haqiqat manbasi emas.

Karta raqami/CVV tizimda saqlanmaydi; hosted/tokenlashtirilgan provayder formasi ishlatiladi, UI faqat niqoblangan karta ma’lumotini ko‘radi. O‘tkazmada oluvchi, summa, komissiya, jami va qaytarilish sharti tasdiqlashdan oldin. Server-side limitlar, qayta autentifikatsiya/OTP provayder orqali. Double-entry ledger, idempotency key, webhook imzosi, takroriy va tartibsiz eventlarni qayta ishlash, kunlik solishtirish. “Muvaffaqiyatli” faqat tasdiqlangan provayder hodisasidan keyin. Xato/vaqt tugashi avtomatik muvaffaqiyat deb belgilanmaydi. Refund va nizo protokoli alohida.

Prototipda haqiqiy karta ma’lumotlari so‘ralmaydi, balans demo sifatida ko‘rsatiladi. To‘lov integratsiyasi tayyor bo‘lmaguncha pul amallari ochilmaydi.

### 8.2 Sozlamalar
Profil, biznes, til (o‘zbek lotin; kirill/rus keyingi lokalizatsiya), vaqt zonasi, UZS bazaviy valyuta, bildirishnoma kanallari, mikrofon roziligi, xavfsizlik/sessiyalar, maxfiylik, AI uchun ma’lumotdan foydalanish ruxsati, eksport/o‘chirish so‘rovi. Valyuta konvertatsiyasi manba va sanasi bilan. Muhim to‘lov bildirishnomalari marketing obunasidan alohida.

### 8.3 Yordam va obuna
Haqiqiy tasdiqlangan ofis manzili, ish vaqti, telefon/email/Telegram; berilmagan aloqa uydirilmaydi. FAQ, qidiruv, ticket yaratish, ilova, holat va tarix. Ticket yuborish muvaffaqiyatli bo‘lsa raqam chiqadi. SLA mahsulot egasi tasdiqlaydi.

Obuna: Free / Business / Logistics nomlari taklif; narx va limitlar tasdiqlanadi. Free — Learning va cheklangan asosiy vositalar; Business — kengaytirilgan tahlil/reja/daftar; Logistics — safar va avtomobil tahlili. AI so‘rov, saqlash va jamoa limitlari jadvalda. Avtomatik uzayish, bekor qilish va muddat tugash oqimi ochiq. To‘lov qilinmaganda ma’lumot o‘chirilmaydi; faqat tegishli imkoniyat cheklanadi.

## 9. Kreativ dizayn tizimi — “Birja terminali”

Vizual g‘oya: bozor terminalining aniqligi + oddiy kundalik daftarining tushunarliligi. Asosiy motif — logotipdagi puls chizig‘i; bezak uchun takrorlanmaydi, narx va biznes dinamikasida ishlatiladi.

| Token | Qiymat va vazifa |
|---|---|
| Ink | #E7ECE9 — matn; #0C1310 — grafik terminali |
| Canvas | #090D0C — qora ish maydoni; grafit va to‘q yashil sirtlar |
| Surface | #151C17 — qorong‘i kartalar |
| Primary | #E75B3E — asosiy harakat; #8BD3A1 — bozor o‘sishi |
| Mint | #DBF7E8 — ijobiy kontekst |
| Lime | #D9F280 — kam ishlatiladigan diqqat aksenti |
| Danger | #C64343 — salbiy natija/xato |
| Text secondary | #99A69F — yordamchi matn |
| Border | #29312E — ajratish |
| Typography | Space Grotesk — sarlavha va raqamlar; DM Sans — matn; system sans-serif fallback |
| Type scale | 32/24/20 px sarlavha, 16 px matn, 14 px label, 12 px metadata |
| Spacing | 4/8/12/16/24/32/48 px |
| Radius | 12 px boshqaruv, 18 px karta; badge pill |
| Motion | 120–180 ms; reduced-motion hurmat qilinadi |

Desktop: yuqorida logotip va gorizontal navigatsiya; mahsulotlar narx lentasi; chapda mahsulot kuzatuv ro‘yxati, markazda qoramtir OHLC terminali va o‘ngda xarid miqdori paneli. Pastda hududiy narxlar, AI perspektiva va eng o‘sgan/tushgan mahsulotlar. Tablet: xarid paneli grafik ostiga o‘tadi. Mobil: gorizontal mahsulot tanlash, grafik va bitta ustunli panellar; keng jadval o‘z konteynerida scroll qiladi. 200% matn kattalashganda boshqaruvlar kesilmaydi.

Bosh sahifa: Bozor pulsi terminali. Mahsulot tanlash, 7/30/90 kun, sham/chiziq ko‘rinishi, hover OHLC va ekvivalent jadval. Xarid miqdori qiymatni darhol hisoblaydi. Tadbirkor va ekspeditor uchun qolgan funksiyalar yuqori navigatsiyada rolga mos ko‘rsatiladi. Har sahifada keraksiz katta reklama hero yo‘q.

Learning: “Bugun nimani o‘rganamiz?” + qidiruv, kategoriyalar, “Davom etish”, dars kartalari. Login: qisqa qiymat matni va yagona shakl. Role: ikki yirik tanlov kartasi. Bozor: mahsulot qidiruvi, hudud filtrlari, narx jadvali, tanlangan mahsulot chart/detail. AI: suhbat markazda, tarix yon panelda, pastda matn/mikrofon, manbalar ochiladigan blok. Daftar: davr va balanslar, operatsiyalar, tez kiritish paneli. Karmon: mavjud/bloklangan summa, aniq pul harakatlari va tarix; bezak pul ma’lumotini chalg‘itmaydi.

Komponentlar: button (primary/secondary/ghost/destructive), input + label + error, select/combobox, tabs, drawer, dialog, table, date range, toast, empty state, skeleton, KPI, status badge, product card, order timeline, chat bubble, source card. Har biri default/hover/focus/disabled/loading/error holatiga ega. Klaviatura fokusi ko‘rinadi; dialogdan chiqishda fokus qaytadi. Rang yagona ma’no tashuvchisi emas: raqam, +/− va matn birga. WCAG 2.2 AA maqsadi, ekran o‘quvchi nomlari, 44 px touch target, kontrast tekshiruvi.

Grafiklar: o‘qlar/birlik/vaqt/manba, hover va klaviaturaga teng ma’lumot jadvali; prognoz shtrix va oralig‘ bilan; tushum, foyda va balans bir xil indikator deb berilmaydi. Loading spinner uzoq qolsa sabab/qayta urinib ko‘rish. Bo‘sh holatda nimani kiritish kerakligi; API xatosida oxirgi yangilanish va eskirganlik belgisi.

## 10. Texnik arxitektura

Taklif: responsive TypeScript web client; modular server API; PostgreSQL yoki mos relatsion baza; obyekt saqlash; navbat/worker; markaziy autentifikatsiya; kuzatuv va audit. Hosting tanloviga moslashtiriladi. Pilotda modulli monolit yetarli, har modul uchun alohida mikroservis shart emas. Pul ledgeri va AI ish navbati qat’iy chegaralanadi.

Modullar: identity/workspaces; learning; business planning; market ingestion/catalog; marketplace/orders; logistics; ledger/notebook; payments; AI/RAG/voice; billing; support; admin. Narx ETL pipeline: olish → tekshirish → birlik/valyuta normalizatsiyasi → dublikat/outlier tekshiruvi → manba va vaqt bilan saqlash → agregatsiya → sifat metrikasi. AI asinxron ishlarining holati queued/running/completed/failed/cancelled.

Kritik qaror: daftar va Karmon alohida ledger. Daftar foydalanuvchi boshqaruv hisobi; Karmon tasdiqlangan pul harakati. Hamyon operatsiyasini daftar bilan bog‘lash mumkin, lekin bank qoldig‘ini daftar matni o‘zgartirmaydi.

## 11. Ma’lumot modeli

Barcha kerakli jadvallarda UUID, created_at/updated_at, tenant/workspace va audit manbasi. Pul float emas — integer minor unit yoki fixed precision decimal. Valyuta ISO kodi, miqdor decimal, birlik kodi; vaqt UTC.

| Entity | Muhim maydonlar va bog‘lanish |
|---|---|
| users/sessions/consents | kontakt, holat, autentifikatsiya, rozilik versiyasi |
| workspaces/memberships | biznes, user_id, role; unique(workspace,user) |
| business_profiles | workspace, STIR, soha, hudud, verification |
| forwarder_profiles/vehicles | user, transport parametrlari, mavjudlik |
| regions/districts/markets | ierarxik FK, nom va geo |
| courses/lessons/progress | til, kontent versiyasi, user, completion |
| business_plans/scenarios | workspace, input snapshot, hisob versiyasi |
| products/variants/units | kategoriya, nav, o‘lchov standarti |
| price_observations | product, market, price_type, qiymat, vaqt, manba |
| forecast_runs/points | model, horizon, quantiles, generated_at, metrics |
| listings/listing_media | seller, product, quantity, MOQ, narx, status |
| purchase_orders/items/reservations | buyer, seller, listing, miqdor, narx snapshot |
| shipment_orders/quotes/events | purchase, forwarder, vehicle, route, state |
| notebook_entries/revisions | workspace, type, amount, category, source, order |
| payment_accounts/ledger_transactions/postings | provider ids, double entry, immutable status |
| payment_methods/transfers/webhook_events | token, idempotency, imzo tekshirish, holat |
| conversations/messages/ai_jobs | workspace, intent, manba, model, usage |
| plans/subscriptions/invoices | limit, billing davri, provider holati |
| tickets/disputes/audit_logs | muallif, obyekt, amal, sabab, vaqt |

Indekslar: tenant+vaqt; product+market+observed_at; order+status; provider_event unique; idempotency key unique. Foreign key, miqdor/summa constraintlari va optimistic version. Audit/ledgerni oddiy update/delete bilan buzish taqiqlanadi.

## 12. API shartnomalari

REST `/api/v1`, JSON; sessiya va tenant serverdan aniqlanadi. Kolleksiyalar cursor pagination; server-side filtr. Xato: `{error:{code,message,fieldErrors,requestId}}`. Umumiy 401/403/404/409/422/429/5xx; maxfiy obyekt borligini 403 orqali oshkor qilmaslik.

| Endpoint | Amal |
|---|---|
| POST /auth/otp/request, /auth/otp/verify | OTP va sessiya |
| GET/PATCH /me; GET /workspaces | profil/kabinet |
| GET /courses; POST /lessons/:id/progress | o‘qish |
| POST /plans; POST /plans/:id/scenarios | biznes reja |
| POST /calculators/business, /credit, /trip | tekshirilgan hisob |
| GET /market/prices, /candles, /forecasts | tarix/manbali narxlar |
| GET/POST /listings; PATCH /listings/:id | e’lon |
| POST /purchase-orders; POST /purchase-orders/:id/reserve | xarid va rezerv |
| GET /forwarders; POST /shipments | ekspeditor/buyurtma |
| POST /shipments/:id/quotes; POST /shipments/:id/transitions | taklif/holat |
| GET/POST /notebook/entries; POST /notebook/drafts/parse | daftar/qoralama |
| POST /notebook/drafts/:id/confirm | tasdiqlangan yozuv |
| POST /conversations/:id/messages; GET /ai/jobs/:id | chat va ish natijasi |
| POST /voice/transcribe | ovoz, limitli format/hajm |
| GET /wallet; POST /wallet/transfers | provider bilan hamyon |
| POST /webhooks/payments/:provider | imzolangan event |
| POST /support/tickets; GET /subscriptions | yordam/obuna |

Pul, buyurtma va daftar yaratishda Idempotency-Key. Status o‘tishi server state machine orqali; kutilmagan o‘tish 409. Fayl yuklash signed URL, hajm/format tekshiruvi va zararli fayl nazorati bilan. AI javob stream uzilsa qisman holat ko‘rsatiladi; qayta yuborish ikkinchi to‘lov/yozuv yaratmaydi.

## 13. Integratsiyalar va mahsulot egasidan kerakli ma’lumot

| Yo‘nalish | Zarur qaror yoki resurs | Ulanmaguncha |
|---|---|---|
| SMS/email | provayder, sender, hisob | haqiqiy login yoqilmaydi |
| AI/STT/TTS | model, kalit, xarajat/saqlash siyosati | demo ssenariy belgisi |
| Bozor narxlari | litsenziyalangan manbalar/API, qamrov | sintetik namuna, real deb berilmaydi |
| Soliq/huquq | tekshirilgan manbalar, muharrir, yangilash jarayoni | universal stavka taxmin qilinmaydi |
| Bank/kredit | taklif feed, foydalanish ruxsati | foydalanuvchi kiritgan parametrlar |
| To‘lov/KYC | hamkor, shartnoma, huquqiy model, test muhiti | pul o‘tkazish o‘chirilgan |
| Xaritalar | masofa/geokodlash provayderi | masofa qo‘lda |
| Ofis/yordam | manzil, kontakt, operatorlar | uydirma kontakt yo‘q |
| Kurslar | mualliflar, tasdiqlangan kontent | namuna kurslar |
| Obuna | tasdiqlangan narx/limitlar, billing | faqat konsept tarif |

Ushbu TZ yuridik xulosa emas; amaldagi mahalliy talablar mahsulot ishga tushishidan oldin vakolatli mutaxassis va provayder bilan tekshiriladi. Tasdiqlanmagan qonun raqami yoki stavka kiritilmagan.

## 14. Xavfsizlik, barqarorlik va sifat talablari

Tenant izolyatsiyasi har so‘rovda; rolga asoslangan ruxsat; TLS; shifrlangan saqlash; secretlar serverda; CSRF/XSS/SQL injection himoyasi; upload cheklovlari; login va AI rate-limit. Loglarda OTP, to‘liq karta, token va shaxsiy hujjat matni yo‘q. Prompt injection va boshqa tenant ma’lumotini olishga qarshi testlar.

Saqlash muddati ma’lumot sinfiga ko‘ra tasdiqlanadi; foydalanuvchi o‘chirish so‘rovi moliyaviy saqlash majburiyati bilan muvofiqlashtiriladi. Backup va tiklash mashqi; taklif etilgan boshlang‘ich RPO ≤24 soat, RTO ≤4 soat; pul ledgeri uchun alohida provayder bilan mos tiklash talabi. Bu ishlab chiqarish SLA’si emas, tasdiqlanadigan maqsad.

Maqsadli tezlik: odatiy mobil qurilmada p75 LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms; odatiy read API p95 ≤500 ms, hisob API ≤1 s. AI alohida vaqt ko‘rsatkichi va loading; 60 s dan uzun jarayon asinxron. Pilot yuk profili: 500 bir vaqtdagi foydalanuvchi / 50 read rps taxmini, haqiqiy trafik bilan qayta o‘lchanadi. Keskin trafikda graceful degradation va navbat.

Monitoring: API xato/latency, ETL yangilik darajasi, AI cost/latency, payment reconciliation, backup, login xatolari. Staging/prod alohida. Feature flag, rollback, migratsiyadan oldin backup, audit.

## 15. Qabul qilish mezonlari va sinov matritsasi

| ID | Ssenariy | Kutiladigan natija |
|---|---|---|
| AUTH-01 | noto‘g‘ri/muddati tugagan OTP | kirish yo‘q; tushunarli xato va limit |
| RBAC-01 | boshqa biznes yozuvi ID’si | ma’lumot ochilmaydi |
| PLAN-01 | narx 10k, tannarx 6k, hajm 100, doimiy 200k | tushum 1m, operatsion foyda 200k, zararsizlik 50 dona |
| PLAN-02 | narx tannarxdan past yoki teng | manfiy/cheksiz zararsizlik raqami ko‘rsatilmaydi |
| CREDIT-01 | stavka 0, summa 12m, 12 oy | oyiga 1m, komissiya alohida |
| TRIP-01 | 200 km, 12 l/100km, 10k/l, boshqa 100k | xarajat 340k; qaytish km qo‘shilsa qayta hisob |
| MARKET-01 | kg va tonna, turli navlar | bir xil seriya sifatida aralashtirilmaydi |
| FORECAST-01 | tarix yetarli emas | uydirma bashorat o‘rniga bo‘sh holat |
| LIST-01 | ikki xaridor oxirgi qoldiqni oladi | faqat mavjud miqdor rezerv bo‘ladi |
| ORDER-01 | “yangi”dan bevosita “yopildi” | server rad etadi, audit saqlanadi |
| NOTE-01 | AI matnni ajratdi | tasdiqqacha haqiqiy daftar o‘zgarmaydi |
| NOTE-02 | bir xil request qayta yuborildi | bitta yozuv |
| MONEY-01 | takroriy yoki teskari tartibli webhook | balans ikki marta oshmaydi |
| MONEY-02 | payment timeout | pending; yolg‘on success yo‘q |
| ACCESS-01 | faqat klaviatura/200% zoom/360px | asosiy jarayonlar bajariladi |
| EXPORT-01 | davr bo‘yicha eksport | ekrandagi filtr va jami bilan mos |
| AI-01 | manbasiz huquqiy savol | aniqlashtirish yoki manba yetishmasligi; uydirma hujjat yo‘q |
| RESTORE-01 | backupdan sinov tiklash | hujjatlashtirilgan natija va tekshirilgan ledger |

Definition of Done: kod review, kritik hisoblar unit testi, API/RBAC integratsion testi, asosiy E2E oqimlar, mobil/desktop QA, accessibility tekshiruvi, monitoring, foydalanish yo‘riqnomasi, tasdiqlangan kontent, staging qabul, rollback. To‘lov uchun provayder sandbox va reconciliation sinovlari qo‘shimcha shart.

## 16. Ishlab chiqish bosqichlari

1. **Discovery va dizayn:** talablardagi farazlar, user flow, komponentlar, interaktiv prototip, integratsiya shartlari. Natija: tasdiqlangan backlog va dizayn.
2. **MVP yadro:** auth/rol/profil; Learning; biznes va ekspeditor kalkulyatori; qo‘lda daftar; e’lonlar; logistika so‘rovi; operator boshqaruvi. Natija: haqiqiy backend va tenant izolyatsiyasi bilan pilot.
3. **AI va bozor ma’lumotlari:** manbali chat, ovoz qoralamasi, ETL, narx grafigi, yangiliklar, prognoz sifatini baholash. Natija: manba va sifat mezonlari bilan ishlaydigan tahlil.
4. **Tranzaksion xizmatlar:** to‘lov/KYC, obuna, partiya rezervlari, refund/nizo, hisobni solishtirish. Natija: hamkor tomonidan tekshirilgan pul oqimi.
5. **Kengayish:** ko‘p avtomobil/biznes, jamoalar, kengaytirilgan prognozlar, qo‘shimcha tillar va hududlar.

MVP butun yakuniy ko‘lamning o‘rnini bosmaydi; yuqoridagi barcha modullar maqsadli backlogda qoladi. Ishlar hajmi, jamoa va provayderlar aniqlanmaguncha qat’iy muddat/byudjet va’da qilinmaydi. Har bosqichning chiqish sharti yuqoridagi qabul mezonlari bilan bog‘lanadi.

## 17. Natijani o‘lchash

Activation: tasdiqlangan foydalanuvchining birinchi foydali amali. Learning: dars tugatish va test o‘sishi. Daftar: haftalik faol foydalanuvchi va tasdiqlangan qaydlar. Bozor: narx solishtirishdan so‘rovga konversiya. Logistika: so‘rov → kelishuv → o‘z vaqtida yetkazish. AI: foydali javob bahosi, manbali javob ulushi, xato tahlili, xarajat. Moliyaviy: reconciliation farqi, muvaffaqiyatli operatsiya va dublikatlar. Tejalgan vaqt pilotda vazifa oldin/keyin o‘lchovi bilan tekshiriladi; maqsad qiymatlari baseline’dan keyin belgilanadi.

## 18. Yetkazib berish paketi va prototip chegarasi

Yakuniy ishlab chiqarish paketi: responsive web client, server API, DB migratsiyalar, operator paneli, testlar, CI/CD, maxfiy kalitlarsiz konfiguratsiya namunasi, monitoring, foydalanuvchi qo‘llanmasi, dizayn tokenlari/komponentlari va mazkur TZning yangilangan versiyasi.

Ushbu turda yetkazilgan: to‘liq TZ; interaktiv UI/UX konsepsiyasi; tadbirkor/ekspeditor navigatsiyasi; Learning; demo bozor filtri va grafiklar; ishlaydigan mahalliy kalkulyatorlar; sessiya davomida demo daftar va buyurtma jarayonlari; profil, hamyon va yordam dizayni. Prototipdagi holat brauzer sahifasi yangilanganda tiklanadi. Haqiqiy login, doimiy biznes ma’lumoti, generativ AI/ovoz provayderi, jonli narx, pul o‘tkazma va obuna backend integratsiyalaridir; ular tayyor deb ko‘rsatilmaydi.
