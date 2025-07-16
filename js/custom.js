// === INIZIO BLOCCO PER IL MENU DINAMICO ===
const API_URL       = 'http://localhost:8080/api/menu';
const EVIDENZA_URL  = 'http://localhost:8080/api/in_evidenza';
const container = document.getElementById('menuItemsContainer');
const filters   = document.getElementById('categoryFilters');
let featuredIds     = [];
let allItems = [];

function renderFilters(categories) {
  filters.innerHTML = '';

  // se ho featuredIds, metto prima In Evidenza
  if (featuredIds.length > 0) {
    const li = document.createElement('li');
    li.setAttribute('data-filter', 'In Evidenza');
    li.innerText = 'In Evidenza';
    filters.appendChild(li);
  }

  // poi tutte le altre categorie
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.setAttribute('data-filter', cat);
    li.innerText = cat;
    filters.appendChild(li);
  });

  // click handler identico
  filters.querySelectorAll('li').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      btn.classList.add('active');
      renderMenuItems(btn.getAttribute('data-filter'));
    });
  });
}

function renderMenuItems(filter = 'In Evidenza') {
  container.innerHTML = '';
  let toShow;

  if (filter === 'In Evidenza') {
    // mostro solo gli item il cui id è in featuredIds
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
    // parallel fetch di menu e highlights
    const [menuRes, evRes] = await Promise.all([
      fetch(API_URL),
      fetch(EVIDENZA_URL)
    ]);
    const [menuData, highlights] = await Promise.all([
      menuRes.json(),
      evRes.json()
    ]);

    allItems    = menuData;
    featuredIds = highlights.map(h => h.itemId);

    // estraiamo le categorie uniche
    const cats = [...new Set(menuData.map(i => i.categoria))];
    renderFilters(cats);

    // avvia subito con “In Evidenza” se ce n’è almeno uno
    const defaultBtn = filters.querySelector('[data-filter="In Evidenza"]');
    if (defaultBtn) {
      defaultBtn.classList.add('active');
      renderMenuItems('In Evidenza');
    }
  } catch (err) {
    container.innerHTML = '<p>Errore nel caricamento del menu.</p>';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadMenu);
// === FINE BLOCCO PER IL MENU DINAMICO ===
// custom.js

// 1) Footer: anno corrente
function getYear() {
  document.querySelector("#displayYear").innerText = new Date().getFullYear();
}
getYear();

// ——————————————————————————————
// Caricamento orari disponibili dal BE
// ——————————————————————————————
const RES_API        = 'http://localhost:8080/api/reservations';
const RES_TIMES_API  = RES_API + '/available-times';  // ?date=YYYY-MM-DD

const form        = document.getElementById('reservationForm');
const dateInput   = document.getElementById('resDate');
const timeSelect  = document.getElementById('resTime');
const msgBox      = document.getElementById('resMessage');

// Appena scelgo una data, chiedo al BE gli orari liberi
dateInput.addEventListener('change', async () => {
  timeSelect.innerHTML = `<option value="" disabled selected>Caricamento…</option>`;
  $('select').niceSelect('update');

  try {
    const res = await fetch(`${RES_TIMES_API}?date=${dateInput.value}`);
    if (!res.ok) throw new Error(res.statusText);
    const slots = await res.json();  // es: ["20:00","20:30",...]

    // ricompongo il select
    timeSelect.innerHTML = `<option value="" disabled selected>Seleziona ora</option>`;
    slots.forEach(t => {
      const o = document.createElement('option');
      o.value = t;
      o.innerText = t;
      timeSelect.appendChild(o);
    });
  } catch (err) {
    timeSelect.innerHTML = `<option value="" disabled>Errore nel caricamento</option>`;
    console.error(err);
  }
  $('select').niceSelect('update');
});

// ——————————————————————————————
// Submit prenotazione
// ——————————————————————————————
form.addEventListener('submit', async e => {
  e.preventDefault();
  msgBox.textContent = '';

  const payload = {
    name:   document.getElementById('resName').value.trim(),
    phone:  document.getElementById('resPhone').value.trim(),
    date:   dateInput.value,
    time:   timeSelect.value,
    people: parseInt(document.getElementById('resPeople').value, 10),
    note:   document.getElementById('resNote').value.trim()
  };

  try {
    const res = await fetch(RES_API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if (res.status === 201 || res.ok) {
      const dto = await res.json();
      msgBox.innerHTML = `<span class="text-success">
        Prenotazione confermata per il ${dto.date} alle ${dto.time}.
      </span>`;
      form.reset();
      timeSelect.innerHTML = `<option value="" disabled selected>Seleziona ora</option>`;
      $('select').niceSelect('update');
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
// ——————————————————————————————
// Le mie Prenotazioni
// ——————————————————————————————
const lookupForm       = document.getElementById('lookupForm');
const lookupPhoneInput = document.getElementById('lookupPhone');
const reservationsList = document.getElementById('reservationsList');

lookupForm.addEventListener('submit', async e => {
  e.preventDefault();
  reservationsList.innerHTML = '';

  const phone = lookupPhoneInput.value.trim();
  if (!phone) return;

  try {
    const res = await fetch(`${RES_API}/by-phone/${encodeURIComponent(phone)}`);
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
// gestione click su “Annulla”
reservationsList.addEventListener('click', async e => {
  if (!e.target.classList.contains('cancel-btn')) return;

  const btn   = e.target;
  const date  = btn.dataset.date;
  const phone = btn.dataset.phone;

  if (!confirm(`Vuoi veramente annullare la prenotazione del ${date}?`)) return;

  try {
    const url = `${RES_API}/delete?phone=${encodeURIComponent(phone)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(res.statusText);
    // rimuovo la riga
    btn.closest('li').remove();
  } catch (err) {
    alert('Errore nell\'annullamento della prenotazione.');
    console.error(err);
  }
});
// scroll liscio per tutti i link interni
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))
            .scrollIntoView({ behavior: 'smooth' });
  });
});
function myMap() {
  const coords = { lat: 41.1250, lng: 16.7819 }; // Piazza Duomo, Giovinazzo
  const map = new google.maps.Map(document.getElementById("googleMap"), {
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

  const infoWindow = new google.maps.InfoWindow({
    content: infoContent
  });

  // apri automaticamente l’InfoWindow al caricamento
  infoWindow.open(map, marker);

  // e aprilo al click sul marker
  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });
}
function showToast(message, isError = false) {
  const toast = document.getElementById('customToast');
  toast.textContent = message;
  toast.style.backgroundColor = isError ? '#dc3545' : '#28a745'; // rosso o verde
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('resDate');
  const today = new Date().toISOString().split('T')[0]; // formato yyyy-mm-dd
  dateInput.setAttribute('min', today);
});
