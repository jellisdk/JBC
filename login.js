// login.js

// Toegangscodes
const generalCode = "1234";   // Algemene gebruiker
const managerCode = "4321";   // Manager

function checkAccess() {
    const code = document.getElementById("codeInput").value.trim();

    if(code === generalCode){
        sessionStorage.setItem("role","user");
        window.location.href = "index.html";  // Gebruikerspagina
    }
    else if(code === managerCode){
        sessionStorage.setItem("role","manager");
        window.location.href = "dashboard.html"; // Managerportaal
    }
    else{
        alert("Verkeerde code! Probeer opnieuw.");
        document.getElementById("codeInput").value = "";
    }
}