const autoForm = document.getElementById('auto-form');
const listaAuto = document.getElementById('lista-auto');
const popupNota = document.getElementById('popup-nota');
const popupInfoAuto = document.getElementById('popup-info-auto');
const popupTitoloAzione = document.getElementById('popup-titolo-azione');
const btnSalvaPopup = document.getElementById('btn-salva-popup');

const campoTesto = document.getElementById('manutenzione-testo');
const campoData = document.getElementById('manutenzione-data');
const campoKm = document.getElementById('manutenzione-km');

const vistaGarage = document.getElementById('vista-garage');
const vistaDettaglio = document.getElementById('vista-dettaglio');
const timelineManutenzioni = document.getElementById('timeline-manutenzioni');

let garage = [];
let indiceInModifica = null; 
let indiceAutoAttiva = null; 
let indiceNotaInModifica = null; 

window.toggleNuovoInserimento = function() {
    const contenitoreForm = document.getElementById('form-collassabile');
    const btnToggle = document.getElementById('toggle-form-btn');
    
    contenitoreForm.classList.toggle('aperto');
    
    if (contenitoreForm.classList.contains('aperto')) {
        btnToggle.textContent = "🔼 Chiudi Pannello Inserimento";
        btnToggle.style.backgroundColor = "#7f8c8d";
    } else {
        btnToggle.textContent = "➕ Inserisci Nuova Auto";
        btnToggle.style.backgroundColor = "#34495e";
        
        if(indiceInModifica !== null) {
            indiceInModifica = null;
            autoForm.reset();
            const btnSubmit = document.getElementById('submit-btn');
            btnSubmit.textContent = "Aggiungi Auto";
            btnSubmit.style.backgroundColor = "#2ecc71";
        }
    }
}

function calcolaGiorniRimanenti(dataScadenzaInStringa) {
    if (!dataScadenzaInStringa) return { testo: "Non inserita", classe: "" };

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    
    const dataScadenza = new Date(dataScadenzaInStringa);
    dataScadenza.setHours(0, 0, 0, 0);

    const differenzaTempo = dataScadenza.getTime() - oggi.getTime();
    const giorniRimasti = Math.ceil(differenzaTempo / (1000 * 60 * 60 * 24));

    if (giorniRimasti < 0) {
        return { testo: `SCADUTO da ${Math.abs(giorniRimasti)} gg`, classe: "scaduto-nero" };
    } else if (giorniRimasti === 0) {
        return { testo: "OGGI!", classe: "scaduto-nero" };
    } else if (giorniRimasti <= 7) {
        return { testo: `URGENTE! (${giorniRimasti} gg)`, classe: "urgente-rosso" };
    } else if (giorniRimasti <= 30) {
        return { testo: `In scadenza (${giorniRimasti} gg)`, classe: "attenzione-arancione" };
    } else {
        return { testo: `${giorniRimasti} gg rimasti`, classe: "regolare-verde" };
    }
}

function formattaData(dataInStringa) {
    if (!dataInStringa) return "-";
    const parti = dataInStringa.split("-");
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

function mostraGarage() {
    listaAuto.innerHTML = '';

    if (garage.length === 0) {
        listaAuto.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">Il tuo garage è vuoto. Aggiungi la tua prima auto!</p>';
        return;
    }

    garage.forEach((auto, index) => {
        const infoBollo = calcolaGiorniRimanenti(auto.bollo);
        const infoAssicurazione = calcolaGiorniRimanenti(auto.assicurazione);
        const infoRevisione = calcolaGiorniRimanenti(auto.revisione);

        const card = document.createElement('div');
        card.className = 'auto-card';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <div>
                    <h3 class="auto-link-titolo" onclick="mostraVistaDettaglio(${index})">
                        🚗 ${auto.marca} ${auto.modello} <span style="font-size: 0.85rem; font-weight: normal; opacity: 0.7;">➔</span>
                    </h3>
                    <div style="margin-top: 2px;">
                        <span style="background: #e1b12c; color: white; padding: 2px 6px; font-size: 0.7rem; font-weight: bold; border-radius: 4px; text-transform: uppercase;">${auto.targa}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                    <button type="button" onclick="caricaDatiPerModifica(${index})" style="padding: 4px 8px; background-color: #3498db; color: white; border: none; font-size: 0.75rem; border-radius: 6px; cursor: pointer;">Modifica</button>
                    <button type="button" onclick="eliminaAuto(${index})" style="padding: 4px 8px; background-color: #e74c3c; color: white; border: none; font-size: 0.75rem; border-radius: 6px; cursor: pointer;">Elimina</button>
                </div>
            </div>
            
            <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #eee; padding-top: 8px;">
                <div class="scadenza-riga">
                    <span>💰 <strong>Bollo:</strong> ${formattaData(auto.bollo)}</span>
                    <span class="stato-scadenza ${infoBollo.classe}">${infoBollo.testo}</span>
                </div>
                <div class="scadenza-riga">
                    <span>🛡️ <strong>Assicurazione:</strong> ${formattaData(auto.assicurazione)}</span>
                    <span class="stato-scadenza ${infoAssicurazione.classe}">${infoAssicurazione.testo}</span>
                </div>
                <div class="scadenza-riga">
                    <span>🔧 <strong>Revisione:</strong> ${formattaData(auto.revisione)}</span>
                    <span class="stato-scadenza ${infoRevisione.classe}">${infoRevisione.testo}</span>
                </div>
            </div>
        `;
        
        listaAuto.appendChild(card);
    });
}

window.mostraVistaDettaglio = function(index) {
    indiceAutoAttiva = index;
    const auto = garage[index];
    
    document.getElementById('dettaglio-titolo').textContent = `🚗 ${auto.marca} ${auto.modello}`;
    document.getElementById('dettaglio-targa').textContent = auto.targa;
    
    aggiornaTimelineManutenzioni();
    
    vistaGarage.style.display = 'none';
    vistaDettaglio.style.display = 'block';
    window.scrollTo({ top: 0 });
}

window.mostraVistaGarage = function() {
    indiceAutoAttiva = null;
    vistaDettaglio.style.display = 'none';
    vistaGarage.style.display = 'block';
    mostraGarage();
}

function aggiornaTimelineManutenzioni() {
    timelineManutenzioni.innerHTML = '';
    const auto = garage[indiceAutoAttiva];

    if (!auto.note || auto.note.length === 0) {
        timelineManutenzioni.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 30px 0; font-size: 0.95rem;">Nessun intervento registrato per questa auto.</p>';
        return;
    }

    const noteOrdinate = [...auto.note].map((n, i) => ({...n, indiceOriginale: i}));
    noteOrdinate.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

    noteOrdinate.forEach((nota) => {
        const desc = nota.descrizione || nota;
        const dataFmt = nota.data ? formattaData(nota.data) : 'Data non specificata';
        const kmFmt = nota.km ? `${Number(nota.km).toLocaleString('it-IT')} km` : 'Km non specificati';

        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        item.innerHTML = `
            <div class="timeline-contenuto" onclick="caricaNotaPerModifica(${nota.indiceOriginale})">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <strong style="color: #2c3e50; font-size: 0.95rem;">${desc}</strong>
                    <button type="button" onclick="event.stopPropagation(); eliminaNota(${nota.indiceOriginale})" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 0.85rem; padding: 0 5px; flex-shrink: 0;">✕</button>
                </div>
                <div style="margin-top: 5px; color: #7f8c8d; font-size: 0.8rem; display: flex; gap: 15px;">
                    <span>📅 ${dataFmt}</span>
                    <span>📍 ${kmFmt}</span>
                </div>
            </div>
        `;
        timelineManutenzioni.appendChild(item);
    });
}

window.apriPopupNotaAutomobilistica = function() {
    indiceNotaInModifica = null; 
    
    campoTesto.value = '';
    campoData.value = '';
    campoKm.value = '';
    
    popupTitoloAzione.textContent = "Aggiungi Manutenzione";
    btnSalvaPopup.textContent = "Salva";
    btnSalvaPopup.style.backgroundColor = "#2ecc71";
    
    popupNota.classList.add('attivo');
}

window.caricaNotaPerModifica = function(indexNota) {
    indiceNotaInModifica = indexNota; 
    const auto = garage[indiceAutoAttiva];
    const notaEsistente = auto.note[indexNota];
    
    campoTesto.value = notaEsistente.descrizione || notaEsistente;
    campoData.value = notaEsistente.data || '';
    campoKm.value = notaEsistente.km || '';
    
    popupTitoloAzione.textContent = "Modifica Manutenzione";
    btnSalvaPopup.textContent = "Salva Modifica";
    btnSalvaPopup.style.backgroundColor = "#3498db";
    
    popupNota.classList.add('attivo');
}

window.chiudiPopup = function() {
    popupNota.classList.remove('attivo');
    indiceNotaInModifica = null;
}

window.salvaNota = function() {
    const descrizione = campoTesto.value.trim();
    const data = campoData.value;
    const km = campoKm.value.trim();

    if (descrizione === '') {
        alert("Inserisci il tipo di intervento effettuato!");
        return;
    }

    if (!garage[indiceAutoAttiva].note) {
        garage[indiceAutoAttiva].note = [];
    }

    const nuovaManutenzione = { descrizione, data, km };

    if (indiceNotaInModifica !== null) {
        garage[indiceAutoAttiva].note[indiceNotaInModifica] = nuovaManutenzione;
    } else {
        garage[indiceAutoAttiva].note.push(nuovaManutenzione);
    }
    
    salvaNelTelefono();
    aggiornaTimelineManutenzioni();
    chiudiPopup();
}

window.eliminaNota = function(indexNota) {
    if (confirm("Vuoi eliminare questa manutenzione dal registro?")) {
        garage[indiceAutoAttiva].note.splice(indexNota, 1);
        salvaNelTelefono();
        aggiornaTimelineManutenzioni();
    }
}

window.caricaDatiPerModifica = function(index) {
    const auto = garage[index];
    document.getElementById('marca').value = auto.marca;
    document.getElementById('modello').value = auto.modello;
    document.getElementById('targa').value = auto.targa;
    document.getElementById('scadenzaBollo').value = auto.bollo;
    document.getElementById('scadenzaAssicurazione').value = auto.assicurazione;
    document.getElementById('scadenzaRevisione').value = auto.revisione;

    const btnSubmit = document.getElementById('submit-btn');
    btnSubmit.textContent = "Salva Modifiche";
    btnSubmit.style.backgroundColor = "#3498db";
    indiceInModifica = index;

    const contenitoreForm = document.getElementById('form-collassabile');
    const btnToggle = document.getElementById('toggle-form-btn');
    if (!contenitoreForm.classList.contains('aperto')) {
        contenitoreForm.classList.add('aperto');
        btnToggle.textContent = "🔼 Chiudi Pannello Inserimento";
        btnToggle.style.backgroundColor = "#7f8c8d";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

autoForm.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const marca = document.getElementById('marca').value.trim();
    const modello = document.getElementById('modello').value.trim();
    const targa = document.getElementById('targa').value.trim();
    const bollo = document.getElementById('scadenzaBollo').value;
    const assicurazione = document.getElementById('scadenzaAssicurazione').value;
    const revisione = document.getElementById('scadenzaRevisione').value;

    if (indiceInModifica !== null) {
        const noteEsistenti = garage[indiceInModifica].note || [];
        garage[indiceInModifica] = { marca, modello, targa, bollo, assicurazione, revisione, note: noteEsistenti };
        indiceInModifica = null;
        
        const btnSubmit = document.getElementById('submit-btn');
        btnSubmit.textContent = "Aggiungi Auto";
        btnSubmit.style.backgroundColor = "#2ecc71";
    } else {
        garage.push({ marca, modello, targa, bollo, assicurazione, revisione, note: [] });
    }

    salvaNelTelefono();
    mostraGarage();
    autoForm.reset();
    
    window.toggleNuovoInserimento();
});

window.eliminaAuto = function(index) {
    if (confirm("Sei sicuro di voler eliminare questa auto? Verrà rimosso anche tutto lo storico delle manutenzioni.")) {
        if (indiceInModifica === index) {
            indiceInModifica = null;
            autoForm.reset();
            const btnSubmit = document.getElementById('submit-btn');
            btnSubmit.textContent = "Aggiungi Auto";
            btnSubmit.style.backgroundColor = "#2ecc71";
        }
        garage.splice(index, 1);
        salvaNelTelefono();
        mostraGarage();
    }
}

function salvaNelTelefono() {
    localStorage.setItem('mioGarageDataV3', JSON.stringify(garage));
}

function caricaDalTelefono() {
    const datiSalvati = localStorage.getItem('mioGarageDataV3');
    if (datiSalvati) {
        garage = JSON.parse(datiSalvati);
    }
    mostraGarage();
}

caricaDalTelefono();