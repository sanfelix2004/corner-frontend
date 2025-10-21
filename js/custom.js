// =========================
// 🌐 CONFIGURAZIONE BASE
// =========================
//const BASE_URL = "http://localhost:8080";
const BASE_URL = "https://corner-pub-backend.onrender.com";

// =========================
// 📌 MENU & PROMOZIONI
// =========================
const MENU_API          = `${BASE_URL}/api/menu`;                 // Menu principale
const MENU_HIGHLIGHTS   = `${BASE_URL}/api/in_evidenza`;          // Piatti in evidenza
const PROMOTIONS_API    = `${BASE_URL}/api/promotions/attive`;    // Promozioni attive

// =========================
// 🎉 EVENTI
// =========================
const EVENTS_API        = `${BASE_URL}/api/events`;               // Lista eventi
const EVENT_REGISTER    = `${EVENTS_API}`;                        // Registrazione a evento
const EVENT_REGISTRATIONS = `${BASE_URL}/api/reservations/events`; // Tutte le registrazioni evento

// =========================
// 📅 PRENOTAZIONI
// =========================
const RES_API           = `${BASE_URL}/api/reservations`;         // Endpoint base prenotazioni
const RES_USER_API      = `${RES_API}/user`;                      // Prenotazioni di un utente
const RES_TIMES_API     = `${RES_API}/available`;                 // Orari disponibili
const RES_LOOKUP_API    = `${RES_API}`;                           // Lookup per telefono/data
const RES_NOTIFY_API    = `${RES_API}/notify`;                    // Notifica contatto staff
// =========================
// 📌 RIFERIMENTI DOM MENU
// =========================
const filters = document.getElementById('categoryFilters');
const container = document.getElementById('menuItemsContainer');


let featuredIds = [];
let allItems = [];


function debugPrint(msg) {
  const box = document.getElementById('debugBox');
  if (box) box.innerHTML = msg;
}




// === SEZIONE PROMOZIONI ===
async function loadPromotions() {
  const listContainer  = document.getElementById('promoTitlesList');
  const cardsContainer = document.getElementById('promoItemsContainer');
  if (!listContainer || !cardsContainer) return;

  try {
    const response = await fetch(PROMOTIONS_API);
    if (!response.ok) throw new Error(await response.text());
    const promotions = await response.json();

    if (!promotions || promotions.length === 0) {
      togglePromotionsVisibility(false);   // nascondi tutto
      return;
    }

    togglePromotionsVisibility(true);      // mostra
    listContainer.innerHTML = promotions.map((p, idx) => `
      <li class="${idx === 0 ? 'active' : ''}" data-promo-index="${idx}">${p.nome}</li>
    `).join('');

    listContainer.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        listContainer.querySelectorAll('li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        const index = parseInt(li.dataset.promoIndex, 10);
        renderPromoItems(promotions[index]);
      });
    });

    renderPromoItems(promotions[0]);
  } catch (err) {
    console.error(err);
    togglePromotionsVisibility(false);     // in errore, nascondi
  }
}

// utilità se non l'hai già messa
const fmtEUR = n => `€${Number(n).toFixed(2)}`;

function renderPromoItems(promo) {
  const cardsContainer = document.getElementById('promoItemsContainer');
  if (!cardsContainer) return;

  const prodotti = Array.isArray(promo.items) ? promo.items : [];
  if (prodotti.length === 0) {
    cardsContainer.innerHTML = '<center><div class="col-12 text-center">Nessun prodotto in promozione</div></center>';
    // rimuovi eventuale vecchio summary
    const oldSummary = document.getElementById('promoSummary');
    if (oldSummary) oldSummary.remove();
    return;
  }

  // calcolo totali
  let totaleOriginale = 0;
  let totaleScontato  = 0;

  const rows = prodotti.map(item => {
    const prezzoOriginale = Number(item.prezzoOriginale || 0);
    const sconto          = Number(item.scontoPercentuale || 0);
    const prezzoFinale    = (item.prezzoScontato != null)
      ? Number(item.prezzoScontato)
      : prezzoOriginale * (1 - sconto / 100);
    const imageUrl        = item.imageUrl || 'img/default-food.jpg';
    const cat             = item.categoria || '';

    totaleOriginale += prezzoOriginale;
    totaleScontato  += prezzoFinale;

    return `
      <li class="promo-item">
        <div class="promo-thumb">
          <img src="${imageUrl}" alt="${item.nome}" loading="lazy">
        </div>
        <div class="promo-info">
          <h5>${item.nome}</h5>
          <div class="meta">${cat}</div>
        </div>
        <div class="promo-prices">
          ${prezzoOriginale ? `<span class="old">${fmtEUR(prezzoOriginale)}</span>` : ''}
          ${sconto ? `<span class="badge">-${sconto}%</span>` : ''}
          <span class="new">${fmtEUR(prezzoFinale)}</span>
        </div>
      </li>
    `;
  }).join('');

  // costruisco un'unica card
  const html = `
    <div class="col-12">
      <div class="promo-list-card">
        <div class="promo-list-header">
          <div>${promo.nome || 'Promozione'}</div>
          <div style="font-weight:900;">${prodotti.length} articoli</div>
        </div>
        <ul class="promo-items">
          ${rows}
        </ul>
        <div class="promo-totals">
          <div class="line"><span>Totale senza sconto</span><span class="without-discount">${fmtEUR(totaleOriginale)}</span></div>
          <div class="line"><span>Totale con sconto</span><span class="with-discount">${fmtEUR(totaleScontato)}</span></div>
          <div class="line"><span>Risparmio</span><span class="saving">${fmtEUR(totaleOriginale - totaleScontato)}</span></div>
        </div>
      </div>
    </div>
  `;

  // rimuovo eventuale vecchio riepilogo separato
  const oldSummary = document.getElementById('promoSummary');
  if (oldSummary) oldSummary.remove();

  // inserisco la nuova card unica
  cardsContainer.innerHTML = html;

  // piccola animazione d'entrata
  const card = cardsContainer.querySelector('.promo-list-card');
  if (card) {
    card.style.opacity = 0; card.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity .25s ease, transform .25s ease';
      card.style.opacity = 1; card.style.transform = 'translateY(0)';
    });
  }
}




function createPromoCard(promo, item) {
  const categoriaSlug   = (item.categoria || 'generico').replace(/\s+/g, '-');
  const prezzoOriginale = Number(item.prezzoOriginale ?? 0);
  const sconto          = Number(item.scontoPercentuale ?? 0);
  const prezzoFinale    = Number(item.prezzoScontato ?? (prezzoOriginale * (1 - sconto / 100)));
  const imageUrl        = item.imageUrl || 'img/default-food.jpg';

  return `
    <div class="col-sm-6 col-lg-4 all ${categoriaSlug}">
      <div class="box promo-card">
        <div class="img-box">
          <img src="${imageUrl}" alt="${item.nome}" />
        </div>
        <div class="detail-box">
          <h5>${item.nome}</h5>
          <p>${item.categoria || ''}</p>
          <div class="mt-2">
            <div class="d-flex align-items-center gap-2">
              <span class="text-muted text-decoration-line-through">€${prezzoOriginale.toFixed(2)}</span>
              <span class="badge bg-danger">-${sconto}%</span>
            </div>
            <div class="fw-bold text-success mt-1 fs-5">€${prezzoFinale.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>`;
}


function initMap() {
  const coords = { lat: 41.1250, lng: 16.7819 };
  const map = new google.maps.Map(document.getElementById('mapContainer'), {
    center: coords,
    zoom: 16,
    disableDefaultUI: true, // pulito senza controlli
  });

  const marker = new google.maps.Marker({
    position: coords,
    map: map,
    title: "Corner Hamburgeria"
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `<div style="font-family: 'Open Sans', sans-serif; color: #222831;">
                <h3 style="margin:0;">Corner Hamburgeria</h3>
                <p>Piazza Duomo 58</p>
                <p>70054 Giovinazzo (BA)</p>
              </div>`
  });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  // Mostra info window all'avvio
  infoWindow.open(map, marker);
}

// Chiama initMap dopo che la Google Maps API è caricata

// === POPUP EVENTI AL PRIMO ACCESSO ===
function showEventsPopup(events) {
  if (!events || events.length === 0) return;

  // Inject styles for event popup images (only once)
  if (!document.getElementById('eventsPopupStyles')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'eventsPopupStyles';
    styleTag.textContent = `
      /* Popup eventi: layout con riquadro info sopra e locandina grande sotto */
      body.no-scroll{ overflow:hidden; }
      .popup-container{ max-height:94vh; height:auto; }
      .popup-content{ max-height: calc(94vh - 48px); height:auto; overflow:auto; -webkit-overflow-scrolling: touch; }
      .events-list{ overflow:auto; max-height: calc(94vh - 140px); -webkit-overflow-scrolling: touch; }
      .events-list .event-item{ overflow: visible; }

      .popup-container, .popup-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }
      .events-list .event-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
      }

      .events-list .event-item{
        padding: 12px;
        border: 1px solid rgba(0,0,0,.06);
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,.03);
        margin-bottom: 16px;
      }
      .events-list .event-info{
        padding: 10px 12px;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 10px;
        background: #f9fafb;
        margin-bottom: 12px;
      }
      .events-list .event-info h3{
        margin: 0 0 6px 0;
        font-size: 1.15rem;
        line-height: 1.25;
      }
      .events-list .event-info p{
        margin: 0 0 6px 0;
        color: #555;
      }
      .events-list .event-info time{
        color: #6c757d;
        font-size: .92rem;
      }
      /* Locandina grande sotto il riquadro, contenuta senza distorsioni. Nessuna scrollbar interna. */
      .events-list .event-poster{
        width: 100%;
        /* altezza impostata via JS per evitare barre di scorrimento */
        border-radius: 10px;
        background: #f1f3f5;
        overflow: hidden; /* mai scroll */
        display: flex;
        align-items: center;
        justify-content: center;
        max-height: 100%;
        aspect-ratio: auto;
        max-width: 100%;
        height: auto;
      }
      .events-list .event-poster img{
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 10px;
        max-width: 100%;
        display: block;
      }
    `;
    document.head.appendChild(styleTag);
  }

  const modalHTML = `
  <div id="eventsPopupOverlay" class="popup-overlay">
    <div class="popup-container">
      <button id="closeEventsPopupBtn" class="close-btn" aria-label="Chiudi popup">&times;</button>
      <div class="popup-content">
        <h2>Eventi in programma</h2>
        <div class="events-list">
          ${events.map(event => {
            const poster = event.posterUrl || event.poster_url || 'images/default-event.jpg';
            const dateLabel = new Date(event.data).toLocaleString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `
              <div class="event-item">
                <div class="event-info">
                  <h3>${event.titolo}</h3>
                  <p>${event.descrizione ?? ''}</p>
                  <time datetime="${event.data}">${dateLabel}</time>
                </div>
                <div class="event-poster">
                  <img src="${poster}" alt="Locandina di ${event.titolo}">
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.body.classList.add('no-scroll');

  document.getElementById('closeEventsPopupBtn').addEventListener('click', closeEventsPopup);

  // Calibra dinamicamente l'altezza della locandina per evitare barre di scorrimento
  function adjustEventPosters(){
    document.querySelectorAll('#eventsPopupOverlay .event-item').forEach(item => {
      const poster = item.querySelector('.event-poster img');
      const container = item.querySelector('.event-poster');
      if (poster && container) {
        poster.style.height = 'auto';
        poster.style.width = '100%';
        container.style.height = 'auto';
      }
    }); 
  }

  function closeEventsPopup() {
    const popup = document.getElementById('eventsPopupOverlay');
    if (popup) {
      popup.classList.add('hide');
      setTimeout(() => popup.remove(), 300);
      document.body.classList.remove('no-scroll');
      sessionStorage.setItem('eventsPopupShown', 'true');
    }
  }
  
  requestAnimationFrame(() => {
    const popup = document.getElementById('eventsPopupOverlay');
    if (popup) popup.classList.add('visible');
  });

  // setta subito l'altezza ottimale e aggiornala su resize/orientamento
  adjustEventPosters();
  window.addEventListener('resize', adjustEventPosters);
  window.addEventListener('orientationchange', adjustEventPosters);
}


async function checkAndShowEvents() {
  // Controlla se il popup è già stato mostrato
  if (sessionStorage.getItem('eventsPopupShown')) return;
  
  try {
    const res = await fetch(EVENTS_API);
    if (!res.ok) throw new Error(res.statusText);
    const events = await res.json();
    showEventsPopup(events);
  } catch (err) {
    console.error('Errore nel caricamento eventi:', err);
  }
}

// === REGISTRAZIONE EVENTI NELLA PRENOTAZIONE ===
async function loadEventsForRegistration(selectedDate = null) {
  try {
    let url = EVENTS_API;
    if (selectedDate) {
      url = `${EVENTS_API}?date=${selectedDate}`;
    }


    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const events = await res.json();
    
    const select = document.getElementById('eventSelect');
    const noEventsMessage = document.getElementById('noEventsMessage');
    
    if (!select) return;
    
    // Svuota il select e nascondi il messaggio
    select.innerHTML = '<option value="">Seleziona un evento</option>';
    if (noEventsMessage) noEventsMessage.classList.add('d-none');
    
    if (events && events.length > 0) {
      events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = `${event.titolo} - ${new Date(event.data).toLocaleDateString('it-IT')}`;
        select.appendChild(option);
      });
      
      // Mostra la sezione eventi
      const eventSection = document.getElementById('eventRegistrationSection');
      if (eventSection) {
        eventSection.classList.remove('d-none');
      }
    } else {
      // Mostra messaggio se non ci sono eventi
      if (noEventsMessage) {
        noEventsMessage.classList.remove('d-none');
        noEventsMessage.textContent = selectedDate 
          ? `Non ci sono eventi programmati per il ${new Date(selectedDate).toLocaleDateString('it-IT')}`
          : 'Non ci sono eventi programmati al momento';
      }
      
      // Nascondi la sezione eventi
      const eventSection = document.getElementById('eventRegistrationSection');
      if (eventSection) {
        eventSection.classList.add('d-none');
      }
    }
  } catch (err) {
    console.error('Errore nel caricamento eventi:', err);
    showToast('Errore nel caricamento degli eventi', true);
  }
}

// === INIZIO BLOCCO PER IL MENU DINAMICO ===
function renderFilters(categories) {
  if (!filters) return;
  
  filters.innerHTML = '';

  if (featuredIds.length > 0) {
    const li = document.createElement('li');
    li.setAttribute('data-filter', 'In Evidenza');
    li.innerText = 'In Evidenza';
    filters.appendChild(li);
  }

  categories.forEach(cat => {
    const li = document.createElement('li');
    li.setAttribute('data-filter', cat);
    li.innerText = cat;
    filters.appendChild(li);
  });

  filters.querySelectorAll('li').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      btn.classList.add('active');
      renderMenuItems(btn.getAttribute('data-filter'));
    });
  });
}
function renderAllergens(allergens = []) {
  if (!Array.isArray(allergens) || allergens.length === 0) return '';
  const chips = allergens.map(a => {
    const isTrace = a.status === 'MAY_CONTAIN';
    const prefix = isTrace ? '(tracce)' : '(contiene)';
    const text = `${prefix} ${a.label.toLowerCase()}`;
    return `<li class="allergen-chip">${text}</li>`;
  }).join('');
  return `<div class="allergens"><ul class="allergen-list">${chips}</ul></div>`;
}
function renderMenuItems(filter = 'In Evidenza') {
  if (!container) return;
  
  container.innerHTML = '';
  let toShow;

  if (filter === 'In Evidenza') {
    toShow = allItems.filter(i => featuredIds.includes(i.id));
  } else {
    toShow = allItems.filter(i => i.categoria === filter);
  }

  toShow.forEach(item => {
    const imageUrl = item.imageUrl || 'images/default-food.jpg'; // fallback unificato come nelle promo

    const card = `
  <div class="col-sm-6 col-lg-4 all ${item.categoria}">
    <div class="box">
      <div class="img-box position-relative">
        <img src="${imageUrl}" alt="${item.titolo}" />
        ${featuredIds.includes(item.id)
          ? '<span class="badge badge-warning position-absolute" style="top:8px;right:8px;">★</span>'
          : ''}
      </div>
      <div class="detail-box">
        <h5>${item.titolo}</h5>
        <p>${item.descrizione || ''}</p>
        ${renderAllergens(item.allergens)}
        <div class="options">
          <h6>€${item.prezzo.toFixed(2)}</h6>
          <a href="#"><i class="fa fa-shopping-cart"></i></a>
        </div>
      </div>
    </div>
  </div>`;
    container.insertAdjacentHTML('beforeend', card);
  });

  if (window.$grid) {
    $grid.isotope('reloadItems').isotope();
  }
}


async function loadMenu() {
  try {
    const [menuRes, evRes] = await Promise.all([
      fetch(MENU_API),
      fetch(MENU_HIGHLIGHTS)
    ]);
    
    const [menuData, highlights] = await Promise.all([
      menuRes.json(),
      evRes.json()
    ]);

    allItems = menuData;
    featuredIds = highlights.map(h => h.itemId);

    const cats = [...new Set(menuData.map(i => i.categoria))];
    renderFilters(cats);

    const defaultBtn = filters.querySelector('[data-filter="In Evidenza"]');
    if (defaultBtn) {
      defaultBtn.classList.add('active');
      renderMenuItems('In Evidenza');
    }
  } catch (err) {
    if (container) {
      container.innerHTML = '<p>Errore nel caricamento del menu.</p>';
    }
    console.error(err);
  }
}

// === FINE BLOCCO PER IL MENU DINAMICO ===

// 1) Footer: anno corrente
function getYear() {
  const yearElement = document.querySelector("#displayYear");
  if (yearElement) {
    yearElement.innerText = new Date().getFullYear();
  }
}

// Caricamento orari disponibili
const form = document.getElementById('reservationForm');
const dateInput = document.getElementById('resDate');
const timeSelect = document.getElementById('resTime');
const msgBox = document.getElementById('resMessage');

if (dateInput) {
  dateInput.addEventListener('change', async () => {
    const formattedDate = dateInput.value;
    debugPrint("Data scelta change(): " + formattedDate);
    if (!timeSelect) return;
    
    timeSelect.innerHTML = `<option value="" disabled selected>Caricamento…</option>`;
    if (window.$ && $.fn.niceSelect) {
      $('select').niceSelect('update');
    }

    try {
      const formattedDate = dateInput.value; // già corretto (yyyy-MM-dd)
    
      const [slotsRes, eventsRes] = await Promise.all([
        fetch(`${RES_TIMES_API}/${formattedDate}`),
        fetch(`${EVENTS_API}?date=${formattedDate}`)
      ]);
      
      const [slots, events] = await Promise.all([
        slotsRes.ok ? slotsRes.json() : [],
        eventsRes.ok ? eventsRes.json() : []
      ]);

      // Popola gli orari
      timeSelect.innerHTML = `<option value="" disabled selected>Seleziona ora</option>`;
      slots.forEach(t => {
        const o = document.createElement('option');
        o.value = t;
        o.innerText = t;
        timeSelect.appendChild(o);
      });

      // Gestione eventi
      const eventSelect = document.getElementById('eventSelect');
      const noEventsMessage = document.getElementById('noEventsMessage');
      
      if (eventSelect) {
        eventSelect.innerHTML = '<option value="">Seleziona un evento</option>';
        if (noEventsMessage) noEventsMessage.classList.add('d-none');
        
        if (events && events.length > 0) {
          events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = `${event.titolo} - ${new Date(event.data).toLocaleDateString('it-IT')}`;
            eventSelect.appendChild(option);
          });
          
          // Mostra la sezione eventi
          const eventSection = document.getElementById('eventRegistrationSection');
          if (eventSection) {
            eventSection.classList.remove('d-none');
          }
        } else {
          // Mostra messaggio se non ci sono eventi
          if (noEventsMessage) {
            noEventsMessage.classList.remove('d-none');
            noEventsMessage.textContent = `Non ci sono eventi programmati per il ${new Date(dateInput.value).toLocaleDateString('it-IT')}`;
          }
          
          // Nascondi la sezione eventi
          const eventSection = document.getElementById('eventRegistrationSection');
          if (eventSection) {
            eventSection.classList.add('d-none');
          }
        }
      }
    } catch (err) {
      timeSelect.innerHTML = `<option value="" disabled>Errore nel caricamento</option>`;
      console.error(err);
    }
    
    if (window.$ && $.fn.niceSelect) {
      $('select').niceSelect('update');
    }
  });
}

// Submit prenotazione
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!msgBox) return;
    
    msgBox.textContent = '';

    const payload = {
      name: document.getElementById('resName').value.trim(),
      phone: document.getElementById('resPhone').value.trim(),
      date: dateInput.value,
      time: timeSelect.value,
      people: parseInt(document.getElementById('resPeople').value, 10),
      note: document.getElementById('resNote').value.trim()
    };
    debugPrint("Data inviata nel payload submit(): " + payload.date);

    try {
      const res = await fetch(RES_API, {   // NOTA: usa RES_API, NON RES_USER_API
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      

      if (res.status === 201 || res.ok) {
        const dto = await res.json();
        alert(`Prenotazione confermata per il ${dto.date} alle ${dto.time}.`);

        // Registrazione evento se selezionato
        const eventId = document.getElementById('eventSelect')?.value;
        if (eventId) {
          await registerForEvent(
            eventId, 
            payload.name, 
            payload.phone, 
            payload.people,
            payload.note
          );
        }

        form.reset();
        if (timeSelect) {
          timeSelect.innerHTML = `<option value="" disabled selected>Seleziona ora</option>`;
        }

        const eventSelect = document.getElementById('eventSelect');
        if (eventSelect) {
          eventSelect.value = '';
        }

        if (window.$ && $.fn.niceSelect) {
          $('select').niceSelect('update');
        }
      } else {
        const err = await res.json();
        alert(`Errore: ${err.message || res.statusText}`);
      }
    } catch (err) {
      alert('Impossibile contattare il server.');
      console.error(err);
    }
  });
}

// Le mie Prenotazioni
const lookupForm = document.getElementById('lookupForm');
const lookupPhoneInput = document.getElementById('lookupPhone');
const reservationsList = document.getElementById('reservationsList');

if (lookupForm) {
  lookupForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!reservationsList) return;
    
    reservationsList.innerHTML = '';

    const phone = lookupPhoneInput.value.trim();
    if (!phone) return;

    try {
      const res = await fetch(`${RES_USER_API}/${encodeURIComponent(phone)}`);
      if (!res.ok) throw new Error(res.statusText);
      const list = await res.json();

      if (list.length === 0) {
        reservationsList.innerHTML = `
        <center>
          <li class="list-group-item">
            Nessuna prenotazione trovata per <strong>${phone}</strong>.
          </li></center>`;
      } else {
        list.forEach(r => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `
            <div>
              <strong>${r.date} @ ${r.time}</strong><br>
              Persone: ${r.people}<br>
              Note: ${r.note || '-'}<br>
              ${r.isEventRegistration ? '<span class="badge bg-info">Evento</span>' : ''}
            </div>
            <button
              class="btn btn-sm btn-danger cancel-btn"
              data-phone="${r.phone}"
              data-date="${r.date}"
              data-event="${r.isEventRegistration}"
              data-eventid="${r.eventId || ''}"
            >Annulla</button>
          `;
          reservationsList.appendChild(li);
        });
        
    }   
  } catch (err) {
      reservationsList.innerHTML = `
        <li class="list-group-item text-danger">
          Errore durante il recupero delle prenotazioni.
        </li>`;
      console.error(err);
    }
  });
}
if (reservationsList) {
  reservationsList.addEventListener('click', async e => {
    if (!e.target.classList.contains('cancel-btn')) return;

    const btn = e.target;
    const date = btn.dataset.date;
    const phone = btn.dataset.phone;
    const isEvent = btn.dataset.event === 'true';
    const eventId = btn.dataset.eventid;

    if (!confirm(`Vuoi veramente annullare la prenotazione del ${date}?`)) return;

    try {
      let url;
      let options = { method: 'DELETE' };

      if (isEvent) {
        if (isEvent) {
          url = `${EVENTS_API}/${encodeURIComponent(eventId)}/unregister/${encodeURIComponent(phone)}`;
        }
              } else {
                url = `${RES_API}/${encodeURIComponent(phone)}/${encodeURIComponent(date)}`;
              }
      

      const res = await fetch(url, options);
      if (!res.ok) throw new Error(res.statusText);

      btn.closest('li').remove();
    } catch (err) {
      alert('Errore nell\'annullamento della prenotazione.');
      console.error(err);
    }
  });
}


// Gestione tab Prenotazione / Evento
const bookingTabs = document.getElementById('bookingTabs');
if (bookingTabs) {
  bookingTabs.querySelectorAll('li').forEach(tab => {
    tab.addEventListener('click', () => {
      bookingTabs.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      tab.classList.add('active');

      document.getElementById('tavoloForm').classList.add('d-none');
      document.getElementById('eventoForm').classList.add('d-none');
      document.getElementById(tab.dataset.target).classList.remove('d-none');
    });
  });
}

// Submit evento
const eventForm = document.getElementById('eventForm');
if (eventForm) {
  eventForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('eventName').value.trim(),
      phone: document.getElementById('eventPhone').value.trim(),
      partecipanti: parseInt(document.getElementById('eventPartecipanti').value, 10),
      note: document.getElementById('eventNote').value.trim()
    };
    const eventId = document.getElementById('eventSelect').value;
    try {
      const res = await fetch(`${EVENT_REGISTER}/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Iscrizione all'evento confermata!");
      eventForm.reset();
    } catch (err) {
      alert(`Errore: ${err.message}`);
    }
  });
}


// Scroll liscio
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Mappa
function myMap() {
  const mapElement = document.getElementById("googleMap");
  if (!mapElement) return;
  
  const coords = { lat: 41.1250, lng: 16.7819 };
  const map = new google.maps.Map(mapElement, {
    center: coords,
    zoom: 16
  });

  const marker = new google.maps.Marker({
    position: coords,
    map: map,
    title: "Corner Hamburgeria"
  });

  const infoContent = `
    <div style="font-family: 'Open Sans', sans-serif; color: #222831;">
      <h3 style="margin:0; font-size:1.2rem;">Corner Hamburgeria</h3>
      <p style="margin:4px 0;">Piazza Duomo 58</p>
      <p style="margin:0;">70054 Giovinazzo (BA)</p>
    </div>
  `;

  const infoWindow = new google.maps.InfoWindow({ content: infoContent });
  infoWindow.open(map, marker);
  marker.addListener("click", () => infoWindow.open(map, marker));
}

// Toast notifications
function showToast(message, isError = false) {
  const toast = document.getElementById('customToast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

async function registerForEvent(eventId, name, phone, partecipanti = 1, note = "") {
  try {
    const res = await fetch(`${EVENT_REGISTER}/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, partecipanti, note })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Errore iscrizione evento");
      return;
    }
    alert("Iscrizione evento confermata!");
    
  } catch (err) {
    console.error(err);
    showToast("Errore di connessione", true);
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    // Attiva bottone cliccato
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Mostra form corrispondente SOLO dentro #book
    const target = btn.dataset.target;
    document.querySelectorAll('#book .form_container').forEach(f => f.classList.add('d-none'));
    document.getElementById(target).classList.remove('d-none');

    // Se è la scheda eventi → carica eventi
    if (target === "eventoForm") {
      const selectedDate = document.getElementById('resDate')?.value || null;
      await loadEventsForRegistration(selectedDate);
    }
  });
});

function showNewsletterPopup() {
  const popup = document.getElementById('newsletterPopup');
  if (popup) {
    popup.classList.add('visible');
  }
}

function closeNewsletterPopup() {
  const popup = document.getElementById('newsletterPopup');
  if (popup) {
    popup.classList.remove('visible');
    setTimeout(() => popup.remove(), 300);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getYear();

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  loadPromotions();
  loadMenu();
  checkAndShowEvents();
  loadEventsForRegistration();
});
  $(function(){
    $("#heroCarousel").owlCarousel({
      items: 1,
      loop: true,
      autoplay: true,
      autoplayTimeout: 4000,
      autoplayHoverPause: false,
      animateOut: "fadeOut",
      autoplaySpeed: 700,
      dots: false,
      nav: false
    });
  });

function togglePromotionsVisibility(hasPromos) {
  const section = document.getElementById('promotionsSection');
  if (!section) return;

  // mostra/nascondi la sezione
  section.style.display = hasPromos ? '' : 'none';

  // ONDA SOPRA: cerca lo svg immediatamente precedente
  (function hidePrevWave() {
    let el = section.previousElementSibling;
    while (el && el.tagName && el.tagName.toLowerCase() !== 'svg') {
      el = el.previousElementSibling;
    }
    if (el && el.tagName && el.tagName.toLowerCase() === 'svg') {
      el.style.display = hasPromos ? '' : 'none';
    }
  })();

  // ONDE SOTTO: blocco subito dopo la sezione (ha due svg)
  (function hideOnlyFirstBottomWave() {
    const after = section.nextElementSibling;           // <div> con due svg
    if (!after) return;
    const firstSvg = after.querySelector('svg:first-of-type');
    if (firstSvg) firstSvg.style.display = hasPromos ? '' : 'none';
    // il secondo svg resta visibile
  })();

  // Link “Promozioni” nel menu
  const navPromoLi = document.querySelector('a.nav-link[href="#promotionsSection"]')?.closest('li');
  if (navPromoLi) navPromoLi.style.display = hasPromos ? '' : 'none';
}