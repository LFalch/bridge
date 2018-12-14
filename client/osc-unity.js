/*
Skriv denne kommando i terminalen:
node bridge.js
*/

// input
let textInput;

let unityHostInputField;

let connectedStatus = 0;

let resultPre;
let connectButton;

let containerSection;

let socket;

let listeningSliders = [];
let lightIntensitySlider;
let lightDirectionSliders = {};
let lockSlider;

let bridgeConfig = {
	local: {
		port: 11000,
		host: '127.0.0.1'
	},
	remotes: [{
			name: "unity",
			port: 12000,
			host: '192.168.8.101'
		},
		{
			name: "arduino",
			port: 10330,
			host: '192.168.8.105'
		}
	]
};

function setup() {

	setupOsc(); //Begynd at lytte efter OSC

	// Page container

	containerSection = createElement("section", "").addClass("container");

	// Unity adresse

	createElement("h3", "Unity netværksadresse")
		.parent(containerSection);

	let unityConfig = bridgeConfig.remotes.filter(r => r.name === "unity")[0];
	unityHostInputField = createElement("p", unityConfig.host + ":" + unityConfig.port)
		.parent(containerSection);

	/* VIRKER IKKE
	connectButton = createButton("Forbind")
		.parent(containerSection)
		.changed(() => {
			bridgeConfig.client.host = unityHostInputField.value();
			socket.emit('config', bridgeConfig);
		})
	*/

	// Arudino adresse

	createElement("h3", "Arudino netværksadresse")
		.parent(containerSection);

	let arduinoConfig = bridgeConfig.remotes.filter(r => r.name === "arduino")[0];
	unityHostInputField = createElement("p", arduinoConfig.host + ":" + arduinoConfig.port)
		.parent(containerSection);

	// Tekst besked

	createElement("h3", "Tekstbesked til spiller")
		.parent(containerSection);

	textInput = createInput()
		.parent(containerSection)
		.changed((e) => {
			console.log(textInput.value());
			sendOsc("/text", textInput.value());
		});

	// Blik

	createElement("h3", "Lås")
		.parent(containerSection);

	lockSlider = createSlider(0, 1, 1)
		.parent(containerSection);

	lockSlider.elt.addEventListener('input', () => {
		sendOsc("/lock", lockSlider.value());
	});

	listeningSliders.push({
		slider: lockSlider,
		address: "/looking",
		index: 0,
		parseValue: (val) => {return 1.0-val} // negate looking value
	});


	// Lys

	createElement("h3", "Lys")
		.parent(containerSection);

	// Lys / Intensitet

	createElement("h5", "Intensitet")
		.parent(containerSection);

	lightIntensitySlider = createSlider(0, 80 * 100, 0)
		.parent(containerSection);

	lightIntensitySlider.elt.addEventListener('input', () => {
		sendOsc("/light/intensity", lightIntensitySlider.value());
	});

	listeningSliders.push({
		slider: lightIntensitySlider,
		address: "/wek/outputs",
		index: 0
	});

	// Lys / Retning

	createElement("h5", "Retning")
		.parent(containerSection);

	lightDirectionSliders.x = createSlider(-180 * 100, 180 * 100, 0)
		.parent(containerSection);
	lightDirectionSliders.x.elt.addEventListener('input', () => {
		sendOsc("/light/direction", [lightDirectionSliders.x.value(), lightDirectionSliders.y.value(), lightDirectionSliders.z.value()]);
	});
	listeningSliders.push({
		slider: lightDirectionSliders.x,
		address: "/wek/outputs",
		index: 1
	});

	lightDirectionSliders.y = createSlider(-180 * 100, 180 * 100, 0)
		.parent(containerSection);
	lightDirectionSliders.y.elt.addEventListener('input', () => {
		sendOsc("/light/direction", [lightDirectionSliders.x.value(), lightDirectionSliders.y.value(), lightDirectionSliders.z.value()]);
	});
	listeningSliders.push({
		slider: lightDirectionSliders.y,
		address: "/wek/outputs",
		index: 2
	});

	lightDirectionSliders.z = createSlider(-180 * 100, 180 * 100, 0)
		.parent(containerSection);
	lightDirectionSliders.z.elt.addEventListener('input', () => {
		sendOsc("/light/direction", [lightDirectionSliders.x.value(), lightDirectionSliders.y.value(), lightDirectionSliders.z.value()]);
	});
	listeningSliders.push({
		slider: lightDirectionSliders.z,
		address: "/wek/outputs",
		index: 3
	});

	// Seneste OSC input

	createElement("h3", "Seneste OSC Input")
		.parent(containerSection);

	resultPre = createElement('pre', 'Intet input endnu')
		.parent(containerSection); // a div for the Hue hub's responses
}

/*
Nedenstående er OSC funktioner. 
*/

function receiveOsc(address, value) {

	if (address.split('/')[1] === "wek") {
		// besked fra Wekinator
		//resultPre.html(address + "   " + value + '\n' +resultPre.html());
	}

	resultPre.html(address + "   " + value + '\n' + resultPre.html());

	listeningSliders.map(s => {
		if (address === s.address) {
			if (value[s.index]) {

				if(s.parseValue){
					value[s.index] = s.parseValue(value[s.index]);
				}

				let sliderValue = map(value[s.index], 0.0, 1.0, s.slider.elt.min, s.slider.elt.max);
				console.log("slider got value", sliderValue);
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
