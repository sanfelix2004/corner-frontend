// Base URL centralizzata
const BASE_URL = 'http://localhost:8080';

// Nuovi endpoint per promozioni ed eventi
const PROMOTIONS_URL = `${BASE_URL}/api/promotions/attive`;
const EVENTS_URL = `${BASE_URL}/api/events`;
const EVENT_REGISTER_URL = `${BASE_URL}/api/events/register`;

// Endpoint esistenti
const API_URL = `${BASE_URL}/api/menu`;
const EVIDENZA_URL = `${BASE_URL}/api/in_evidenza`;
const RES_API = `${BASE_URL}/api/reservations`;
const RES_TIMES_API = `${RES_API}/available`;

const container = document.getElementById('menuItemsContainer');
const filters = document.getElementById('categoryFilters');

let featuredIds = [];
let allItems = [];L_
// === SEZIONE PROMOZIONI ===
async function loadPromotions() {
  const listContainer = document.getElementById('promoTitlesList');
  const cardsContainer = document.getElementById('promoItemsContainer');
  if (!listContainer || !cardsContainer) return;

  try {
    const response = await fetch(PROMOTIONS_URL);
    if (!response.ok) throw new Error(await response.text());

    const promotions = await response.json();

    if (!promotions || promotions.length === 0) {
      cardsContainer.innerHTML = `<div class="alert alert-info">Nessuna promozione attiva</div>`;
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
    cardsContainer.innerHTML = '<div class="col-12 text-center">Nessun prodotto in promozione</div>';
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
  <div class="card shadow-sm d-inline-block px-4 py-3" style="max-width: 400px; margin: 0 auto;">
    <div class="card-body p-0 text-start">
      <p class="mb-2">
        <strong>Totale senza sconto:</strong>
        <span class="text-muted text-decoration-line-through">€${totaleOriginale.toFixed(2)}</span>
      </p>
      <p class="mb-2">
        <strong>Totale con sconto:</strong>
        <span class="text-success fw-bold">€${totaleScontato.toFixed(2)}</span>
      </p>
      <p class="mb-0">
        <strong>Risparmio:</strong>
        <span class="text-danger">€${(totaleOriginale - totaleScontato).toFixed(2)}</span>
      </p>
    </div>
  </div>
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
  const categoriaSlug = item.categoria.replace(/\s+/g, '-');
  const prezzoOriginale = item.prezzoOriginale || 0;
  const sconto = item.scontoPercentuale || 0;
  const prezzoScontato = item.prezzoScontato || (prezzoOriginale * (1 - sconto / 100));
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

// === POPUP EVENTI AL PRIMO ACCESSO ===
function showEventsPopup(events) {
  if (!events || events.length === 0) return;
  
  const modalHTML = `
    <div class="modal fade" id="eventsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Eventi in programma</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              ${events.map(event => `
                <div class="col-md-6 mb-3">
                  <div class="card h-100">
                    <div class="card-body">
                      <h5 class="card-title">${event.titolo}</h5>
                      <p class="card-text">${event.descrizione}</p>
                      <p class="card-text"><small class="text-muted">
                        ${new Date(event.data).toLocaleString('it-IT', {
                          weekday: 'long', 
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small></p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Inizializza e mostra il modal
  const modal = new bootstrap.Modal(document.getElementById('eventsModal'));
  modal.show();
  
  // Rimuove il modal quando viene chiuso
  document.getElementById('eventsModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
    localStorage.setItem('eventsPopupShown', 'true');
  });
}

async function checkAndShowEvents() {
  // Controlla se il popup è già stato mostrato
  if (localStorage.getItem('eventsPopupShown')) return;
  
  try {
    const res = await fetch(EVENTS_URL);
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
    let url = EVENTS_URL;
    if (selectedDate) {
      url = `${EVENTS_URL}?date=${selectedDate}`;
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
    const card = `
      <div class="col-sm-6 col-lg-4 all ${item.categoria}">
        <div class="box">
          <div class="img-box position-relative">
            <img src="${item.imageUrl}" alt="${item.titolo}" />
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
      fetch(API_URL),
      fetch(EVIDENZA_URL)
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
    if (!timeSelect) return;
    
    timeSelect.innerHTML = `<option value="" disabled selected>Caricamento…</option>`;
    if (window.$ && $.fn.niceSelect) {
      $('select').niceSelect('update');
    }

    try {
      // Carica gli orari disponibili
      const [slotsRes, eventsRes] = await Promise.all([
        fetch(`${RES_TIMES_API}/${dateInput.value}`),
        fetch(`${EVENTS_URL}?date=${dateInput.value}`)
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

    try {
      const res = await fetch(RES_API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (res.status === 201 || res.ok) {
        const dto = await res.json();
        msgBox.innerHTML = `<span class="text-success">
          Prenotazione confermata per il ${dto.date} alle ${dto.time}.
        </span>`;
        
        // Registrazione evento se selezionato
        const eventId = document.getElementById('eventSelect')?.value;
        if (eventId) {
          await registerForEvent(eventId, payload.name, payload.phone);
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
        msgBox.innerHTML = `<span class="text-danger">
          Errore: ${err.message || res.statusText}
        </span>`;
      }
    } catch (err) {
      msgBox.innerHTML = `<span class="text-danger">
        Impossibile contattare il server.
      </span>`;
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
      const res = await fetch(`${RES_API}/${encodeURIComponent(phone)}`);
      if (!res.ok) throw new Error(res.statusText);
      const list = await res.json();

      if (list.length === 0) {
        reservationsList.innerHTML = `
          <li class="list-group-item">
            Nessuna prenotazione trovata per <strong>${phone}</strong>.
          </li>`;
      } else {
        list.forEach(r => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `
            <div>
              <strong>${r.date} @ ${r.time}</strong><br>
              Persone: ${r.people}<br>
              Note: ${r.note || '-'}
            </div>
            <button
              class="btn btn-sm btn-danger cancel-btn"
              data-phone="${r.phone}"
              data-date="${r.date}"
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

    if (!confirm(`Vuoi veramente annullare la prenotazione del ${date}?`)) return;

    try {
      const res = await fetch(`${RES_API}/${encodeURIComponent(phone)}/${encodeURIComponent(date)}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error(res.statusText);
      btn.closest('li').remove();
    } catch (err) {
      alert('Errore nell\'annullamento della prenotazione.');
      console.error(err);
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

// Inizializzazione generale
document.addEventListener('DOMContentLoaded', () => {
  // Anno corrente nel footer
  getYear();
  
  // Data minima per prenotazioni (oggi)
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
  
  // Caricamento promozioni
  loadPromotions();
  
  // Caricamento menu
  loadMenu();
  
  // Popup eventi al primo accesso
  checkAndShowEvents();
  
  // Caricamento eventi per registrazione
  loadEventsForRegistration();


});
