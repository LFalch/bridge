/*
Skriv denne kommando i terminalen:
node bridge.js
*/

let myRec;
let words;
let igenKnap;
let sentence = "";

// input til atsende beskeder til Unity
let textInput;

let unityHostInputField;

let connectedStatus = 0;

let resultPre;
let connectButton;

let containerSection;

let socket;

//Alle slidere gemmes i et array, så de senere kan manipuleres samlet
let listeningSliders = [];
let lightIntensitySlider;

//Slidere til lysets retning oprettes som objekter
let lightDirectionSliders = {};
let lockSlider;

//Vi sætter alle konfigurationsoplysninger i et array 
//Node serveren lytter (fx på beskeder fra wekinator) på port 11000
const bridgeConfig = {
    local: {
        port: 11000,
        host: '127.0.0.1'
    },
    remotes: {
        unity: {
            name: "unity",
            port: 12000,
            host: '10.138.100.239'
        },
        arduino: {
            name: "arduino",
            port: 10330,
            host: '192.168.8.105'
        }
    }
};

function setup() {
    igenKnap = createElement('button', 'Prøv igen');
    igenKnap.addClass("hidden");
    igenKnap.mousePressed(doItAgain);


    words = createElement('div', "<h2>Sig noget</h2>");
    words.addClass("words");
    words.attribute('id', 'words');

    myRec = new p5.SpeechRec("da");
    myRec.interimResults = true;
    myRec.continuous = true;
    myRec.onResult = showResult;
    myRec.start();

    setupOsc(); //Begynd at lytte efter OSC

    containerSection = createElement("section", "").addClass("container");

    createElement("h3", "Unity netværksadresse")
        .parent(containerSection);

    const unityConfig = bridgeConfig.remotes.unity;
    unityHostInputField = createElement("p", unityConfig.host + ":" + unityConfig.port)
        .parent(containerSection);

    // Arudino adresse

    createElement("h3", "Arudino netværksadresse")
        .parent(containerSection);

    const arduinoConfig = bridgeConfig.remotes.arduino;
    unityHostInputField = createElement("p", arduinoConfig.host + ":" + arduinoConfig.port)
        .parent(containerSection);
}

function showResult() {
    sentence = myRec.resultString;
    sendOsc("/text", sentence);
    console.log(sentence);
    console.log(myRec);

    if (myRec.resultValue == true) {
        words.html("<p>" + sentence + "</p>", true);
        igenKnap.addClass("shown");
    }
}

function doItAgain() {
    location.reload();
}

// Nedenstående er OSC funktioner. 

function receiveOsc(address, value) {
    if (address.split('/')[1] === "wek") {
        // besked fra Wekinator
    }

    resultPre.html(address + "   " + value + '\n' + resultPre.html());

    //Her løber vi alle slidere igennem
    listeningSliders.map(s => {
        //Hvis adressen svarer til sliderens adresse (fx wek/outputs)
        if (address === s.address) {
            //Hvis der er en værdi i value arrayet
            if (value[s.index]) {

                if(s.parseValue){
                    value[s.index] = s.parseValue(value[s.index]);
                }

                //let sliderValue = map(value[s.index], 0.0, 1.0, s.slider.elt.min, s.slider.elt.max);
                let sliderValue = map(value[s.index], 0.0, 1.0, -18000, 18000);
                console.log("slider " + s.index + " got value", value[s.index] + " map returns " + sliderValue);
                s.slider.elt.value = sliderValue;
                var event = new Event('input', {
                    'bubbles': true,
                    'cancelable': true
                });

                s.slider.elt.dispatchEvent(event);

            }
        }
    });

}

function logOscInput(string) {
    resultPre.html(address + "   " + value + '\n' + resultPre.html());
}

function sendOsc(address, value) {
    socket.emit('message', [address].concat(value));
}

function setupOsc() {
    socket = io.connect('http://127.0.0.1:8081', {
        port: 8081,
        rememberTransport: false
    });
    socket.on('connect', function () {
        socket.emit('config', bridgeConfig);
    });
    socket.on('connected', function (msg) {
        connectedStatus = msg;
        console.log("socket says we're conncted to osc", msg);
    });
    socket.on('message', function (msg) {
        console.log("client socket got", msg);
        if (msg[0] == '#bundle') {
            for (var i = 2; i < msg.length; i++) {
                receiveOsc(msg[i][0], msg[i].splice(1));
            }
        } else {
            receiveOsc(msg[0], msg.splice(1));
        }
    });
}
