var controlPanelHTML = `
	<div id='KTV-control-panel' class='clearfix yt-uix-button-panel yt-card yt-card-has-padding'>
		<ul class="control-items">
			<li class="left">
				<a id="control-only-left" class="yt-uix-button yt-uix-gen204 yt-uix-button-default yt-uix-button-size-default">Only Left</a>
				<a id="control-only-right" class="yt-uix-button yt-uix-gen204 yt-uix-button-default yt-uix-button-size-default">Only Right</a>
				<a id="control-vocal-remove" class="yt-uix-button yt-uix-gen204 yt-uix-button-default yt-uix-button-size-default">Vocal Remove</a>
				<a id="control-original-music" class="yt-uix-button yt-uix-gen204 yt-uix-button-default yt-uix-button-size-default">Original</a>
			</li>
		</ul>
	</div>
`

function SetupUI(){
	console.log("Insert UI")
	var controlPanel = $( controlPanelHTML ).insertBefore( $(".watch-main-col #watch7-speedyg-area") )

	controlPanel.on("click", "#control-only-left", SingleSide.bind(window, "left"))
				.on("click", "#control-only-right", SingleSide.bind(window, "right"))
				.on("click", "#control-original-music", filterOff)
				.on("click", "#control-vocal-remove", filterOn)
}

function CheckUI(){
	if( $("#KTV-control-panel").length == 0 ) SetupUI()
}


CheckUI()
document.addEventListener("spfdone", CheckUI);



// vocal filter
// Adapted from Richard Staton: http://www.richard-stanton.com/chrome-plugins/youtube-karaoke/
function SetupFilter(){
	// setup audio routing
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		audioContext = new AudioContext();
		
		audioSource = audioContext.createMediaElementSource(mediaElement);
		audioSource.connect(audioContext.destination);
		
		// phase inversion filter
		// input -> splitter
		// output -> destination
		splitter = audioContext.createChannelSplitter(2);
		gainL = audioContext.createGain();
		gainR = audioContext.createGain();
		// Gain stages
		gainL.gain.value = 1;
		gainR.gain.value = -1;
		// reconnect outputs
		splitter.connect(gainL, 0);
		splitter.connect(gainR, 1);

		merger = audioContext.createChannelMerger(2);
		
		// create band pass/stop using two cascaded biquads
		// inputs -> FilterLP1 & FilterLP2
		// outputs -> splitter & destinations
		console.log("Creating filter");
		
		// filter cutoff frequencies (Hz)
		var f1 = 200;
		var f2 = 6000;
		
		// Bandpass filter = LP + HP
		FilterLP1 = audioContext.createBiquadFilter();
		FilterLP1.type = "lowpass";
		FilterLP1.frequency.value = f2;
		FilterLP1.Q.value = 1;
		
		FilterLP3 = audioContext.createBiquadFilter();
		FilterLP3.type = "lowpass";
		FilterLP3.frequency.value = f2;
		FilterLP3.Q.value = 1;
		
		FilterHP1 = audioContext.createBiquadFilter();
		FilterHP1.type = "highpass";
		FilterHP1.frequency.value = f1;
		FilterHP1.Q.value = 1;
		
		FilterHP3 = audioContext.createBiquadFilter();
		FilterHP3.type = "highpass";
		FilterHP3.frequency.value = f1;
		FilterHP3.Q.value = 1;
		
		// Bandstop filter = LP + HP
		// blocking out everything!
		FilterLP2 = audioContext.createBiquadFilter();
		FilterLP2.type = "lowpass";
		FilterLP2.frequency.value = f1;
		FilterLP2.Q.value = 1;

		FilterLP4 = audioContext.createBiquadFilter();
		FilterLP4.type = "lowpass";
		FilterLP4.frequency.value = f1;
		FilterLP4.Q.value = 1;
		
		FilterHP2 = audioContext.createBiquadFilter();
		FilterHP2.type = "highpass";
		FilterHP2.frequency.value = f2;
		FilterHP2.Q.value = 1;
		
		FilterHP4 = audioContext.createBiquadFilter();
		FilterHP4.type = "highpass";
		FilterHP4.frequency.value = f2;
		FilterHP4.Q.value = 1;
		
		// connect filters
		FilterLP1.connect(FilterLP3);
		FilterLP3.connect(FilterHP1);
		FilterHP1.connect(FilterHP3);
		FilterHP3.connect(splitter);
		
		FilterLP2.connect(FilterLP4);
		FilterLP4.connect(audioContext.destination);
		FilterHP2.connect(FilterHP4);
		FilterHP4.connect(audioContext.destination);

		// audioSource.disconnect(0);
	}
	catch(e) {
		console.error('Web Audio API is not supported in this browser');
	}
}
function filterOn(){
	console.log("Removing vocals");
	audioSource.disconnect(0);

	// input to bandpass
	audioSource.connect(FilterLP1);
	
	// input to bandstop
	audioSource.connect(FilterLP2);
	audioSource.connect(FilterHP2);
}
function filterOff(){
	console.log("Adding in vocals");
	gainL.connect(merger, 0, 0)
	gainR.connect(merger, 0, 1)
	audioSource.disconnect(0);
	audioSource.connect(audioContext.destination);
}
function SingleSide(side){
	filterOff()
	if( side == "left" ) {
		console.log("only left")
		gainR.disconnect(0)
		gainL.connect(merger, 0, 1)
	}
	else {
		console.log("only right")
		gainL.disconnect(0)
		gainR.connect(merger, 0, 0)
	}
	audioSource.disconnect(0);
	audioSource.connect(splitter)
	merger.connect(audioContext.destination)
}


if(typeof audioContext === 'undefined') {
	// get first video element
	mediaElement = document.getElementsByClassName('html5-main-video')[0];

	// webaudio elements
	var audioContext, audioSource, splitter, merger, gainL, gainR;
	var FilterLP1, FilterHP1, FilterLP2, FilterHP2;
	var FilterLP3, FilterHP3, FilterLP4, FilterHP4;

	console.log("setting up filter")
	SetupFilter();
}