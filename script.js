let listaAuto = [];
let idAutoCorrente = null;

// Richiesta permessi notifiche
if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("Notifiche abilitate.");
        }
    });
}

window.onload = function() {
    caricaDati();
    inizializzaTema();
    controllaScadenzePerNotifiche();
};

function caricaDati() {
    const datiSalvati = localStorage.getItem('automobili');
    if (datiSalvati) {
        listaAuto = JSON.parse(datiSalvati);
    }
    renderListaAuto();
}

function salvaDati() {
    localStorage.setItem('automobili', JSON.stringify(listaAuto));
}

// --- GESTIONE TEMA ---
function inizializzaTema() {
    const temaSalvato = localStorage.getItem('tema-selezionato') || 'auto';
    const selectTema = document.getElementById('select-tema');
    if (selectTema) selectTema.value = temaSalvato;
    applicatema(temaSalvato);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('tema-selezionato') === 'auto' || !localStorage.getItem('tema-selezionato')) {
            applicatema('auto');
        }
    });
}

function cambiaTema(valore) {
    localStorage.setItem('tema-selezionato', valore);
    applicatema(valore);
}

function applicatema(tema) {
    document.documentElement.removeAttribute('data-theme');
    
    if (tema === 'chiaro') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (tema === 'scuro') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        const preferisceScuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (preferisceScuro) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

// --- NAVIGAZIONE SCHERMATE ---
function mostraFormAuto() {
    nascondiTutteLeSchermate();
    document.getElementById('schermata-form-auto').classList.remove('hidden');
    document.getElementById('form-auto').reset();
}

function mostraImpostazioni() {
    nascondiTutteLeSchermate();
    document.getElementById('schermata-impostazioni').classList.remove('hidden');
}

function mostraPrincipale() {
    nascondiTutteLeSchermate();
    document.getElementById('schermata-principale').classList.remove('hidden');
    renderListaAuto();
}

function mostraDettaglioAuto(id) {
    idAutoCorrente = id;
    const auto = listaAuto.find(a => a.id === id);
    if (!auto) return;

    nascondiTutteLeSchermate();
    document.getElementById('schermata-dettaglio').classList.remove('hidden');
    
    const intestazioneAuto = auto.targa ? `${auto.marca} ${auto.modello} (${auto.targa})` : `${auto.marca} ${auto.modello}`;
    document.getElementById('dettaglio-titolo-auto').innerText = intestazioneAuto;

    const testoNota = document.getElementById('testo-nota-visualizzato');
    testoNota.innerText = auto.notaGenerica ? auto.notaGenerica : "Nessuna nota inserita.";
    document.getElementById('area-modifica-nota').classList.add('hidden');
    document.getElementById('btn-modifica-nota').classList.remove('hidden');

    const divScadenze = document.getElementById('scadenze-auto-dettaglio');
    divScadenze.innerHTML = `
        <p><strong>Assicurazione:</strong> ${renderMiniScadenza("Stato", auto.assicurazione)} ${auto.assicurazione ? '('+auto.assicurazione+')' : ''}</p>
        <p><strong>Bollo:</strong> ${renderMiniScadenza("Stato", auto.bollo)} ${auto.bollo ? '('+auto.bollo+')' : ''}</p>
        <p><strong>Revisione:</strong> ${renderMiniScadenza("Stato", auto.revisione)} ${auto.revisione ? '('+auto.revisione+')' : ''}</p>
    `;

    renderManutenzioni();
}

function nascondiTutteLeSchermate() {
    document.getElementById('schermata-principale').classList.add('hidden');
    document.getElementById('schermata-form-auto').classList.add('hidden');
    document.getElementById('schermata-dettaglio').classList.add('hidden');
    document.getElementById('schermata-impostazioni').classList.add('hidden');
}

// --- LOGICA APPLICAZIONE ---
function renderListaAuto() {
    const contenitore = document.getElementById('lista-auto');
    if (listaAuto.length === 0) {
        contenitore.innerHTML = '<p class="vuoto">Il tuo garage è vuoto. Aggiungi la tua prima auto!</p>';
        return;
    }

    contenitore.innerHTML = '';
    listaAuto.forEach(auto => {
        const card = document.createElement('div');
        card.className = 'card-auto';
        card.onclick = () => mostraDettaglioAuto(auto.id);

        const intestazioneAuto = auto.targa ? `${auto.marca} ${auto.modello} (${auto.targa})` : `${auto.marca} ${auto.modello}`;

        card.innerHTML = `
            <h3>${intestazioneAuto}</h3>
            <div class="mini-scadenze">
                ${renderMiniScadenza("Assicurazione", auto.assicurazione)}
                ${renderMiniScadenza("Bollo", auto.bollo)}
                ${renderMiniScadenza("Revisione", auto.revisione)}
            </div>
        `;
        contenitore.appendChild(card);
    });
}

function renderMiniScadenza(etichetta, dataStringa) {
    if (!dataStringa) return `<span class="badge grigio">${etichetta}: -</span>`;
    const info = calcolaGiorniEColore(dataStringa);
    return `<span class="badge ${info.colore}">${etichetta}: ${info.testo}</span>`;
}

function calcolaGiorniEColore(dataStringa) {
    if (!dataStringa) return { testo: "Non inserita", colore: "grigio" };

    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    const dataScad = new Date(dataStringa);
    dataScad.setHours(0,0,0,0);

    const diffTempo = dataScad - oggi;
    const giorniRimanenti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    if (giorniRimanenti < 0) return { testo: `Scaduta (${giorniRimanenti} gg)`, colore: "nero" };
    if (giorniRimanenti === 0) return { testo: "Scade Oggi!", colore: "rosso" };
    if (giorniRimanenti <= 7) return { testo: `${giorniRimanenti} gg`, colore: "rosso" };
    if (giorniRimanenti <= 30) return { testo: `${giorniRimanenti} gg`, colore: "arancione" };
    return { testo: `${giorniRimanenti} gg`, colore: "verde" };
}

function salvaNuovaAuto(event) {
    event.preventDefault();
    const marca = document.getElementById('marcaAuto').value.trim();
    const modello = document.getElementById('modelloAuto').value.trim();
    const targa = document.getElementById('targaAuto').value.trim();
    
    if (!marca || !modello) return;

    const nuovaAuto = {
        id: Date.now(),
        marca: marca,
        modello: modello,
        targa: targa,
        nome: `${marca} ${modello}`.trim(),
        assicurazione: document.getElementById('scadAssicurazione').value || "",
        bollo: document.getElementById('scadBollo').value || "",
        revisione: document.getElementById('scadRevisione').value || "",
        notaGenerica: "",
        manutenzioni: []
    };

    listaAuto.push(nuovaAuto);
    salvaDati();
    controllaScadenzePerNotifiche();
    mostraPrincipale();
}

function mostraAreaNota() {
    const auto = listaAuto.find(a => a.id === idAutoCorrente);
    document.getElementById('input-nota-generica').value = auto.notaGenerica || "";
    document.getElementById('area-modifica-nota').classList.remove('hidden');
    document.getElementById('btn-modifica-nota').classList.add('hidden');
}

function salvaNotaGenerica() {
    const testo = document.getElementById('input-nota-generica').value.trim();
    const auto = listaAuto.find(a => a.id === idAutoCorrente);
    if (auto) {
        auto.notaGenerica = testo;
        salvaDati();
        document.getElementById('testo-nota-visualizzato').innerText = testo ? testo : "Nessuna nota inserita.";
        document.getElementById('area-modifica-nota').classList.add('hidden');
        document.getElementById('btn-modifica-nota').classList.remove('hidden');
    }
}

function aggiungiManutenzione() {
    const desc = document.getElementById('manutenzione-desc').value.trim();
    const data = document.getElementById('manutenzione-data').value;
    const km = document.getElementById('manutenzione-km').value;

    if (!desc || !data || !km) {
        alert("Compila tutti i campi richiesti per la manutenzione!");
        return;
    }

    const auto = listaAuto.find(a => a.id === idAutoCorrente);
    if (auto) {
        auto.manutenzioni.push({
            descrizione: desc,
            data: data,
            km: parseInt(km)
        });

        auto.manutenzioni.sort((a, b) => new Date(b.data) - new Date(a.data));

        salvaDati();
        renderManutenzioni();

        document.getElementById('manutenzione-desc').value = '';
        document.getElementById('manutenzione-data').value = '';
        document.getElementById('manutenzione-km').value = '';
    }
}

function renderManutenzioni() {
    const contenitore = document.getElementById('lista-manutenzioni');
    const auto = listaAuto.find(a => a.id === idAutoCorrente);
    
    if (!auto.manutenzioni || auto.manutenzioni.length === 0) {
        contenitore.innerHTML = '<p class="vuoto">Nessun intervento registrato.</p>';
        return;
    }

    contenitore.innerHTML = '';
    auto.manutenzioni.forEach(m => {
        const voce = document.createElement('div');
        voce.className = 'voce-manutenzione';
        voce.innerHTML = `
            <div><strong>${m.descrizione}</strong></div>
            <small>Data: ${m.data} | Chilometri: ${m.km.toLocaleString()} Km</small>
        `;
        contenitore.appendChild(voce);
    });
}

function controllaScadenzePerNotifiche() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator)) return;

    listaAuto.forEach(auto => {
        const identificativoAuto = auto.targa ? `${auto.marca} ${auto.modello} (${auto.targa})` : `${auto.marca} ${auto.modello}`;
        const scadenze = [
            { tipo: "Assicurazione", data: auto.assicurazione },
            { tipo: "Bollo", data: auto.bollo },
            { tipo: "Revisione", data: auto.revisione }
        ];

        scadenze.forEach(s => {
            if (!s.data) return;

            const oggi = new Date();
            oggi.setHours(0,0,0,0);
            const dataScad = new Date(s.data);
            dataScad.setHours(0,0,0,0);

            const diffTempo = dataScad - oggi;
            const giorniRimanenti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

            if (giorniRimanenti === 30 || giorniRimanenti === 7 || giorniRimanenti === 0) {
                let messaggio = "";
                if (giorniRimanenti === 0) {
                    messaggio = `Oggi scade il termine per la gestione di: ${s.tipo} (${identificativoAuto}).`;
                } else {
                    messaggio = `Mancano ${giorniRimanenti} giorni alla scadenza della tua voce: ${s.tipo} (${identificativoAuto}).`;
                }

                // Controllo di sicurezza: verifichiamo che il service worker sia attivo e pronto prima di inviare
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        registration.showNotification("Scadenza Imminente Garage! 🚗", {
                            body: messaggio,
                            icon: "icon.png",
                            badge: "icon.png",
                            vibrate: [200, 100, 200]
                        });
                    }
                }).catch(err => console.log("Notifica asincrona non inviata: ambiente offline o locale non supportato."));
            }
        });
    });
}