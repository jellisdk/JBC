// ------------------ Instellingen ------------------

// Toegangscodes
const userCode = "1234";       // algemene toegang werknemers
const managerCode = "4321";    // manager dashboard

// Datum + maand globale variabelen
let huidigeMaand = new Date().getMonth();
let huidigJaar = new Date().getFullYear();

// Werknemers, locaties, types
let werknemers = JSON.parse(localStorage.getItem("werknemers")) || ["Jellis","Haldir","Rani","Ella","Amber"];
let locaties = JSON.parse(localStorage.getItem("locaties")) || {};
let types = JSON.parse(localStorage.getItem("types")) || {};

// Initialize localStorage indien leeg
localStorage.setItem("werknemers", JSON.stringify(werknemers));
localStorage.setItem("locaties", JSON.stringify(locaties));
localStorage.setItem("types", JSON.stringify(types));

// ------------------ Algemeen toegang ------------------
document.addEventListener("DOMContentLoaded", () => {
    if(localStorage.getItem("userAccess") === "true"){
        const accessBox = document.getElementById("accessBox");
        if(accessBox) accessBox.style.display = "none";
        const mainContent = document.getElementById("mainContent");
        if(mainContent) {
            mainContent.style.display = "block";
            renderHoofdPagina();
        }
    }
});

function checkUserAccess() {
    const code = document.getElementById("userCodeInput").value.trim();
    if(code === userCode){
        localStorage.setItem("userAccess", "true");
        document.getElementById("accessBox").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
        renderHoofdPagina();
    } else {
        alert("Verkeerde code!");
        document.getElementById("userCodeInput").value = "";
    }
}

function checkManagerAccess() {
    const code = document.getElementById("managerCodeInput").value.trim();
    if(code === managerCode){
        window.location.href = "dashboard.html";
    } else {
        alert("Verkeerde code!");
        document.getElementById("managerCodeInput").value = "";
    }
}

// ------------------ Hoofdpagina renderen ------------------
function renderHoofdPagina(){
    const container = document.getElementById("werknemersContainer");
    if(!container) return;
    container.innerHTML = "";
    const filterLoc = document.getElementById("filterLocatie")?.value || "alles";
    const filterType = document.getElementById("filterType")?.value || "alles";

    werknemers.forEach(n => {
        const wLoc = locaties[n] || ["Onbekend"];
        const wType = types[n] || "Onbekend";
        if(filterLoc !== "alles" && !wLoc.includes(filterLoc) && !wLoc.includes("beide")) return;
        if(filterType !== "alles" && wType !== filterType) return;

        const a = document.createElement("a");
        a.className = "kaart"; a.id = n; a.innerText = n;
        a.href = "persoon.html?naam=" + encodeURIComponent(n);

        let status = JSON.parse(localStorage.getItem(n)) || [];
        if(status.some(d => d.type === "rood")) a.classList.add("rood");
        container.appendChild(a);
    });
}

// ------------------ Persoon pagina functies ------------------
function genereerKalender(){
    const kalender = document.getElementById("kalender");
    if(!kalender) return;
    kalender.innerHTML = "";
    const params = new URLSearchParams(window.location.search);
    const naam = params.get("naam");
    const dagenInMaand = new Date(huidigJaar,huidigeMaand+1,0).getDate();
    let opgeslagen = JSON.parse(localStorage.getItem(naam)) || [];

    for(let i=1;i<=dagenInMaand;i++){
        const dag = document.createElement("div");
        dag.className = "dag"; dag.innerText = i;
        const datum = `${huidigJaar}-${String(huidigeMaand+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;

        let dagStatus = opgeslagen.find(d => d.datum === datum);
        let type = dagStatus ? dagStatus.type : "groen";
        dag.classList.add(type);

        dag.onclick = function(){
            let nieuwType;
            switch(type){
                case "groen": nieuwType="geel"; break;
                case "geel": nieuwType="rood"; break;
                case "rood": nieuwType="groen"; break;
            }

            opgeslagen = opgeslagen.filter(d => d.datum !== datum);
            opgeslagen.push({datum: datum,type: nieuwType});
            localStorage.setItem(naam,JSON.stringify(opgeslagen));

            if(nieuwType==="rood") localStorage.setItem(naam+"_status","rood");
            else if(opgeslagen.filter(d=>d.type==="rood").length===0) localStorage.removeItem(naam+"_status");

            genereerKalender();
        }

        kalender.appendChild(dag);
    }
}

function resetPlanning(){
    const params = new URLSearchParams(window.location.search);
    const naam = params.get("naam");
    if(!naam) return;
    if(confirm("Alles verwijderen?")){
        localStorage.removeItem(naam);
        localStorage.removeItem(naam+"_status");
        genereerKalender();
    }
}

// ------------------ Dashboard functies ------------------
function updateDashboard(){
    const lijst = document.getElementById("werknemersLijst");
    lijst.innerHTML = "";

    // Sorteer op positie: Manager > Vaste > Flexi > Student
    const positieRang = { "Manager": 1, "Vaste": 2, "Flexi": 3, "Student": 4 };
    const gesorteerd = [...werknemers].sort((a,b) => {
        let pa = positieRang[types[a]] || 5;
        let pb = positieRang[types[b]] || 5;
        if(pa!==pb) return pa-pb;
        return a.localeCompare(b); // alfabetisch als gelijk
    });

    gesorteerd.forEach(n => {
        const wLoc = locaties[n] || ["Onbekend"];
        const wType = types[n] || "Onbekend";
        const li = document.createElement("li");
        li.innerText = n+" ("+wLoc.join(", ")+", "+wType+") ";

        const btn = document.createElement("button");
        btn.innerText = "Verwijder";
        btn.onclick = () => {
            if(confirm("Verwijder "+n+"?")){
                werknemers = werknemers.filter(w => w !== n);
                delete locaties[n]; delete types[n];
                localStorage.removeItem(n);
                localStorage.removeItem(n+"_status");
                localStorage.setItem("werknemers", JSON.stringify(werknemers));
                localStorage.setItem("locaties", JSON.stringify(locaties));
                localStorage.setItem("types", JSON.stringify(types));
                updateDashboard(); renderHoofdPagina();
            }
        }
        li.appendChild(btn);

        const selLoc = document.createElement("select");
        ["Wetteren","Aalst","beide"].forEach(opt=>{
            const o=document.createElement("option"); o.value=opt; o.text=opt;
            if(wLoc.includes(opt) || (opt==="beide" && wLoc.includes("Wetteren") && wLoc.includes("Aalst"))) o.selected=true;
            selLoc.appendChild(o);
        });
        selLoc.onchange=function(){
            let val=selLoc.value;
            locaties[n]= val==="beide"?["Wetteren","Aalst"]:[val];
            localStorage.setItem("locaties", JSON.stringify(locaties));
            renderHoofdPagina(); updateDashboard();
        }
        li.appendChild(selLoc);

        const selType=document.createElement("select");
        ["Manager","Vaste","Flexi","Student"].forEach(opt=>{
            const o=document.createElement("option"); o.value=opt; o.text=opt;
            if(opt===wType) o.selected=true;
            selType.appendChild(o);
        });
        selType.onchange=function(){
            types[n]=selType.value;
            localStorage.setItem("types", JSON.stringify(types));
            updateDashboard(); renderHoofdPagina();
        }
        li.appendChild(selType);

        lijst.appendChild(li);
    });
}

// ------------------ Voeg werknemer ------------------
function voegWerknemerToe(){
    const naam = document.getElementById("nieuweNaam").value.trim();
    if(!naam){ alert("Naam invullen"); return; }
    if(werknemers.includes(naam)){ alert("Bestaat al"); return; }

    let winkel = document.getElementById("winkelSelect").value;
    let type = document.getElementById("typeSelect").value;
    let locArray = winkel==="beide"?["Wetteren","Aalst"]:[winkel];

    werknemers.push(naam);
    locaties[naam] = locArray;
    types[naam] = type;

    localStorage.setItem("werknemers", JSON.stringify(werknemers));
    localStorage.setItem("locaties", JSON.stringify(locaties));
    localStorage.setItem("types", JSON.stringify(types));

    alert("Toegevoegd!"); 
    document.getElementById("nieuweNaam").value = "";
    updateDashboard(); renderHoofdPagina();
}

// ------------------ Dag-overzicht per manager ------------------
function renderDagOverzicht(){
    const dag = document.getElementById("filterDag").value;
    const loc = document.getElementById("filterLocDag").value;
    const ul = document.getElementById("dagOverzicht");
    ul.innerHTML="";

    if(!dag) return;
    werknemers.forEach(n=>{
        const wLoc = locaties[n] || ["Onbekend"];
        if(loc!=="alles" && !wLoc.includes(loc) && !wLoc.includes("beide")) return;

        const opgeslagen = JSON.parse(localStorage.getItem(n)) || [];
        let statusObj = opgeslagen.find(d => d.datum === dag);
        let type = statusObj ? statusObj.type : "groen";

        const li = document.createElement("li");
        li.innerText = n;
        li.classList.add(type);
        ul.appendChild(li);
    });
}