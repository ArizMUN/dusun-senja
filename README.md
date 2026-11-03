# Dusun Senja (Versi 1.6: lantai berlapis, tabrakan tile, animasi lebih hidup)

Game web 2D top-down, Canvas murni, tanpa build dan tanpa library.

## Baru di v1.6
- **Bangunan dua lapis**: lantai (kayu, batu, keramik) kini lapisan terpisah di bawah. Bed, meja, peti, rak, tungku, dan perabot lain bisa dipasang **di atas lantai** (atau di atas rumput). Karpet dan kursi bisa diinjak, sisanya jadi tile tabrakan.
- Bongkar/Pindah: objek diangkat dulu, tekan lagi untuk mengangkat lantai di bawahnya. Isi peti ikut terbawa saat dipindah. Save lama otomatis dimigrasi.
- Batu dekor di rumput kini menjadi tile tabrakan (hilang kalau tanahnya digarap atau dibangun). Cangkul tidak bisa dipakai di atas lantai.
- Sprite baru: dinding bersambung otomatis (kayu/batu/pagar/pintu), lantai bertepi, kasur, meja, peti, tungku berapi dan berasap, menara dengan bendera, rak buku, pot yang bergoyang, lampu yang menyala di malam hari (cahaya hangat ikut memudarkan gelap).
- Karakter: detail rambut, mata berkedip, jubah dan syal berkibar, ayunan senjata mengikuti tebasan (warna ikut elemen), debu langkah, berkedip saat terluka.
- NPC desa menoleh dan melambai saat kamu dekat, gelembung obrolan; rumah punya asap cerobong, kotak bunga, dan jendela menyala malam hari.
- Battle: efek partikel dan guncang layar kini aktif (sebelumnya fx.js belum terpasang), hit-stop saat kritikal dan boss kalah, tanda ❗ sebelum monster menyerang, aura elemen, cincin denyut boss, bar HP boss di atas layar, angka damage lebih jelas, sabetan berwarna elemen.

## Jalankan
- Buka `index.html` di browser, atau `python3 -m http.server 8000` lalu buka http://localhost:8000

## Kontrol
- Gerak: WASD/panah, klik mouse (jalan ke titik), atau joystick virtual di HP.
- Aksi: tombol ✋ (HP) atau Spasi/E (PC). Aksi mengenai tile kuning di depan karakter.
- Serang: tombol ⚔️ (HP, tahan untuk menyerang terus) atau J/F (PC). Auto-aim ke monster terdekat.
- Skill aktif: tombol bulat di sisi kanan (PC: Z X C V). Pohon skill: 🌳 atau K.
- Tombol menu ada di kanan atas (⚙️ 🗺️ 📜 🌳 🔨 🎒), disusun ke bawah. Jam dan koin di kiri atas. Posisi menu ini juga bisa digeser lewat Atur tata letak.
- Pilih item: ketuk hotbar atau tombol 1-9. Tas: 🎒 atau I (3 tab: Perlengkapan, Tas, Toko). Mode bangun: 🔨 atau B.
- Panel (tas, skill, peta, pengaturan) menutup otomatis kalau kamu ketuk di luar panel (di PC juga bisa Esc).
- Atur tata letak: ⚙️ lalu 🎛️ Atur tata letak. Seret joystick, tombol ⚔️, tombol ✋, hotbar, dan bar skill ke posisi yang nyaman, lalu Selesai. Posisi tersimpan terpisah untuk layar landscape dan portrait. Tombol Reset mengembalikan posisi awal.

## Bertani
Cangkul ⛏️ (di luar area rumah), tanam benih, siram 💧 tiap pagi, panen saat matang, jual di 🎒.

## Membangun
1. Tebang pohon dengan kapak 🪓 untuk dapat kayu 🪵 (batu 🪨 sementara beli di Toko Bahan).
2. Tekan 🔨 untuk masuk mode bangun. Grid muncul di area rumah + margin 2 tile.
3. Pilih bangunan di bar bawah (geser kalau panjang), arahkan tile kuning, lalu Aksi. Hijau = bisa, merah = tidak bisa.
4. 🔄 Pindah: ambil bangunan, lalu pasang di tile lain. 🗑️ Bongkar: bahan kembali penuh.
5. Di luar mode bangun, Aksi pada pintu 🚪 membuka/menutup.

## Waktu dan tidur
- Kecepatan waktu bisa dipilih di ⚙️: Cepat (1 hari game = 10 menit nyata), Normal (20 menit, bawaan), Santai (40 menit). Pilihan tersimpan. Waktu hanya berjalan saat game dibuka, dan berhenti di dalam gua.
- Tempat Tidur 🛏️ (bangun dengan 🔨): hadapi kasurnya lalu Aksi saat malam (setelah sekitar 19:00) untuk melewati malam. Waktu loncat ke pagi, tanaman yang basah ikut tumbuh, HP dan mana pulih, dan monster hilang.

## Memancing, masak, ternak, dan cuaca
- **Memancing 🎣**: pilih Pancing di hotbar, hadap tile air, tekan Aksi untuk melempar, lalu Aksi lagi saat muncul tanda ❗ (sekitar 1 detik). Jangan bergerak selama memancing. Ikan: Kecil, Mas, Buntal, Kepiting (buntal dan kepiting lebih sering saat malam, ikan mas lebih sering saat hujan).
- **Memasak 🍳**: bangun Tungku (🔨, kayu 3 dan batu 4) di area rumah, hadap lalu Aksi. 8 resep dari hasil panen, ikan, telur, dan susu. Makan dari 🎒 Tas (tab Tas, tombol Makan): pulih HP dan dapat efek sementara (satu efek aktif, tampil di bar HP).
- **Peti 🧰**: hadap peti lalu Aksi untuk menyimpan atau mengambil item dan perlengkapan (24 jenis item dan 24 perlengkapan). Isi peti kembali ke tas kalau peti dibongkar.
- **Ternak 🐔🐄**: beli di 🎒 tab Toko, hewan muncul di dekatmu dan berkeliaran di sekitar titik itu (pagar menahan mereka). Hadap hewan lalu Aksi: beri makan (ayam gandum, sapi wortel), tunggu beberapa jam game, lalu Aksi lagi untuk ambil telur atau susu. Ikon di atas kepala menunjukkan hewan lapar atau hasil siap.
- **Menara Jaga 🗼**: bangun di area rumah (kayu 10, batu 8). Menembak monster dalam jarak sekitar 5 tile dan membantu malam hari.
- **Cuaca**: tiap hari game bisa cerah, hujan, atau badai (hari pertama selalu cerah). Hujan menyiram semua tanaman dan ikan lebih cepat menggigit. Badai membuat monster muncul walau siang, disertai kilat dan petir.
- **Boss elemen**: boss gua mengikuti elemen wilayah: Naga Api (api), Hantu Penguasa (dark), Elang Petir (listrik), Kura-kura Karang (air). Elemen lain tetap Golem Batu.
- **Pelacak misi**: satu baris di bawah bar mana menampilkan misi aktif. Ketuk untuk membuka 📜.

## Misi
- 📜 (atau Q): **Misi Utama** 16 bab berurutan, dari menggarap tanah sampai menjadi Pahlawan Dusun. Tiap bab punya target (garap, tanam, panen, jual, bangun, tidur, kalahkan monster, naik level, temukan desa, masuk gua, buka peti, kalahkan boss) dan hadiah (koin, XP, poin skill, bahan, equipment).
- **Misi Harian**: 3 misi acak yang diganti tiap pagi (06:00 game), target menyesuaikan level. Selesaikan ketiganya untuk Peti Harian (koin, bahan, equipment).
- Titik merah di 📜 berarti ada hadiah yang bisa diambil. Misi dihitung dari saat misi itu aktif.
- NPC desa memberi petunjuk misi utama saat diajak bicara, dan tanda seru ❗ muncul di atas kepalanya kalau ada hadiah misi yang belum diambil.

## Battle
- Malam (sekitar 19:00-05:00) monster muncul di sekitar rumah dan mengejar kamu atau menuju rumah. Pagi hari mereka menghilang.
- Dinding, pagar, dan pintu tertutup menghalangi monster. Kalau buntu, mereka merusak bangunan, jadi pakai dinding batu untuk bertahan.
- Slime, serigala, kerangka, dan Golem Batu punya gambar sendiri (menghadap pemain, animasi gerak). Warna tubuh berubah mengikuti elemen wilayah.
- Monster memberi XP, koin, bahan, dan kadang equipment. Naik level menambah HP dan serangan.
- Pingsan: kamu bangun di depan rumah keesokan paginya, koin berkurang 10%.

## Dunia adventure
- Dunia kini 128x128 tile (sebelumnya 64x64) dengan sekitar 15 desa procedural dari seed. Buka 🗺️ atau M untuk peta dan daftar desa (nama, elemen wilayah, tingkat, jarak).
- Tiap desa punya nama, rumah, **toko** (Aksi di depan toko: jual panen dengan bonus harga makin jauh dari rumah, beli 3 equipment stok harian), **NPC** (Aksi untuk ngobrol, ada petunjuk elemen dan tingkat gua), dan **gua dungeon sendiri**.
- Tingkat dungeon = tingkat desa (makin jauh dari rumah makin tinggi) + berapa kali bosnya sudah kamu kalahkan. Monster di dungeon desa berelemen sesuai wilayah desa itu.
- Di luar, jika lebih dari 40 tile dari rumah, monster liar muncul (siang dan malam), makin jauh makin banyak, kuat, dan memberi reward lebih besar. Area sekitar desa aman.
- Save lama dari dunia 64x64 otomatis dimigrasi. Jika kamu sedang di dalam dungeon saat memuat save lama, kamu dikembalikan ke luar gua.

## Skill tree dan elemen
- Tiap naik level dapat 1 skill point. Buka 🌳: 4 cabang (Attack, Defense, Magic, Heal), ada bonus pasif dan skill aktif (maks 4 di bar, pakai mana 💙 dan cooldown).
- Magic: buka Dasar Sihir, lalu pilih sihir dari 7 elemen (Api, Tanah, Air, Angin, Listrik, Light, Dark).
- Siklus elemen: Api > Angin > Tanah > Listrik > Air > Api, dan Light dan Dark saling kuat. Menyerang elemen yang dikalahkan = damage 1.5x (angka oranye ▲), menyerang yang menang atas elemenmu = 0.6x (angka abu ▼), elemen sama = 0.8x.
- Monster punya elemen (ikon di atas kepalanya). Elemen senjata (slot Tangan) mewarnai serangan biasa. Elemen di equipment lain memberi resistensi atau kelemahan terhadap elemen monster.

## Dungeon
- Cari gua batu gelap sekitar 16 langkah dari rumah (panah kuning di tepi layar menunjukkan arahnya). Berdiri di depannya lalu tekan Aksi.
- Di dalam: ruangan dan lorong acak, monster diam sampai kamu mendekat, peti (Aksi untuk buka), dan boss Golem Batu di ruangan terjauh.
- Boss memberi reward besar (batu, 2 equipment bagus). Setelah boss kalah, tingkat dungeon naik untuk masuk berikutnya (makin sulit, reward makin bagus).
- Pulang lewat portal ungu (Aksi di depannya). Waktu dunia berhenti selama kamu di dalam. Kalau pingsan, kamu bangun di depan rumah.
- Catatan: kalau game dimuat ulang di dalam dungeon, monster yang sudah dikalahkan muncul lagi (peti dan status boss tetap).

## Equipment
Buka 🎒: 5 slot (kepala, badan, kaki, tangan, punggung). Item punya rarity, stat (⚔️🛡️❤️), dan kadang elemen. Daftar tas menampilkan perbandingan ▲▼ sebelum dipakai. Item bisa dijual.

## Pengaturan, suara, dan cadangan save
- ⚙️ di kiri atas: suara on/off (efek suara sintesis, tanpa file audio), ekspor dan impor save (file JSON), dan ringkasan cara main.
- Save tersimpan di localStorage browser. Kalau data browser dihapus, save hilang, jadi ekspor berkala.
- Fast travel: di 🗺️, desa yang sudah ditemukan dan rumah bisa dituju seharga 15 koin.
- Bisa dipasang ke layar utama (PWA) dan tetap jalan offline setelah dibuka sekali (butuh http/https, bukan file://).

## Deploy ke Cloudflare Pages (gratis, tanpa Workers)
Game ini murni file statis, jadi cukup Pages dan tidak perlu server, database, atau layanan berbayar.
**Cara 1: upload langsung (paling mudah)**
1. Dashboard Cloudflare, Workers & Pages, Create, tab Pages, Upload assets.
2. Beri nama proyek (misal `dusun-senja`), seret isi folder ini (index.html harus di akar), klik Deploy.
3. Buka alamat `https://dusun-senja.pages.dev`. Untuk update: Create deployment baru dengan folder terbaru.

**Cara 2: Git (update otomatis tiap push)**
1. Push folder ini ke repo GitHub atau GitLab (index.html di akar).
2. Pages, Create, Connect to Git, pilih repo. Framework preset: None. Build command: kosongkan. Build output directory: `/`.

**Cara 3: CLI**
`npx wrangler pages deploy . --project-name dusun-senja`

**Catatan**
- `_headers` mengatur cache dan keamanan dasar. `sw.js` memakai strategi network-first, jadi update langsung terlihat. Untuk rilis baru, naikkan `V` di `sw.js`.
- Total sekitar 100 KB tanpa kompresi, jauh di bawah batas file (25 MB per file) dan 20.000 file Pages. Trafik file statis tidak dibatasi di free tier.
- Domain sendiri bisa ditambahkan di tab Custom domains (gratis).
