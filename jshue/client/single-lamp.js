// Bridge ip-adresse. Find den fx i hue app'en
var url = '10.0.1.??';
// Fælles brugernavn
var username = 'C2fr-2XtwFq3Z7G3Xk4XftfEq48pY0oxXaYMJcU4';
var dimmer, temper, breather;
//Den pære du vil kontrollere
var lightNumber = 4;

function setup() {
    createCanvas(500,400);
    resultDiv = createDiv('Hub response'); // a div for the Hue hub's responses
    resultDiv.position(10, 140); // position it
    dimmer = createSlider(1, 254, 127) // createslider(min, max, default,step)
    dimmer.position(10, 10); // position it
    dimmer.mouseReleased(changeBrightness); // mouseReleased callback function
    
    temper = createSlider(153, 500, 250) // a slider to dim one light
    temper.position(10, 40); // position it
    temper.mouseReleased(changeTemperature); // mouseReleased callback function

    breather = createButton("Breathe") // a slider to dim one light
    breather.position(10, 70); // position it
    breather.mouseReleased(breathe); // mouseReleased callback function

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

function breathe() {
    var lightState = { // make a JSON object with it
        alert: "select",
        on: true
    }
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
OPGAVER 

Koden her opretter en dimmer til at sætte lysstyrken (bri). 

Se om du kan kopiere lignende funtionalitet til at styre temperatur (ct)
Altså...
    Lave en ny slider
    Lave en ny funktion som styrer color temperature
    Kalde funktionen når slideren ændres
    
Kig derefter i Api'et. 
https://developers.meethue.com/documentation/lights-api
Er der andre værdier du kan sætte eller funktioner du kan kalde? 

*/
