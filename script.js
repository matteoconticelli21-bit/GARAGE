let listaAuto = [];
let idAutoCorrente = null;

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
    // Ripristina l'evento onSubmit standard nel caso fosse impostato su modifica
    document.getElementById('form-auto').onsubmit = salvaNuovaAuto;
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

function toggleFormManutenzione() {
    const form = document.getElementById('form-manutenzione');
    const btn = document.getElementById('btn-toggle-manutenzione');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        btn.innerText = '✕ Chiudi';
        btn.classList.add('btn-chiudi');
    } else {
        form.classList.add('hidden');
        btn.innerText = '+ Nuova Manutenzione';
        btn.classList.remove('btn-chiudi');
    }
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

    document.getElementById('form-manutenzione').classList.add('hidden');
    const btnToggle = document.getElementById('btn-toggle-manutenzione');
    btnToggle.innerText = '+ Nuova Manutenzione';
    btnToggle.classList.remove('btn-chiudi');

    const divScadenze = document.getElementById('scadenze-auto-dettaglio');
    divScadenze.innerHTML = `
        <p><strong>Assicurazione:</strong> ${renderMiniScadenzaDettaglio("Stato", auto.assicurazione)} ${auto.assicurazione ? '('+new Date(auto.assicurazione).toLocaleDateString('it-IT')+')' : ''}</p>
        <p><strong>Bollo:</strong> ${renderMiniScadenzaDettaglio("Stato", auto.bollo)} ${auto.bollo ? '('+new Date(auto.bollo).toLocaleDateString('it-IT')+')' : ''}</p>
        <p><strong>Revisione:</strong> ${renderMiniScadenzaDettaglio("Stato", auto.revisione)} ${auto.revisione ? '('+new Date(auto.revisione).toLocaleDateString('it-IT')+')' : ''}</p>
    `;

    renderManutenzioni();
}

// Funzione interna per il dettaglio
function renderMiniScadenzaDettaglio(etichetta, dataStringa) {
    if (!dataStringa) return `<span class="stato-grigio">Non inserita</span>`;
    const info = calcolaGiorniEColoreDettagliato(dataStringa);
    return `<span class="${info.classeColore}">${info.testo}</span>`;
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
        card.className = 'card-auto-estesa';
        
        card.onclick = (e) => {
            if (!e.target.closest('button') && !e.target.closest('.azioni-card')) {
                mostraDettaglioAuto(auto.id);
            }
        };

        const targaHTML = auto.targa ? `<span class="badge-targa">${auto.targa.toUpperCase()}</span>` : '';

        card.innerHTML = `
            <div class="card-auto-header">
                <div class="info-principali">
                    <h3>🚗 ${auto.marca} ${auto.modello} <span class="freccia-dettaglio">→</span></h3>
                    ${targaHTML}
                </div>
                <div class="azioni-card">
                    <button class="btn-modifica-card" onclick="avviaModificaAuto(${auto.id})">Modifica</button>
                    <button class="btn-elimina-card" onclick="eliminaAuto(${auto.id})">Elimina</button>
                </div>
            </div>
            <div class="linea-separatrice"></div>
            <div class="elenco-scadenze-card">
                ${renderRigaScadenza("💰 Bollo", auto.bollo)}
                ${renderRigaScadenza("🛡️ Assicurazione", auto.assicurazione)}
                ${renderRigaScadenza("🔧 Revisione", auto.revisione)}
            </div>
        `;
        contenitore.appendChild(card);
    });
}

function renderRigaScadenza(etichetta, dataStringa) {
    if (!dataStringa) {
        return `
            <div class="riga-scadenza">
                <span class="scadenza-etichetta">${etichetta}: --/--/----</span>
                <span class="scadenza-stato testo-grigio">Non inserita</span>
            </div>
        `;
    }

    const info = calcolaGiorniEColoreDettagliato(dataStringa);
    const dataFormattata = new Date(dataStringa).toLocaleDateString('it-IT');

    return `
        <div class="riga-scadenza">
            <span class="scadenza-etichetta">${etichetta}: <span class="data-scadenza">${dataFormattata}</span></span>
            <span class="scadenza-stato ${info.classeColore}">${info.testo}</span>
        </div>
    `;
}

function calcolaGiorniEColoreDettagliato(dataStringa) {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    const dataScad = new Date(dataStringa);
    dataScad.setHours(0,0,0,0);

    const diffTempo = dataScad - oggi;
    const giorniRimanenti = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    if (giorniRimanenti < 0) {
        return { testo: `SCADUTO da ${Math.abs(giorniRimanenti)} gg`, classeColore: "stato-nero" };
    }
    if (giorniRimanenti === 0) {
        return { testo: "SCADE OGGI!", classeColore: "stato-rosso" };
    }
    if (giorniRimanenti <= 7) {
        return { testo: `URGENTE! (${giorniRimanenti} gg)`, classeColore: "stato-rosso" };
    }
    if (giorniRimanenti <= 30) {
        return { testo: `In scadenza (${giorniRimanenti} gg)`, classeColore: "stato-arancione" };
    }
    return { testo: `Regolare (${giorniRimanenti} gg)`, classeColore: "stato-verde" };
}

function eliminaAuto(id) {
    if (confirm("Sei sicuro di voler eliminare questa vettura e tutto il suo storico?")) {
        listaAuto = listaAuto.filter(a => a.id !== id);
        salvaDati();
        renderListaAuto();
    }
}

function avviaModificaAuto(id) {
    const auto = listaAuto.find(a => a.id === id);
    if (!auto) return;
    
    mostraFormAuto();
    document.getElementById('marcaAuto').value = auto.marca;
    document.getElementById('modelloAuto').value = auto.modello;
    document.getElementById('targaAuto').value = auto.targa || "";
    document.getElementById('scadAssicurazione').value = auto.assicurazione || "";
    document.getElementById('scadBollo').value = auto.bollo || "";
    document.getElementById('scadRevisione').value = auto.revisione || "";
    
    const form = document.getElementById('form-auto');
    form.onsubmit = function(event) {
        event.preventDefault();
        auto.marca = document.getElementById('marcaAuto').value.trim();
        auto.modello = document.getElementById('modelloAuto').value.trim();
        auto.targa = document.getElementById('targaAuto').value.trim();
        auto.assicurazione = document.getElementById('scadAssicurazione').value || "";
        auto.bollo = document.getElementById('scadBollo').value || "";
        auto.revisione = document.getElementById('scadRevisione').value || "";
        
        salvaDati();
        form.onsubmit = salvaNuovaAuto;
        mostraPrincipale();
    };
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

        toggleFormManutenzione();
    }
}

function renderManutenzioni() {
    const contenitore = document.getElementById('lista-manutenzioni');
    const auto = listaAuto.find(a => a.id === idAutoCorrente);
    
    if (!auto.manutenzioni || auto.manutenzioni.length === 0) {
        contenitore.innerHTML = '<p class="vuoto">Nessuna manutenzione registrata.</p>';
        return;
    }

    contenitore.innerHTML = '';
    auto.manutenzioni.forEach(m => {
        const voce = document.createElement('div');
        voce.className = 'voce-manutenzione';
        voce.innerHTML = `
            <div><strong>${m.descrizione}</strong></div>
            <small>Data: ${new Date(m.data).toLocaleDateString('it-IT')} | Chilometri: ${m.km.toLocaleString()} Km</small>
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

                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        registration.showNotification("Scadenza Imminente Garage! 🚗", {
                            body: messaggio,
                            icon: "icon.png",
                            badge: "icon.png",
                            vibrate: [200, 100, 200]
                        });
                    }
                }).catch(err => console.log("Errore invio notifica:", err));
            }
        });
    });
}