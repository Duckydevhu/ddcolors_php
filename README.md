# 🎨 DuckyColors - Professzionális Paletta Generátor

A **DuckyColors** egy letisztult, modern és funkciókban gazdag webes alkalmazás dizájnereknek és fejlesztőknek. Generálj, finomhangolj, tesztelj és exportálj színpalettákat valós idejű UI mockupokon keresztül! 

Ez a projekt a modern Frontend technológiákat (HTML5 Canvas, CSS Változók, Vanilla JS) ötvözi egy pehelysúlyú PHP backenddel a képek intelligens feldolgozásához.

## ✨ Főbb Funkciók

* 🎲 **Okos Generálás:** Véletlenszerű színek generálása egyetlen gombnyomásra (vagy a `Space` billentyűvel).
* 🎛️ **Globális Finomhangolás:** Módosítsd a teljes paletta Árnyalatát (Hue), Telítettségét (Saturation), Fényerejét (Brightness) és Hőmérsékletét egy valós idejű csúszkás panelen.
* 📸 **Kép-pipetta (Canvas Image Picker):** Tölts fel egy képet! A PHP kinyeri az alapvető domináns színeket, majd egy beépített, Canvas-alapú interaktív modális ablakban te magad választhatod ki pixel-pontosan a tökéletes árnyalatokat.
* 👀 **Élő UI Mockupok:** Ne csak vakon generálj! Nézd meg a palettádat élesben: Utazási Hero szekció, Mobil App, Admin Dashboard és Landing Page várja, hogy átszínezd. (Nagyításhoz kattints a kártyákra!)
* ✅ **Kontraszt Tesztelő:** W3C szabvány alapú WCAG kontrasztarány (világos és sötét háttéren) valós időben számolva.
* 💾 **Helyi Előzmények:** A böngésző `localStorage` segítségével elmentheted és egy becsúszó panelről bármikor visszatöltheted a legfeljebb 10 kedvenc palettádat.
* 📄 **HTML Export:** Egy kattintással letölthetsz egy gyönyörű, önálló HTML fájlt a színekkel, árnyalatokkal és a kész CSS változókkal (vágólapra másoláshoz).
* ↔️ **Drag & Drop:** Rendezd át a színek sorrendjét egyszerű húzással, vagy keverd meg őket a `Shuffle (🔀)` gombbal.

## 🛠️ Használt Technológiák

* **Frontend:** HTML5, CSS3 (CSS Variables, Grid, Flexbox), Vanilla JavaScript (ES6+).
* **Böngésző API-k:** `Canvas API` (Pipetta), `localStorage` (Mentés), `URL.createObjectURL()` (Biztonságos képbetöltés), `Blob API` (HTML Exportálás).
* **Backend:** PHP 7.4+ (Képfeldolgozás és domináns színek kinyerése a GD Library segítségével).

## 🚀 Telepítés és Futtatás

Mivel a projekt a képfeldolgozáshoz (`extract.php`) PHP backendet használ, egy egyszerű HTML megnyitás (`file:///...`) nem elegendő, és a böngésző biztonsági okokból blokkolhat bizonyos funkciókat (CORS / CSP).

1. **Szükséges környezet:** Telepíts egy helyi webszervert, ami futtat PHP-t (pl. [XAMPP](https://www.apachefriends.org/), [Laragon](https://laragon.org/), [MAMP](https://www.mamp.info/)).
2. **Klónozás / Másolás:** Másold a projekt mappáját a webszervered gyökérkönyvtárába (pl. XAMPP esetén a `htdocs` mappába).
3. **Futtatás:** Nyisd meg a böngésződet, és navigálj a helyi címre (pl. `http://localhost/duckycolors/index.html`).

## 📂 Projekt Struktúra

duckycolors/
│
├── index.html     # A fő felület HTML váza és a beágyazott SVG Mockupok
├── style.css      # Az oldal és a modális ablakok teljes dizájnja
├── script.js      # A varázslat: matek, UI logika, Canvas pipetta, Export
└── extract.php    # Mikro-szolgáltatás a feltöltött képek analizálásához
