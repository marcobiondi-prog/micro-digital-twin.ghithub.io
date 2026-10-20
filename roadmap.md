# Roadmap
- [x] Correct vineyard slider precision, scenario bounds and all-zone mean; five tests pass and browser verifies Budget Sostenuto 35.5°C, decimal edits and all-zone upper limit.
- [x] Lab share in installed Android APK (WebView): upload file/ZIP, share 7-day link via native bridge or Android SEND intent chooser. Physical APK unverified.

- [x] AI camera: heat legend centred vertically on the right edge, thermal estimate width preserved. Authenticated scan and legend opening verified at 411×775 and 775×411 without overlap or browser errors; 5 tests pass, build OK. Physical APK unverified.

- [x] AI camera: selected goal selectors use the app cobalt blue, the goal selectors sit inside one larger glass capsule, the urban tree selector reads "Vegetazione", the caption under the selectors is removed, and the result chip sits beside the selectors as "Esito" with a pulse icon. Browser verified: capsule 161x48 fully rounded, selected pill cobalt with white label, no caption node, chip 50x48 directly right of the capsule with no overflow at 411/360/landscape, no console errors; 3 focus tests pass, build OK. Physical APK unverified.
- [x] AI camera: compact glass text selectors beside Info; selection/alignment verified in both flows and orientations, tests passed, build OK. Physical APK unverified.

- [x] AR camera: portrait analysis clears selectors; landscape selectors align with top actions and tools sit beside thermal results. Authenticated browser scan/open verified both orientations, 20 tests pass, build OK; physical APK remains unverified.

- [x] AR camera: goal selectors sit higher in landscape (compact top bar, 36 px tools), portrait untouched; browser verified landscape 50 px vs portrait 68 px, 13 AR tests pass, build OK. Physical APK landscape spacing remains device-dependent.


- [x] Casi: weather every five minutes, daily original-source publication research and public read-only cache; live refresh succeeded for all 13 cases, public UI verified desktop/phone, unauthorized writes rejected, three tests pass. Publish required for the scheduled production callback.

- [x] Home videos close immediately on the system back swipe (verified phone/tablet).

- [x] Home videos: no system rotation on open (keep portrait lock, CSS landscape) and no browser fullscreen security banner on phones/tablets, like the AI camera.


- [x] Touch videos start landscape with native-resize-aware fallback and hide before swipe/button close; both videos verified fullscreen/unmuted on phone and portrait/landscape tablet, no browser errors, 28 tests pass. Physical APK transition remains device-dependent.

- [x] Repair home video fullscreen opening/expand: both real videos enter and re-enter fullscreen on phone/tablet/desktop with unchanged player and audio, close correctly, no browser errors; 25 tests pass and build OK. Native APK fullscreen/orientation still requires the user's physical device.

- [x] Remove forced home-video native/CSS rotation and enable audio on both videos; browser verified playback, unmuted volume and fullscreen without rotation on phone/tablet/desktop. Native APK behavior requires the user's device.

- [x] Integrate uploaded home tutorial/promo with first-access promo, replay controls, desktop slide and touch landscape fullscreen; both real videos played and closed in browser phone/tablet/desktop, reload suppresses promo, 19 tests pass. Native APK orientation/system bars require the user's device.

- [x] Move startup glass hint below camera commands and preserve landscape during pitch/flat holding. Authenticated browser verified banner placement/disappearance and tilt stability; 26 tests pass, build OK. Exact Android 17 web-camera tilt rules are undocumented; native APK behavior requires the user’s device.

- [x] Improve AI rotation stability with hysteresis and Android 16-inspired shortest-turn snapshots. Authenticated browser verified four directions, four transitions, reduced motion, native landscape coverage and close without errors; 24 tests pass, build OK. Physical APK animation/system bars require the user’s device.

- [x] Align frozen recognition with live rotated preview and size from the camera container. Authenticated browser verified both scan directions, full viewport coverage, tutorial and close without runtime errors; 22 tests pass and build OK. Physical APK/system bars remain device-dependent.

- [x] Correct locked-host sensor direction and counter-rotate camera footage independently of HUD; use camera-coloured fixed backdrop and modal view to remove app gutters. Restore visible four-step tutorial with animated concept illustrations and blur, recallable through Info. Browser fixture verified all steps and reopening; 24 tests pass, build OK. Native APK immersive system bars and physical orientation remain host-dependent.

- [x] Restore AI HUD in all four directions with a centred lower-edge shutter on portrait-locked hosts using bounded inner-camera rotation; native viewport resize takes precedence, grid uses matching angle and close gestures use local coordinates. Browser camera fixture verified both directions and native landscape; 18 tests pass, build OK. Physical APK sensor/system-bar behavior remains unverified.

- [x] Remove camera fullscreen requests; preserve AI orientation attempts, portrait restoration and Back/swipes. 21 tests pass and preview build OK. Authenticated browser camera opening could not be verified (AI control absent after session restore); native APK rotation requires physical host testing.

- [x] Add recallable leaf-framing guidance and AI photo caption snapshots for existing Lab/PDF inclusion; authenticated guide open/close and photo upload verified, seven tests pass. Report cache now tracks media changes. Physical camera recognition accuracy remains hardware-dependent.

- [x] Add separate urban/vineyard GeoJSON and CSV exports for QGIS with numeric values, simulation provenance and reference-place coordinates (no invented boundaries). Five tests passed; actual Lab edit and both downloads verified at phone/tablet/desktop with no runtime errors. Dashboard visual tests: 5/6 passed; existing tablet Urbana snapshot differs in height outside the changed export dialog, readability/overflow checks passed.

- [x] Implement all four AI camera UX improvements: transient framing hint and lock feedback, two-phase scan status with honest identification evidence, lower specimen/balance dock, hardware flash shortcut. Authenticated camera verified manual scanning and phase feedback; controlled botanical result verified +/−, drag 0→4 specimens/−2 °C, minimization and phone/tablet orientations with no runtime errors; 20 tests passed. Hardware flash needs a compatible physical device.

- [x] Improve recognition with same-frame leaf detail, higher resolution and diagnostic comparison; authenticated camera scan verified botanical result with no runtime errors.
- [x] Add capability-checked AI camera flash toggle; on/off and failure behavior tested, unsupported-camera UI verified. Hardware illumination requires a compatible physical device.

- [x] Improve plant scans using leaf shape as the primary identification evidence, higher-resolution frozen frames, mirino targeting, botanical verification and explicit uncertainty; authenticated live scan identified Acer genus from leaf morphology, correctly avoiding an unsupported species claim.
- [x] Connect scanned specimen count and thermal balance to consistent species-based temperature and shade estimates; authenticated phone browser verified 0→2 specimens: 0→3 °C indicative reduction and 0→100 m² theoretical shade, drag to 5 without closing, decrement and reset to zero; 34 tests passed. Physical camera/APK quality requires device testing.

- [x] Improve phone/tablet AR map framing and anchored pinch; browser fixture verified rotation and reopening at scale 0.779165 with retained offsets. Live AI survey unavailable for simulated camera; physical pinch check remains below.
- [x] Cap AI preview at 30 fps and suspend hidden-page rendering; 27 tests passed, authenticated photo saved/read back at 834×1194 with no grid or runtime errors. Actual battery savings require device measurement.

- [x] Add native placement return to AI camera, compact photographic plants in both orientations, live thermal estimates and visible perspective grid; 20 tests pass, authenticated preview placement/undo verified. Native ARCore return requires physical device check below.
- [x] Show a perspective grid during scanning and prevent tree placement throughout the camera HUD area; authenticated phone/landscape preview verified with real scan and blocked HUD tap.

- [x] Remove black tools-panel background and show AR options beside AR; authenticated browser verified transparent panel, same-row options and saved photo with no runtime errors.

- [x] Restore regular AI camera pills and keep thermal scan results visible with tools closed; authenticated scan, retained summary and saved photo verified on phone/tablet, 14 tests passed. Physical APK check remains below.

- [x] Further simplify AI HUD; actual scanned photographic plants replace procedural 3D trees in preview and native AR. Live authenticated scans, cutouts, tap placement and saved photos verified in urban phone/vineyard landscape tablet; 22 tests passed. The sample conifer species remained uncertain, correctly reported. Native ARCore/device check remains below.

- [x] Simplify AI camera HUD with recallable secondary tools; authenticated phone/tablet browser checks verified scans, retained placements, recalled maps and saved photos in both flows; 23 tests passed. Physical APK check remains below.

- [x] Remove Sketchfab; animated ground scan and image-based virtual map added. Authenticated live AI scans, urban tree and vineyard filare placement verified on phone/tablet; 21 tests passed. Temperature/consistency remain indicative; physical device check below.

- [x] Increase AI capture cues by 80% and unify camera HUDs with compact viewfinder, shutter and recording timer; 11 tests passed, authenticated AI photo and ordinary photo/video saved in browser, phone/tablet layouts checked without runtime errors. Physical APK audio/camera check remains below.

- [x] Extend shared center capture and small viewfinder to smartphones; 4 tests passed, authenticated phone browser photo/video and AI photos saved in both flows, no runtime errors. Native device verification remains below.

- [x] Repair camera close swipes in both views; real browser touch events verified in both Lab flows, including portrait tablet.
- [x] Enable center-tap photo/video capture only on touch tablets; photo/video saved and read back in both flows, phone excluded; 17 tests passed.

- [x] Restore the shared smartphone AI photo entry point on touch tablets at all widths; authenticated visibility checked at 834, 1366 and 1440 px, 11 orientation/swipe tests passed.
- [x] Confirm authenticated tablet AI photo capture end-to-end in both flows with simulated browser camera input; physical device check remains below.

- [x] Close AI camera with an upward swipe above the system gesture bar; authenticated browser touch checks passed in portrait/landscape, ground/horizontal swipes ignored, Back preserved. APK check requires physical device.

- [x] Open AI camera only after fullscreen transition, without dialog animation; close on Back/fullscreen exit as well as history Back.
- [x] Request fullscreen from AI opening gesture before retrying free native rotation; restore portrait and exit camera-owned fullscreen on close. APK field check remains blocked on physical device.
- [x] Default installed app to portrait; explicitly override only inside AI camera. APK field verification requires updated installation.
- [x] Lock phone/tablet app in portrait while allowing native rotation only inside AI camera; verify shared lifecycle policy with tests.
- [x] Release app portrait lock in AI camera; browser checks passed for both landscape directions, lower controls/grid/targets, capture upload and orientation cleanup.
- [x] Installed web app failed while Chrome worked: confirmed served manifest enforced portrait; changed to any, retaining the runtime portrait lock outside AR. Installed-device recheck awaits updated installation.

- [x] Improve AR recognition feedback, readable indicative results and placement lifecycle in both Lab flows; six tests and live AI image request passed, preview build OK.
- [x] Authenticated AR browser check — fresh session restored, camera rotation and capture upload verified with simulated camera input.
- [ ] Real Android APK camera and ARCore field check — requires the user's device and rebuilt APK.

- [x] Animate Ripristina and restore selected Compare snapshots in both flows after manual edits; repeated resets verified on desktop and smartphone with no runtime errors.

- [x] Space the urban intervention sliders (Alberi, Suolo permeabile, Pergole / ombra) like the vineyard weather sliders on smartphone only; verified at 411 px (22 px step) with unchanged panel width and grid.

- [x] Increase the gap between the vineyard weather sliders (temperatura, umidità suolo, vento) on tablet only, leaving the controls tab and the grid untouched; verified at 834 px (22 px step) with no clipping.

- [x] Fix confirmed urban Compare scenario stacking; verified repeated applications, switching, reopening and manual edits; cards match grid controls.

- [x] Redistribute Lab tablet/desktop spaces, preserving thermal grid dimensions and phone layout; verified both flows at 768, 1041, 1280 and 1440 px, phone at 393 px, sliders and Compare.
- [x] Further compact tablet controls into inline slider rows and a single-line temperature readout; verified both flows at 768, 834 and 1041 px with unchanged grid widths and no overflow.

- [x] Sync “Tutte le zone” across vineyard comparison, grid highlights, and proportional controls.

- [x] Recheck Lab grid and panel alignment on tablet/desktop; correct selector width and marker clipping, preserving the 9×6 layout.

- [x] Verify both Lab flows across desktop/tablet widths and themes; fix remaining alignment or clipping without changing the 9×6 grid.

- [x] Align the desktop Lab grid with its shorter intervention selector and expand simulation controls; preserve tablet/phone layouts and verify.

- [x] Optimize urban dashboard spacing on tablet/desktop and align vineyard AI wording; verify both layouts.

- [x] Let the logo header scroll naturally with all pages on every device, preserving menu behavior.

- [x] Return instantly to the top on active phone menu taps and verify the header stays in place when switching between Panoramica and Casi.

- [x] Restore the Compare view as a pop-up window in both Decision Lab flows.
- [x] Keep the Scenario Comparison and Prototyping Matrix tabs inside the pop-up.
- [x] Preserve live slicer values and highlighted cost level while the pop-up is open.
- [x] Validate opening, tab switching, closing, and build status.
- [x] Make the whole comparison pop-up scroll on tablet and desktop only, retaining its dark page backdrop and existing phone behavior.
- [x] Apply full pop-up scrolling over a fixed dark backdrop to every pop-up on tablet and desktop, without changing phone behavior.
- [x] Let the background page scroll beneath the same dark backdrop for every pop-up on tablet and desktop, while preserving phone behavior.
- [x] Restore the dark backdrop and make it move with the page rather than remain fixed on tablet and desktop.
- [x] Extend the moving dark backdrop through the full page height on tablet and desktop.
- [x] Lock smartphone orientation to portrait without notices or animations.
- [x] Pin Compare directly below Last Sync while scrolling the Decision Lab.
- [x] Mascotte: braccia con respiro lento (±7°, 4s), rimbalzo morbido senza sbattere
- [x] Rendere più evidente il pulsante Confronta in Flusso Urbano e Flusso Vitivinicolo
- [x] Confronta nel celeste originale del robot, con riflesso di vetro animato
- [x] Confronta: alone blu interno sincronizzato con la luce del bordo, poi satinato pulito con spalla viola
- [x] Confronta: ombra esterna inferiore disattivata per un look più minimale
- [x] Confronta: alone interno ritagliato dentro la capsula, nessuna luce dispersa sullo sfondo
- [x] Verifica Confronta nel flusso vitivinicolo e nel popup di confronto su schermo reale (desktop e telefono, chiaro e scuro)
- [x] Barra in basso: voce attiva in cobalto acceso (token --nav-accent), solo su smartphone
- [x] Verifica barra in basso in cobalto su telefono, chiaro e scuro
- [x] Voce attiva in cobalto: riflesso di luce statico (gloss fisso, nessuna animazione)
- [x] Tema scuro: capsula più profonda con icona chiara, coerente con le altre voci
- [x] Nascondere la barra in basso scorrendo verso il basso e farla ricomparire risalendo (solo smartphone)
- [x] Verify tablet/desktop logo header and pinned menu do not overlap when scrolling in Panoramica and Casi; preserve other sections and phone layout.
- [x] Mostrare nel blocco Stima del Lab i valori della scheda Confronta in evidenza, in entrambi i flussi.

- [x] Simulazione parere via email (tutti) e link reale di approvazione per gli enti (account)

- [x] Replace approval pills with progress stages and verify simulated progress decreases without an email resend or visible countdown.
- [x] Connect external decisions to progress stages, clear demo overrides on actual decisions, and verify completion and revocation with isolated browser data.

- [x] Dashboard urbana: riquadri co-benefici e approvazioni come card più grandi su tablet e desktop, telefono invariato.
- [x] Dashboard urbana: simulazione email gratuita nascosta agli utenti autenticati; la barra progresso avanza solo con i pareri reali degli enti.
- [x] Dati reali NASA POWER + Open-Meteo per la località scelta
- [x] Ridistribuire gli spazi del blocco "Dati reali della località" su tablet e desktop: due riquadri allineati, valori in linea a schermo largo, note nell'intestazione; telefono invariato.

- [x] Make the vineyard alert badge and header caption follow the computed stress level; keep the control sliders their original colour.

- [x] Distribuire i controlli del vigneto in due riquadri come nell’urbano (riepilogo + cursori), poi verificare telefono, tablet e desktop.

- [x] Restringere la Tab dei controlli di entrambi i flussi: colonna dei controlli limitata a 19rem su tablet/desktop, riquadri piu’ stretti su telefono; etichette dei cursori leggibili per intero.

- [x] Alzare leggermente la barra riepilogo località del Lab solo su desktop (≥1280 px); telefono e tablet invariati.
- [x] Abbassare ancora i pannelli controlli del Lab solo su tablet (768–1279 px): Urbano 547→507 px, Vitivinicolo 375→342 px; griglia, desktop e telefono invariati; verificato a 768, 834 e 1024 px senza testi tagliati.
- [x] Allineare la barra dei selettori interventi del Lab alla griglia su tablet e desktop: bordi destro e sinistro coincidenti, voci a larghezza naturale centrate; telefono invariato.
- [x] Spostare il pulsante “Ripristina” del vigneto dall’intestazione dei controlli alla riga di “Pioggia”, spinto a destra; verificato a 320, 393, 834 e 1440 px senza overflow.
- [x] Su desktop (≥1280 px) “Ripristina” del vigneto torna in cima, nell’intestazione come in urbano; su telefono e tablet resta a destra nella riga di “Pioggia”; verificato a 393, 834, 1280 e 1440 px senza overflow.
- [x] Aumentare di due terzi l’altezza delle card “Dati reali della località” solo su desktop (160→267 px, riquadri metrici 91 px), con etichette e valori centrati; tablet e telefono invariati; verificato a 393, 834 e 1440 px senza overflow.
- [x] Raddoppiare l’altezza delle card “Dati reali della località” solo su desktop (160→320 px, riquadri metrici 117 px, valori centrati e più grandi); tablet e telefono invariati; verificato a 393, 834 e 1440 px senza overflow.
- [x] Spostare l’etichetta “Apri in Google Maps” in una fascia propria sotto la mappa del Lab, così non copre più l’attribuzione della mappa; verificato a 393, 834 e 1440 px.
- [x] Feedback aptico (vibrazione) su tutti i cursori, solo con input touch (smartphone e tablet); computer e iPhone invariati, animazioni ridotte rispettate.
- [x] Reso più deciso il riscontro aptico dei cursori: doppio impulso 16+26 ms con pausa di 6 ms e anti-rimbalzo a 70 ms; verificato trascinando uno slider del Lab a 393 px (15 impulsi, valore 6→29).
- [x] Aumentata la distanza tra temperatura, umidità suolo e vento nel vigneto (da 4 a 14 px su smartphone), pannello controlli invariato; verificato a 411 px senza tagli o sovrapposizioni.
- [x] Allargata ancora la distanza tra i tre cursori meteo del vigneto (14→22 px su smartphone); passo riga misurato 40 px a 411 px, pannello, tablet e desktop invariati.
- [x] Ridotto lo spazio in fondo alla scheda controlli vitivinicola su smartphone, cursori e riga Pioggia/Ripristina integri.
- [x] Accostata la descrizione della fase fenologica alla riga "Germogliamento"/"Maturazione" (2 px) e azzerati i margini extra dello "space-y": scheda controlli 267,8→223,8 px su smartphone; cursori meteo a 40 px di passo, riga in fondo integra; verificato a 411 px.
- [x] Nella scheda "Foto e video" del Lab, su desktop (≥1280 px) resta solo "Galleria": "Scatta" e "Registra" sono nascosti; su tablet e telefono tutti e tre; verificato a 1440 (solo Galleria), 834 e 393 px.
- [x] Resa la scheda "Foto e video" del Lab un pannello a soffietto: l'intestazione (titolo, didascalia, conteggio file, freccia) apre e chiude caricamento ed elenco con un passaggio fluido; verificato Urbano e Vitivinicolo a 1440, 834 e 393 px (72→0→72 px, 112→0→112 px) senza errori.
- [x] Spostato "Elimina tutti" di "Foto e video" nella fila dei pulsanti, accanto a "Galleria", con la stessa forma e altezza (32 px) e colore rosso; verificato a 1280 px in chiaro e scuro (etichette intere, conferma prima di cancellare, elenco svuotato).
- [x] Foto e video: pillole smartphone in cascata — una dopo l'altra con attesa crescente (0/260/560/900 ms, 250 ms ciascuna); misurato 222/472/772/1122 ms a 393 px, nessuna pillola tagliata.
- [x] Foto e video: anche le righe dell'elenco (caricamento e file salvati) entrano in cascata su smartphone, una dopo l'altra (0/260/560 ms, 250 ms ciascuna); misurato 393 px con 3 foto, nessuna riga tagliata.
- [x] "Elimina tutti" usa la stessa cascata del caricamento: ritardi 0/260/560 ms e 250 ms ease-out per riga, poi il pannello si richiude; misurato 65/315/616 ms a 393 px, elenco vuoto in 888 ms.

- [x] AR camera (data overlay, thermal map, tap-to-place objects) only for signed-in users
- [x] Interfaccia AR più bella (mirino a tutto schermo)

- [x] Implement technical AR silhouettes, ground footprints and cooling areas; authenticated camera/capture verified at 411×775 and 834×1194 with simulated media, scene addition/removal checked with deterministic plant inputs. Real camera recognition and native tracking remain unverified; this view uses a virtual ground plane.
- [x] Speed up photo/video list cascade appearance: stagger 60 ms (cap 400 ms) and 170 ms row animation; verified three files fully visible in about 0.3 s at 411 px, rows clean after the notice.

- [x] Start both home videos directly in fullscreen with the controls floating inside; real fullscreen verified on desktop, edge-to-edge playback with audio verified on phone emulation, and the video keeps its position when fullscreen is refused or left; 6 tests pass, typecheck and build OK. Native APK fullscreen requires the user's device.
- [x] Landscape-only thermal summary enlargement: wider panel (min(40–42vw, 26rem)) and larger values/labels, bottom controls shifted so nothing overlaps; rules verified in the served stylesheet at 775×411, no console errors.
- [x] Lab: invio più file come ZIP condiviso tramite pannello di condivisione
- [x] Sicurezza: aggiornamenti fonti dei Casi letti solo dal server
- [x] Casi: added the Romanian case study (Cluj-Napoca · URBREATH Living Lab Someș) as the 14th card with its original source, reference coordinates, live weather and daily source research; job refreshed all 14 cases, 4 tests pass, build OK, browser verified desktop.
- [x] Lab foto e video: avviso a schermo quando i file si scaricano — «Download foto/video/archivio in corso…» conspinner, poi «Foto salvata / Video salvato / Archivio salvato sul dispositivo»; browser verified single photo (prova.jpg) and two-photo ZIP (rilievo-piazza.zip), 121 tests pass, build OK.
- [x] Home video su desktop: all'apertura restano nella hero slide a tutto campo (1248×630) senza fullscreen di sistema; verificato a 1440×900 con «Espandi video» che apre il fullscreen solo al tocco, senza errori; 8 test passano.
- [x] Panoramica «Inizia in 3 passi»: "Prova la piazza" e "Prova il vigneto" racchiusi in una capsula in vetro più grande (stesso materiale dei selettori del Lab); verificato a 350, 411, 820 e 1440 px — due pulsanti in una riga, entirely dentro la capsula, etichette intere, build OK.
- [x] Lab «Foto e video»: anche AI/Carica/Invia/Elimina racchiusi in un'unica capsula in vetro (stesso materiale dei selettori IA); verificato a 320, 411, 820 e 1440 px — 4 pillole in una riga da autenticati, 3 su desktop, nessuna etichetta tagliata, nessun overflow, build OK.
