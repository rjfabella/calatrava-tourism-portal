/* ──────────────────────────────────────────────────────────────────────────
   Calatrava Tourism Portal — UI internationalisation (chrome only)
   ----------------------------------------------------------------------------
   Translates the persistent UI chrome (nav, footer, hero, section labels,
   buttons, the visitor gate, page headings, CTAs) into 6 languages. Content
   prose rendered from data/*.json is intentionally left in English.

   How it works
   ------------
   • Each translatable string is keyed by its *English* text (normalised: inner
     whitespace collapsed, trimmed). An element is only ever managed if its
     English text is present in a dictionary at first sight — so JS-rendered
     content (never added to the dictionaries) is never touched.
   • LEAF strings (plain text, no child elements) swap via textContent.
   • RICH strings (titles with <em>, gate buttons with <small>/<br>) swap via
     innerHTML; the original markup is stored so English can be restored.
   • The chosen language persists in localStorage and updates <html lang>.

   To add a string: add its English text as a key under DICT_TEXT (plain) or
   DICT_HTML (markup) with the five translations, and make sure a selector below
   reaches the element. To add a language: add it to LANGS and to every entry.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', name: 'English'  },
    { code: 'ja', name: '日本語'   },
    { code: 'ko', name: '한국어'   },
    { code: 'de', name: 'Deutsch'  },
    { code: 'es', name: 'Español'  },
    { code: 'fr', name: 'Français' }
  ];
  var SUPPORTED = LANGS.map(function (l) { return l.code; });
  var STORAGE_KEY = 'siteLang';

  /* aria-label for the switcher itself */
  var UI = {
    Language: { ja: '言語', ko: '언어', de: 'Sprache', es: 'Idioma', fr: 'Langue' }
  };

  /* ── LEAF dictionary (plain text, swapped via textContent) ─────────────── */
  var DICT_TEXT = {
    // Navigation + brand
    'Destinations':            { ja: '目的地', ko: '여행지', de: 'Reiseziele', es: 'Destinos', fr: 'Destinations' },
    'Activities':              { ja: 'アクティビティ', ko: '액티비티', de: 'Aktivitäten', es: 'Actividades', fr: 'Activités' },
    'Stay':                    { ja: '宿泊', ko: '숙박', de: 'Übernachten', es: 'Alojamiento', fr: 'Hébergement' },
    'Local Life':              { ja: '地域の暮らし', ko: '현지 생활', de: 'Lokales Leben', es: 'Vida Local', fr: 'Vie Locale' },
    'Getting Here':            { ja: 'アクセス', ko: '오시는 길', de: 'Anreise', es: 'Cómo Llegar', fr: 'Accès' },
    'Map':                     { ja: 'マップ', ko: '지도', de: 'Karte', es: 'Mapa', fr: 'Carte' },
    'Talk to a Local Guide':   { ja: '地元ガイドに相談', ko: '현지 가이드와 상담', de: 'Lokalen Guide kontaktieren', es: 'Habla con un Guía Local', fr: 'Parler à un Guide Local' },
    'Romblon, Philippines':    { ja: 'フィリピン・ロンブロン', ko: '필리핀 롬블론', de: 'Romblon, Philippinen', es: 'Romblon, Filipinas', fr: 'Romblon, Philippines' },
    'Skip to content':         { ja: 'コンテンツへスキップ', ko: '본문으로 건너뛰기', de: 'Zum Inhalt springen', es: 'Saltar al contenido', fr: 'Aller au contenu' },

    // Hero (home)
    'Skip the crowded postcards': { ja: '定番の絶景はもう十分', ko: '뻔한 관광지는 그만', de: 'Schluss mit überlaufenen Postkartenmotiven', es: 'Olvídate de las postales abarrotadas', fr: 'Oubliez les cartes postales bondées' },
    'Romblon’s best-kept secret': { ja: 'ロンブロン、とっておきの秘密', ko: '롬블론의 숨겨진 보석', de: 'Romblons bestgehütetes Geheimnis', es: 'El secreto mejor guardado de Romblon', fr: 'Le secret le mieux gardé de Romblon' },
    'Where the trails are quiet and the waters are wild — step off the grid': { ja: '静かなトレイルと荒々しい海へ — 日常を離れて', ko: '고요한 트레일과 거친 바다로 — 일상에서 벗어나다', de: 'Wo die Pfade still und die Wasser wild sind — raus aus dem Alltag', es: 'Donde los senderos son tranquilos y las aguas salvajes — desconéctate', fr: 'Où les sentiers sont calmes et les eaux sauvages — sortez des sentiers battus' },
    'Escape the Ordinary':     { ja: '非日常へ', ko: '일상 탈출', de: 'Dem Alltag entfliehen', es: 'Escapa de lo ordinario', fr: 'Sortez de l’ordinaire' },
    'Map My Adventure':        { ja: '冒険をマップで', ko: '모험 지도 보기', de: 'Mein Abenteuer planen', es: 'Traza mi aventura', fr: 'Cartographier mon aventure' },
    'Scroll':                  { ja: 'スクロール', ko: '스크롤', de: 'Scrollen', es: 'Desliza', fr: 'Défiler' },

    // Section labels
    'Top Destinations':        { ja: '人気の目的地', ko: '인기 여행지', de: 'Top-Reiseziele', es: 'Destinos Destacados', fr: 'Destinations Phares' },
    'Experiences':             { ja: '体験', ko: '체험', de: 'Erlebnisse', es: 'Experiencias', fr: 'Expériences' },
    'Interactive Map':         { ja: 'インタラクティブマップ', ko: '인터랙티브 지도', de: 'Interaktive Karte', es: 'Mapa Interactivo', fr: 'Carte Interactive' },
    'Where to Stay':           { ja: '宿泊先', ko: '숙소 안내', de: 'Unterkünfte', es: 'Dónde Alojarse', fr: 'Où Loger' },
    'Watch':                   { ja: '動画', ko: '영상', de: 'Videos', es: 'Mira', fr: 'À Regarder' },
    'Photo Gallery':           { ja: 'フォトギャラリー', ko: '포토 갤러리', de: 'Fotogalerie', es: 'Galería de Fotos', fr: 'Galerie Photo' },
    'Live Like a Local':       { ja: '地元のように暮らす', ko: '현지인처럼 살기', de: 'Leben wie ein Einheimischer', es: 'Vive como un local', fr: 'Vivez comme un local' },
    'Find Your Way Around':    { ja: '周辺を歩く', ko: '길 찾기', de: 'Orientierung vor Ort', es: 'Oriéntate', fr: 'Trouvez votre chemin' },

    // "See all" links
    'View all destinations':   { ja: 'すべての目的地を見る', ko: '모든 여행지 보기', de: 'Alle Reiseziele ansehen', es: 'Ver todos los destinos', fr: 'Voir toutes les destinations' },
    'All accommodation':       { ja: 'すべての宿泊先', ko: '모든 숙소 보기', de: 'Alle Unterkünfte', es: 'Todo el alojamiento', fr: 'Tous les hébergements' },

    // Map controls
    'All':                     { ja: 'すべて', ko: '전체', de: 'Alle', es: 'Todos', fr: 'Tout' },
    'Accommodation':           { ja: '宿泊', ko: '숙박', de: 'Unterkünfte', es: 'Alojamiento', fr: 'Hébergement' },
    'Establishments':          { ja: '施設', ko: '시설', de: 'Einrichtungen', es: 'Establecimientos', fr: 'Établissements' },
    'Open in Google Maps':     { ja: 'Google マップで開く', ko: 'Google 지도에서 열기', de: 'In Google Maps öffnen', es: 'Abrir en Google Maps', fr: 'Ouvrir dans Google Maps' },
    'No pins available for this category yet.': { ja: 'このカテゴリのピンはまだありません。', ko: '이 카테고리에는 아직 핀이 없습니다.', de: 'Für diese Kategorie sind noch keine Markierungen verfügbar.', es: 'Aún no hay marcadores para esta categoría.', fr: 'Aucun repère disponible pour cette catégorie pour le moment.' },
    'We\'re actively charting the municipality\'s hidden viewpoints, local eateries, and secret dive spots — alongside every beach, waterfall, place to stay, and service point. Start plotting your own route through Calatrava.': { ja: '私たちは、すべてのビーチ、滝、宿泊先、サービス拠点に加え、町の隠れた展望スポット、地元の食堂、秘密のダイビングポイントを現在マッピングしています。カラトラバを巡るあなただけのルートを描き始めましょう。', ko: '저희는 모든 해변, 폭포, 숙소, 편의 시설과 함께 마을의 숨은 전망 포인트, 현지 식당, 비밀 다이빙 스폿을 활발히 지도에 담고 있습니다. 칼라트라바를 누비는 나만의 경로를 그려보세요.', de: 'Wir kartieren laufend die versteckten Aussichtspunkte, lokalen Lokale und geheimen Tauchplätze der Gemeinde – samt jedem Strand, Wasserfall, jeder Unterkunft und Servicestelle. Plane deine eigene Route durch Calatrava.', es: 'Estamos cartografiando activamente los miradores escondidos, las casas de comida locales y los puntos de buceo secretos del municipio, junto con cada playa, cascada, alojamiento y punto de servicio. Empieza a trazar tu propia ruta por Calatrava.', fr: 'Nous cartographions activement les points de vue cachés, les petits restaurants locaux et les spots de plongée secrets de la municipalité, ainsi que chaque plage, cascade, hébergement et point de service. Commencez à tracer votre propre itinéraire à travers Calatrava.' },

    // Section paragraphs
    'Beyond the beaches — discover the cafés, dining spots, shops, pharmacies, clinics, gyms, and churches that make Calatrava an easy place to settle in and stay a while.': { ja: 'ビーチだけじゃない — カフェ、食事処、ショップ、薬局、クリニック、ジム、教会など、カラトラバには長く滞在しやすい暮らしが揃っています。', ko: '해변 그 너머 — 카페, 맛집, 상점, 약국, 클리닉, 헬스장, 교회까지. 칼라트라바를 오래 머물기 좋은 곳으로 만드는 것들을 만나보세요.', de: 'Mehr als nur Strände – entdecke die Cafés, Restaurants, Geschäfte, Apotheken, Kliniken, Fitnessstudios und Kirchen, die Calatrava zu einem Ort machen, an dem man gern länger bleibt.', es: 'Más allá de las playas: descubre los cafés, restaurantes, tiendas, farmacias, clínicas, gimnasios e iglesias que hacen de Calatrava un lugar fácil para instalarse y quedarse una temporada.', fr: 'Au-delà des plages — découvrez les cafés, restaurants, boutiques, pharmacies, cliniques, salles de sport et églises qui font de Calatrava un endroit où il fait bon s’installer un moment.' },
    'Reach our Tourism Council directly for bookings, guide arrangements, and local information.': { ja: 'ご予約、ガイドの手配、地域情報については、観光協議会に直接お問い合わせください。', ko: '예약, 가이드 섭외, 현지 정보는 관광 협의회로 직접 문의하세요.', de: 'Wende dich für Buchungen, Guide-Vermittlung und lokale Informationen direkt an unseren Tourismusrat.', es: 'Contacta directamente con nuestro Consejo de Turismo para reservas, gestión de guías e información local.', fr: 'Contactez directement notre Conseil du Tourisme pour les réservations, l’organisation de guides et les informations locales.' },
    'Our accredited tourism operators handle island hopping, waterfall trekking guides, and transport arrangements from the port terminal. Contact us directly for group packages and custom itineraries.': { ja: '認定観光事業者が、アイランドホッピング、滝トレッキングのガイド、港ターミナルからの送迎を手配します。グループパッケージやカスタム旅程については直接お問い合わせください。', ko: '공인 관광 사업자가 아일랜드 호핑, 폭포 트레킹 가이드, 항구 터미널 교통편을 준비해 드립니다. 단체 패키지와 맞춤 일정은 직접 문의해 주세요.', de: 'Unsere akkreditierten Tourismusanbieter organisieren Inselhüpfen, Wasserfall-Trekking-Guides und Transfers vom Hafenterminal. Kontaktiere uns direkt für Gruppenpakete und individuelle Reiserouten.', es: 'Nuestros operadores turísticos acreditados se encargan del island hopping, los guías de senderismo a cascadas y el transporte desde la terminal portuaria. Contáctanos directamente para paquetes de grupo e itinerarios personalizados.', fr: 'Nos opérateurs touristiques agréés organisent le saut d’île en île, les guides de randonnée vers les cascades et les transferts depuis le terminal portuaire. Contactez-nous directement pour des forfaits de groupe et des itinéraires sur mesure.' },

    // Breadcrumb
    'Home':                    { ja: 'ホーム', ko: '홈', de: 'Startseite', es: 'Inicio', fr: 'Accueil' },

    // Footer column headings
    'Plan Your Visit':         { ja: '旅の計画', ko: '여행 준비', de: 'Besuch planen', es: 'Planifica tu visita', fr: 'Préparer sa visite' },
    'Contact':                 { ja: 'お問い合わせ', ko: '연락처', de: 'Kontakt', es: 'Contacto', fr: 'Contact' },
    'Explore':                 { ja: '見どころ', ko: '둘러보기', de: 'Entdecken', es: 'Explora', fr: 'Explorer' },

    // Footer links
    'Beaches & Islands':       { ja: 'ビーチ＆アイランド', ko: '해변과 섬', de: 'Strände & Inseln', es: 'Playas e Islas', fr: 'Plages et Îles' },
    'Waterfalls':              { ja: '滝', ko: '폭포', de: 'Wasserfälle', es: 'Cascadas', fr: 'Cascades' },
    'Island Hopping':          { ja: 'アイランドホッピング', ko: '아일랜드 호핑', de: 'Inselhüpfen', es: 'Island Hopping', fr: 'Saut d’île en île' },
    'View All':                { ja: 'すべて見る', ko: '전체 보기', de: 'Alle ansehen', es: 'Ver todo', fr: 'Tout voir' },
    'Services Map':            { ja: 'サービスマップ', ko: '편의시설 지도', de: 'Servicekarte', es: 'Mapa de Servicios', fr: 'Carte des Services' },
    'Tour Operators':          { ja: 'ツアー事業者', ko: '투어 업체', de: 'Reiseveranstalter', es: 'Operadores Turísticos', fr: 'Voyagistes' },
    'All Destinations':        { ja: 'すべての目的地', ko: '모든 여행지', de: 'Alle Reiseziele', es: 'Todos los Destinos', fr: 'Toutes les Destinations' },
    'Local Life Guide':        { ja: '地域の暮らしガイド', ko: '현지 생활 가이드', de: 'Leitfaden Lokales Leben', es: 'Guía de Vida Local', fr: 'Guide de la Vie Locale' },
    'Tourism Council FB':      { ja: '観光協議会 Facebook', ko: '관광 협의회 페이스북', de: 'Tourismusrat Facebook', es: 'Facebook del Consejo', fr: 'Facebook du Conseil' },
    'Official tourism portal of the Municipality of Calatrava, Province of Romblon, Philippines. Managed by the Calatrava Tourism Council.': { ja: 'フィリピン・ロンブロン州カラトラバ町の公式観光ポータル。カラトラバ観光協議会が運営しています。', ko: '필리핀 롬블론주 칼라트라바 시의 공식 관광 포털입니다. 칼라트라바 관광 협의회가 운영합니다.', de: 'Offizielles Tourismusportal der Gemeinde Calatrava, Provinz Romblon, Philippinen. Betrieben vom Tourismusrat von Calatrava.', es: 'Portal oficial de turismo del Municipio de Calatrava, Provincia de Romblon, Filipinas. Gestionado por el Consejo de Turismo de Calatrava.', fr: 'Portail touristique officiel de la municipalité de Calatrava, province de Romblon, Philippines. Géré par le Conseil du Tourisme de Calatrava.' },

    // Footer bottom
    '© 2026 Municipality of Calatrava, Romblon. All rights reserved.': { ja: '© 2026 ロンブロン州カラトラバ町。無断転載を禁じます。', ko: '© 2026 롬블론 칼라트라바 시. 모든 권리 보유.', de: '© 2026 Gemeinde Calatrava, Romblon. Alle Rechte vorbehalten.', es: '© 2026 Municipio de Calatrava, Romblon. Todos los derechos reservados.', fr: '© 2026 Municipalité de Calatrava, Romblon. Tous droits réservés.' },
    'Republic of the Philippines': { ja: 'フィリピン共和国', ko: '필리핀 공화국', de: 'Republik der Philippinen', es: 'República de Filipinas', fr: 'République des Philippines' },
    'Staff Portal':            { ja: 'スタッフポータル', ko: '직원 포털', de: 'Mitarbeiterportal', es: 'Portal del Personal', fr: 'Portail du Personnel' },

    // Visitor gate (leaf parts)
    'Welcome':                 { ja: 'ようこそ', ko: '환영합니다', de: 'Willkommen', es: 'Bienvenido', fr: 'Bienvenue' },

    // Destinations page hero stats
    'Barangays':               { ja: 'バランガイ', ko: '바랑가이', de: 'Barangays', es: 'Barangays', fr: 'Barangays' },
    'Env. Fee':                { ja: '環境保全料', ko: '환경 보전료', de: 'Umweltgebühr', es: 'Tasa Ambiental', fr: 'Taxe Environnementale' },

    // 404 page
    'The page you\'re looking for has drifted away — but Calatrava\'s hidden lakes, waterfalls, and beaches are right where you left them.': { ja: 'お探しのページは流されてしまったようです — でも、カラトラバの秘密の湖、滝、ビーチは、いつもの場所であなたを待っています。', ko: '찾으시는 페이지가 떠내려간 것 같습니다 — 하지만 칼라트라바의 숨은 호수, 폭포, 해변은 그대로 그 자리에 있습니다.', de: 'Die gesuchte Seite ist abgedriftet – doch Calatravas versteckte Seen, Wasserfälle und Strände sind genau dort, wo du sie verlassen hast.', es: 'La página que buscas se ha ido a la deriva, pero los lagos escondidos, las cascadas y las playas de Calatrava siguen justo donde las dejaste.', fr: 'La page que vous cherchez a dérivé au loin — mais les lacs cachés, les cascades et les plages de Calatrava sont restés là où vous les aviez laissés.' },
    'Back to Home':            { ja: 'ホームに戻る', ko: '홈으로 돌아가기', de: 'Zurück zur Startseite', es: 'Volver al inicio', fr: 'Retour à l’accueil' },
    'Explore Destinations':    { ja: '目的地を見る', ko: '여행지 둘러보기', de: 'Reiseziele entdecken', es: 'Explorar destinos', fr: 'Découvrir les destinations' },

    // Mobile quick bar (text sits next to an icon — translated at the text node)
    'Facebook Page':           { ja: 'Facebook ページ', ko: '페이스북 페이지', de: 'Facebook-Seite', es: 'Página de Facebook', fr: 'Page Facebook' }
  };

  /* ── RICH dictionary (markup, swapped via innerHTML) ───────────────────── */
  var DICT_HTML = {
    // Home section titles
    'Places worth the journey':            { ja: '訪れる価値のある<em>場所</em>', ko: '<em>떠날 가치</em>가 있는 곳', de: 'Orte, die <em>die Reise wert</em> sind', es: 'Lugares que <em>valen el viaje</em>', fr: 'Des lieux qui <em>valent le détour</em>' },
    'Things to do in Calatrava':           { ja: '<em>カラトラバ</em>でできること', ko: '<em>칼라트라바</em>에서 할 일', de: 'Aktivitäten in <em>Calatrava</em>', es: 'Qué hacer en <em>Calatrava</em>', fr: 'Que faire à <em>Calatrava</em>' },
    '“X” marks the spot':                  { ja: '「X」が示す<em>その場所</em>', ko: '“X”가 가리키는 <em>그곳</em>', de: '„X“ markiert <em>den Ort</em>', es: 'La «X» marca <em>el lugar</em>', fr: 'Le « X » marque <em>l’emplacement</em>' },
    'Rest well, wake up to the sea':       { ja: 'ぐっすり眠り、<em>海とともに目覚める</em>', ko: '푹 쉬고, <em>바다와 함께 깨어나다</em>', de: 'Gut ausruhen, <em>mit dem Meer erwachen</em>', es: 'Descansa bien, <em>despierta junto al mar</em>', fr: 'Reposez-vous, <em>réveillez-vous face à la mer</em>' },
    'Calatrava in motion':                 { ja: '動く<em>カラトラバ</em>', ko: '움직이는 <em>칼라트라바</em>', de: 'Calatrava <em>in Bewegung</em>', es: 'Calatrava <em>en movimiento</em>', fr: 'Calatrava <em>en mouvement</em>' },
    'Moments from around Calatrava':       { ja: '<em>カラトラバ</em>の風景の一瞬', ko: '<em>칼라트라바</em> 곳곳의 순간들', de: 'Momente aus <em>ganz Calatrava</em>', es: 'Momentos de <em>todo Calatrava</em>', fr: 'Instants des <em>quatre coins de Calatrava</em>' },
    'Calatrava town map':                  { ja: '<em>カラトラバ</em>の町マップ', ko: '<em>칼라트라바</em> 타운 맵', de: '<em>Stadtplan</em> von Calatrava', es: '<em>Mapa</em> de Calatrava', fr: '<em>Plan</em> de Calatrava' },

    // Page H1s
    'Explore Calatrava':                   { ja: '<em>カラトラバ</em>を巡る', ko: '<em>칼라트라바</em> 둘러보기', de: '<em>Calatrava</em> entdecken', es: 'Explora <em>Calatrava</em>', fr: 'Explorer <em>Calatrava</em>' },
    'Where to Stay':                       { ja: '<em>宿泊</em>先', ko: '<em>숙소</em> 안내', de: 'Wo <em>übernachten</em>', es: 'Dónde <em>alojarse</em>', fr: 'Où <em>loger</em>' },
    'Local Life Guide':                    { ja: '地域の<em>暮らしガイド</em>', ko: '현지 <em>생활 가이드</em>', de: 'Leitfaden <em>Lokales Leben</em>', es: 'Guía de <em>Vida Local</em>', fr: 'Guide de la <em>Vie Locale</em>' },
    'Getting to Calatrava':                { ja: '<em>カラトラバ</em>への行き方', ko: '<em>칼라트라바</em> 가는 길', de: 'Anreise nach <em>Calatrava</em>', es: 'Cómo llegar a <em>Calatrava</em>', fr: 'Se rendre à <em>Calatrava</em>' },
    'Lost at sea? It happens to the best explorers.': { ja: '航路を見失いましたか？<em>優れた探検家にもよくあることです。</em>', ko: '길을 잃으셨나요? <em>훌륭한 탐험가도 종종 겪는 일이죠.</em>', de: 'Auf hoher See verloren? <em>Das passiert auch den besten Entdeckern.</em>', es: '¿Perdido en el mar? <em>Le pasa hasta a los mejores exploradores.</em>', fr: 'Perdu en mer ? <em>Cela arrive même aux meilleurs explorateurs.</em>' },

    // CTA headings
    'Ready to step off the grid? Talk to a local guide.': { ja: '日常を離れる準備はできましたか？<em>地元ガイドに相談しましょう。</em>', ko: '일상에서 벗어날 준비 되셨나요? <em>현지 가이드와 상담하세요.</em>', de: 'Bereit, dem Alltag zu entfliehen? <em>Sprich mit einem lokalen Guide.</em>', es: '¿Listo para desconectar? <em>Habla con un guía local.</em>', fr: 'Prêt à sortir des sentiers battus ? <em>Parlez à un guide local.</em>' },
    'Ready to work from paradise?':        { ja: '<em>楽園で働く</em>準備はできましたか？', ko: '<em>낙원에서 일할</em> 준비 되셨나요?', de: 'Bereit, <em>aus dem Paradies zu arbeiten?</em>', es: '¿Listo para <em>trabajar desde el paraíso?</em>', fr: 'Prêt à <em>travailler depuis le paradis ?</em>' },
    'Ready to book? We can arrange it.':   { ja: '予約の準備はできましたか？<em>私たちが手配します。</em>', ko: '예약하시겠어요? <em>저희가 준비해 드릴게요.</em>', de: 'Bereit zu buchen? <em>Wir organisieren es.</em>', es: '¿Listo para reservar? <em>Nosotros lo organizamos.</em>', fr: 'Prêt à réserver ? <em>Nous nous en occupons.</em>' },
    'Need help booking your stay?':        { ja: '<em>宿泊の予約</em>でお困りですか？', ko: '<em>숙소 예약</em> 도움이 필요하세요?', de: 'Hilfe bei der <em>Buchung Ihrer Unterkunft?</em>', es: '¿Necesitas ayuda para <em>reservar tu estancia?</em>', fr: 'Besoin d’aide pour <em>réserver votre séjour ?</em>' },
    'Need help planning your trip?':       { ja: '<em>旅の計画</em>でお困りですか？', ko: '<em>여행 계획</em> 도움이 필요하세요?', de: 'Hilfe bei der <em>Reiseplanung?</em>', es: '¿Necesitas ayuda para <em>planificar tu viaje?</em>', fr: 'Besoin d’aide pour <em>planifier votre voyage ?</em>' },

    // Local-life button (keeps the arrow span)
    'See our local life guide →':          { ja: '地域の暮らしガイドを見る <span aria-hidden="true">→</span>', ko: '현지 생활 가이드 보기 <span aria-hidden="true">→</span>', de: 'Zum Leitfaden Lokales Leben <span aria-hidden="true">→</span>', es: 'Ver la guía de vida local <span aria-hidden="true">→</span>', fr: 'Voir le guide de la vie locale <span aria-hidden="true">→</span>' },

    // Visitor gate (markup parts)
    'Are you visiting as a tourist, or are you a local resident?Choose below to continue.': { ja: '観光でお越しですか、それとも地元の方ですか？<br>下から選択してお進みください。', ko: '관광객으로 방문하시나요, 아니면 현지 주민이신가요?<br>아래에서 선택해 계속하세요.', de: 'Besuchen Sie uns als Tourist oder sind Sie hier ansässig?<br>Wählen Sie unten, um fortzufahren.', es: '¿Nos visitas como turista o eres residente local?<br>Elige abajo para continuar.', fr: 'Visitez-vous en tant que touriste ou êtes-vous un résident local ?<br>Choisissez ci-dessous pour continuer.' },
    'I\'m a TouristExplore the tourism portal': { ja: '観光客です<small>観光ポータルを見る</small>', ko: '관광객입니다<small>관광 포털 둘러보기</small>', de: 'Ich bin Tourist<small>Zum Tourismusportal</small>', es: 'Soy turista<small>Explorar el portal turístico</small>', fr: 'Je suis touriste<small>Explorer le portail touristique</small>' },
    'I\'m a LocalGo to the municipal site': { ja: '地元の住民です<small>町の公式サイトへ</small>', ko: '현지 주민입니다<small>시청 사이트로 이동</small>', de: 'Ich bin Einheimischer<small>Zur Gemeinde-Website</small>', es: 'Soy local<small>Ir al sitio municipal</small>', fr: 'Je suis local<small>Aller au site municipal</small>' }
  };

  /* ── Selectors that reach translatable chrome ──────────────────────────── */
  // LEAF: translated via textContent. An element with child elements is skipped
  // (prevents wiping out icons/spans) — those go through RICH instead.
  var LEAF_SELECTORS = [
    '.nav-links a', '.nav-name small', '.mob-nav a', '.skip-link',
    '.hero-eyebrow', '.hero-sub', '.hero-tagline', '.hero-actions a', '.scroll-hint span',
    '.s-label', '.see-all', '.map-tag', '.map-btn', '.map-no-data', '.map-info p',
    '.life-text p', '.contact-text p', '.booking-text p',
    '.breadcrumb a', '.ph-stat span',
    '.f-brand p', '.f-col h4', '.f-col ul a', '.footer-bottom p', '.footer-bottom a',
    '.gate-title', '.actions a'
  ];
  // RICH: translated via innerHTML (markup preserved/translated).
  var RICH_SELECTORS = ['h1', 'h2', '.s-title', '.life-btn', '.gate-sub', '.gate-btn'];
  // TEXTNODE: element holds an icon + a text node; only the text node is swapped.
  var TEXTNODE_SELECTORS = ['.quick-bar a'];

  /* ── Engine ────────────────────────────────────────────────────────────── */
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function lookup(table, key, lang) {
    var e = table[key];
    return e && e[lang] ? e[lang] : null;
  }

  // Walk selectors once, capturing (and storing originals for) only elements
  // whose English text is present in the relevant dictionary.
  var managed = []; // { el, key, rich, orig }

  function capture() {
    var seen = new Set();
    function add(el, rich) {
      if (seen.has(el)) return;
      var table = rich ? DICT_HTML : DICT_TEXT;
      var key = norm(el.textContent);
      if (!table[key]) return;            // not a chrome string → never touch
      if (!rich && el.children.length) return; // leaf swap would destroy children
      seen.add(el);
      managed.push({ el: el, key: key, rich: rich, orig: rich ? el.innerHTML : el.textContent });
    }
    RICH_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { add(el, true); });
    });
    LEAF_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { add(el, false); });
    });
    TEXTNODE_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var node = null;
        for (var i = 0; i < el.childNodes.length; i++) {
          var n = el.childNodes[i];
          if (n.nodeType === 3 && norm(n.nodeValue)) { node = n; break; }
        }
        if (!node || !DICT_TEXT[norm(node.nodeValue)]) return;
        managed.push({ node: node, key: norm(node.nodeValue), textnode: true, orig: node.nodeValue });
      });
    });
  }

  function apply(lang) {
    managed.forEach(function (m) {
      var t = lang === 'en' ? null : lookup(m.rich ? DICT_HTML : DICT_TEXT, m.key, lang);
      if (m.textnode) {
        m.node.nodeValue = t == null ? m.orig : ' ' + t;
        return;
      }
      if (t == null) { // English, or no translation for this language → restore
        if (m.rich) m.el.innerHTML = m.orig; else m.el.textContent = m.orig;
        return;
      }
      if (m.rich) m.el.innerHTML = t; else m.el.textContent = t;
    });
    document.documentElement.lang = lang;
    // Translate the switcher's accessible label too.
    var label = lang === 'en' ? 'Language' : (UI.Language[lang] || 'Language');
    document.querySelectorAll('.lang-switch select').forEach(function (sel) {
      sel.setAttribute('aria-label', label);
      sel.value = lang;
    });
  }

  function detectLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var prefs = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var base = (prefs[i] || '').slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(base) !== -1) return base;
    }
    return 'en';
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'en';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply(lang);
  }
  window.setSiteLang = setLang;

  /* ── Language switcher UI ──────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('i18n-styles')) return;
    var css =
      '.lang-switch{display:inline-flex;align-items:center}' +
      '.lang-switch select{font-family:var(--fb,sans-serif);font-size:12px;letter-spacing:.06em;' +
      'background:rgba(255,255,255,.92);color:var(--deep,#0C2233);border:1px solid rgba(12,34,51,.18);' +
      'border-radius:3px;padding:6px 26px 6px 10px;cursor:pointer;line-height:1.2;' +
      'appearance:none;-webkit-appearance:none;-moz-appearance:none;' +
      "background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%230C2233\" stroke-width=\"2.4\"><polyline points=\"6 9 12 15 18 9\"/></svg>');" +
      'background-repeat:no-repeat;background-position:right 9px center;transition:border-color .3s,box-shadow .3s}' +
      '.lang-switch select:hover{border-color:rgba(12,34,51,.4)}' +
      '.lang-switch select:focus-visible{outline:2px solid var(--gold,#B88A45);outline-offset:2px}' +
      '.nav-links .lang-switch{margin-left:.25rem}' +
      '.mob-nav .lang-switch{margin-top:1rem}' +
      '.mob-nav .lang-switch select{font-size:16px;padding:10px 32px 10px 14px}' +
      '.lang-switch-fixed{position:fixed;top:1rem;right:1rem;z-index:300}';
    var s = document.createElement('style');
    s.id = 'i18n-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildSelect() {
    var sel = document.createElement('select');
    LANGS.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.name;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { setLang(sel.value); });
    return sel;
  }

  function makeSwitch(extraClass) {
    var wrap = document.createElement('div');
    wrap.className = 'lang-switch' + (extraClass ? ' ' + extraClass : '');
    wrap.appendChild(buildSelect());
    return wrap;
  }

  function injectSwitcher() {
    var placed = false;
    // Desktop nav — sit right beside the "Talk to a Local Guide" CTA.
    document.querySelectorAll('.nav-links').forEach(function (ul) {
      var li = document.createElement('li');
      li.appendChild(makeSwitch());
      var cta = ul.querySelector('.nav-cta');
      var ctaLi = cta ? cta.closest('li') : null;
      if (ctaLi) ul.insertBefore(li, ctaLi); else ul.appendChild(li);
      placed = true;
    });
    // Mobile nav
    document.querySelectorAll('.mob-nav').forEach(function (mob) {
      mob.appendChild(makeSwitch());
      placed = true;
    });
    // Standalone pages (e.g. 404) without a nav
    if (!placed) document.body.appendChild(makeSwitch('lang-switch-fixed'));
  }

  /* ── Init ──────────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectSwitcher();
    capture();
    apply(detectLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
