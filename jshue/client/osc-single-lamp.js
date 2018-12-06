/*
Lad os prøve at lave et program som modtager to variable til at styre lysstyrke og temperatur med osc variablene lys og varme

BEMÆRK for at et javascript kan modtage OSC skal det køre filen bridge.js med node. Find din terminal og find mappen som projektet ligger i. Her ligger der en fil ved navn bridge.js 

Skriv denne kommando i terminalen:

node bridge.js
*/
var lys = 0;
var varme = 0;

// Bridge ip-adresse. Find den fx i hue app'en
var url = '10.0.1.2';
// Fælles brugernavn
var username = 'C2fr-2XtwFq3Z7G3Xk4XftfEq48pY0oxXaYMJcU4';
//Slidere
var dimmer, temper;
//Den pære du vil kontrollere
var lightNumber = 4;
//Den osc besked du vil modtage
var osc_address = "/wek/outputs";

function setup() {
    createCanvas(500, 500);
    setupOsc(12000, 6448); //Begynd at lytte efter OSC

    oscDiv = createDiv('OSC response'); // a div for the Hue hub's responses
    oscDiv.position(10, 140); // position it

    resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
    resultDiv.position(10, 200); // position it

    dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
    dimmer.position(10, 10); // position it
    dimmer.mouseReleased(changeBrightness); // mouseReleased callback function

    temper = createSlider(153, 500, 250) // a slider to dim one light
    temper.position(10, 40); // position it
    temper.mouseReleased(changeTemperature); // mouseReleased callback function

    text("Lysstyrke", dimmer.x * 2 + dimmer.width, 14);
    text("Temperatur", temper.x * 2 + temper.width, 44);
    textSize(144);
    text(lightNumber, 300, 100);
    connect(); // connect to Hue hub; it will show all light states
}

/*
this function makes the HTTP GET call to get the light data:
HTTP GET http://your.hue.hub.address/api/username/lights/
*/
function connect() {
    url = "http://" + url + '/api/' + username + '/lights/';
    httpDo(url, 'GET', getLights);
}

/*
this function uses the response from the hub
to create a new div for the UI elements
*/
function getLights(result) {
    resultDiv.html("<hr/>" + result);
}

function changeBrightness() {
    var brightness = this.value(); // get the value of this slider
    var lightState = { // make a JSON object with it
        bri: brightness,
        on: true
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

function changeTemperature() {
    var temperature = this.value(); // get the value of this slider
    var lightState = { // make a JSON object with it
        ct: temperature,
        on: true
    }
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);
}

function oscChangeBrightness(lys){
    var lightState = { // make a JSON object with it
        bri: lys,
        on: true
    }
    dimmer.value(lys);
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);    
}

function oscChangeTemperature(varme){
    var lightState = { // make a JSON object with it
        ct: varme,
        on: true
    }
    temper.value(varme);
    // make the HTTP call with the JSON object:
    setLight(lightNumber, lightState);    
}

/*
this function makes an HTTP PUT call to change the properties of the lights:
HTTP PUT http://your.hue.hub.address/api/username/lights/lightNumber/state/
and the body has the light state:
{
  on: true/false,
  bri: brightness
}
*/
function setLight(whichLight, data) {
    var path = url + whichLight + '/state/';

    var content = JSON.stringify(data); // convert JSON obj to string
    httpDo(path, 'PUT', content, 'text', getLights); //HTTP PUT the change
}


/*
Nedenstående er OSC funktioner. 
*/


function receiveOsc(address, value) {
    if (address == osc_address) {
        lys = value[0];
        varme = value[1];
    }
    lys = parseInt(map(lys, 0, 500, 1, 254));
    varme = parseInt(map(varme, 0, 500, 153, 500));
    oscDiv.html("OSC Lys: " + lys + " Varme: " + varme + "<hr/>");
    
    if(frameCount%30==0){
        oscChangeBrightness(lys);
        oscChangeTemperature(varme);
    }
    //console.log("Received osc : " + address + " " + value);
}

function sendOsc(address, value) {
    socket.emit('message', [address].concat(value));
}

function setupOsc(oscPortIn, oscPortOut) {
    var socket = io.connect('http://127.0.0.1:8081', {
        port: 8081,
        rememberTransport: false
    });
    socket.on('connect', function () {
        socket.emit('config', {
            server: {
                port: oscPortIn,
                host: '127.0.0.1'
            },
            client: {
                port: oscPortOut,
                host: '127.0.0.1'
            }
        });
    });
    socket.on('message', function (msg) {
        if (msg[0] == '#bundle') {
            for (var i = 2; i < msg.length; i++) {
                receiveOsc(msg[i][0], msg[i].splice(1));
            }
        } else {
            receiveOsc(msg[0], msg.splice(1));
        }
    });
}
