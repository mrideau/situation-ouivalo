window.addEventListener("load", function() {
    const retour = document.querySelector('retour');

function callApi() {
    const xmlhttp = new XMLHttpRequest();
    const formData = new FormData(form)

    formData.append('message', 'message');

    xmlhttp.onload = function() {
        console.log(this.responseText);
        retour.innerHTML = this.responseText;
    }

    xmlhttp.open('POST', 'https://script.google.com/macros/s/AKfycby-TJmFFUFTfiNUbMoSIZx8LVtiskQ-bUt4xO6hmrU0XQpJS8IPUBow/exec', true);

    xmlhttp.send(JSON.stringify({
        "cle": "CLE-TEST-IOT",
        "donnees": {
            "date": Date.now().toString(),
            "message": 'message'
        }
    }));
}
});