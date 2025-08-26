// =========================
// 🌐 CONFIGURAZIONE BASE
// =========================
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
  const listContainer = document.getElementById('promoTitlesList');
  const cardsContainer = document.getElementById('promoItemsContainer');
  if (!listContainer || !cardsContainer) return;

  try {
    const response = await fetch(PROMOTIONS_API);
    if (!response.ok) throw new Error(await response.text());

    const promotions = await response.json();

    if (!promotions || promotions.length === 0) {
      cardsContainer.innerHTML = `<center><div class="alert alert-info">Nessuna promozione attiva</div></center>`;
      return;
    }

    // Popola titoli delle promozioni
    listContainer.innerHTML = promotions.map((p, idx) => `
      <li class="${idx === 0 ? 'active' : ''}" data-promo-index="${idx}">${p.nome}</li>
    `).join('');

    // Listener per clic su promozione
    listContainer.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        listContainer.querySelectorAll('li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        const index = parseInt(li.dataset.promoIndex, 10);
        renderPromoItems(promotions[index]);
      });
    });

    // Mostra i prodotti della prima promo di default
    renderPromoItems(promotions[0]);

  } catch (err) {
    cardsContainer.innerHTML = `<div class="alert alert-danger">Errore: ${err.message}</div>`;
    console.error(err);
  }
}

function renderPromoItems(promo) {
  const cardsContainer = document.getElementById('promoItemsContainer');
  if (!cardsContainer) return;

  const prodotti = promo.items || [];
  if (prodotti.length === 0) {
    cardsContainer.innerHTML = '<center><div class="col-12 text-center">Nessun prodotto in promozione</div></center>';
    return;
  }

  // Calcola totali
  let totaleOriginale = 0;
  let totaleScontato = 0;

  prodotti.forEach(item => {
    const prezzoOriginale = item.prezzoOriginale || 0;
    const sconto = item.scontoPercentuale || 0;
    const prezzoFinale = item.prezzoScontato != null
      ? item.prezzoScontato
      : prezzoOriginale * (1 - sconto / 100);

    totaleOriginale += prezzoOriginale;
    totaleScontato += prezzoFinale;
  });

  // Rimuovi eventuale riepilogo precedente
  const oldSummary = document.getElementById('promoSummary');
  if (oldSummary) oldSummary.remove();

  // Crea nuovo riepilogo
  const summary = document.createElement('div');
  summary.id = 'promoSummary';
  summary.className = 'text-center mb-4';
  summary.innerHTML = `
  <p><strong>Totale senza sconto:</strong> <span class="without-discount">€${totaleOriginale.toFixed(2)}</span></p>
  <p><strong>Totale con sconto:</strong> <span class="with-discount">€${totaleScontato.toFixed(2)}</span></p>
  <p><strong>Risparmio:</strong> <span class="saving">€${(totaleOriginale - totaleScontato).toFixed(2)}</span></p>
`;

  // Inserisci riepilogo sopra le card
  cardsContainer.parentElement.insertBefore(summary, cardsContainer);

  // Genera card prodotti
  cardsContainer.innerHTML = prodotti.map(item => {
    const categoriaSlug = (item.categoria || 'generico').replace(/\s+/g, '-');
    const prezzoOriginale = item.prezzoOriginale || 0;
    const sconto = item.scontoPercentuale || 0;
    const prezzoFinale = item.prezzoScontato != null
      ? item.prezzoScontato
      : prezzoOriginale * (1 - sconto / 100);
    const imageUrl = item.imageUrl || 'img/default-food.jpg';

    return `
      <div class="col-sm-6 col-lg-4 all ${categoriaSlug}">
        <div class="box promo-card">
          <div class="img-box">
            <img src="${imageUrl}" alt="${item.nome}" />
          </div>
          <div class="detail-box">
            <h5>${item.nome}</h5>
            <p>${item.categoria}</p>

            <div class="price-line mt-2 d-flex align-items-center gap-2">
              <span class="text-decoration-line-through text-muted">€${prezzoOriginale.toFixed(2)}</span>
              <span class="badge bg-danger">-${sconto}%</span>
            </div>

            <div class="fw-bold text-success mt-1">€${prezzoFinale.toFixed(2)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Inizializza Isotope se serve
  if (window.Isotope) {
    window.$gridPromotions = new Isotope(cardsContainer, {
      itemSelector: '.all',
      layoutMode: 'fitRows'
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

  const modalHTML = `
  <div id="eventsPopupOverlay" class="popup-overlay">
    <div class="popup-container">
      <button id="closeEventsPopupBtn" class="close-btn" aria-label="Chiudi popup">&times;</button>
      <div class="popup-content">
        <h2>Eventi in programma</h2>
        <div class="events-list">
          ${events.map(event => `
            <div class="event-item">
              <h3>${event.titolo}</h3>
              <p>${event.descrizione}</p>
              <time datetime="${event.data}">
                ${new Date(event.data).toLocaleString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('closeEventsPopupBtn').addEventListener('click', closeEventsPopup);

  function closeEventsPopup() {
    const popup = document.getElementById('eventsPopupOverlay');
    if (popup) {
      popup.classList.add('hide');
      setTimeout(() => popup.remove(), 300);
      sessionStorage.setItem('eventsPopupShown', 'true');
    }
  }
  
  requestAnimationFrame(() => {
    const popup = document.getElementById('eventsPopupOverlay');
    if (popup) popup.classList.add('visible');
  });
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
                url = `${RES_API}/lookup/${encodeURIComponent(phone)}/${encodeURIComponent(date)}`;
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
      document.getElementById('eventMessage').innerHTML =
        `<span class="text-success">Iscrizione confermata!</span>`;
      eventForm.reset();
    } catch (err) {
      document.getElementById('eventMessage').innerHTML =
        `<span class="text-danger">Errore: ${err.message}</span>`;
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
      showToast(err.message || "Errore iscrizione evento", true);
      return;
    }

    showToast("Iscrizione evento confermata!");
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

    // Mostra form corrispondente
    const target = btn.dataset.target;
    document.querySelectorAll('.form_container').forEach(f => f.classList.add('d-none'));
    document.getElementById(target).classList.remove('d-none');

    // Se è la scheda eventi → carica eventi
    if (target === "eventoForm") {
      const selectedDate = document.getElementById('resDate')?.value || null;
      await loadEventsForRegistration(selectedDate);
    }
  });
});
// Creazione e inserimento popup newsletter nel DOM
function createNewsletterPopup() {
  const popupHTML = `
  <div id="newsletterPopup" class="newsletter-popup-overlay">
    <div class="newsletter-popup">
      <button id="closePopupBtn" class="close-btn" aria-label="Chiudi popup">&times;</button>
      <div class="popup-content">
        <div class="popup-left">
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', popupHTML);

  // Eventi chiusura
  document.getElementById('closePopupBtn').addEventListener('click', () => {
    closeNewsletterPopup();
  });

  // Submit form
  document.getElementById('newsletterForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('newsletterName').value.trim();
    const email = document.getElementById('newsletterEmail').value.trim();
    const msgElem = document.getElementById('formMessage');

    if (!name || !email) {
      msgElem.textContent = "Compila entrambi i campi.";
      msgElem.style.color = "red";
      return;
    }

    // Simula invio dati (qui metti la chiamata reale API se vuoi)
    try {
      // esempio simulato di attesa
      await new Promise(resolve => setTimeout(resolve, 1000));

      msgElem.textContent = "Iscrizione avvenuta con successo! Grazie.";
      msgElem.style.color = "green";

      // reset form dopo 2 secondi e chiudi popup
      setTimeout(() => {
        document.getElementById('newsletterForm').reset();
        closeNewsletterPopup();
      }, 2000);
    } catch (err) {
      msgElem.textContent = "Errore durante l'iscrizione, riprova.";
      msgElem.style.color = "red";
    }
  });
}

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

  createNewsletterPopup();
  setTimeout(() => {
    showNewsletterPopup();
  }, 1000);
});
