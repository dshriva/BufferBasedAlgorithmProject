/*global dashjs*/

let BBA0Rule;

let prevBitrate = 0;
let startTime = (new Date()).getTime();
const bufferLength = 65;

function BBA0RuleClass() {
    console.log('BBA RULE HITTING');
    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let Debug = factory.getSingletonFactoryByName('Debug');

    let context = this.context;
    let debug = Debug(context).getInstance();

    function getBytesLength(request) {
        return request.trace.reduce((a, b) => a + b.b[0], 0);
    }

    function getMaxIndex(rulesContext) {
        const mediaInfo = rulesContext.getMediaInfo();
		const switchRequest = SwitchRequest(context).create();
        let mediaType = rulesContext.getMediaInfo().type;
        let metricsModel = MetricsModel(context).getInstance();
        let dashMetrics = DashMetrics(context).getInstance();
        //let mediaPlayer = MediaPlayer(context).getInstance();
        let dashManifest = DashManifestModel(context).getInstance();
        let metrics = metricsModel.getReadOnlyMetricsFor(mediaType);
        let streamController = StreamController(context).getInstance();
        let abrController = rulesContext.getAbrController();
        let current = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo());

        let bufferLevel = dashMetrics.getCurrentBufferLevel(metrics);

        const reservoir = (0.1 * bufferLength);
        const cushion = 0.9 * bufferLength;

        const throughputHistory = abrController.getThroughputHistory();
        const latency = throughputHistory.getAverageLatency(mediaType);
        let bitrate = 254;

		const bitrateList = abrController.getBitrateList(mediaInfo);
		switchRequest.reason = 'Changing buffer rate';

		let curTime = (new Date()).getTime() - startTime;


		console.log('ECE 50863 PROJECT - Time : ' + curTime + ' | Buffer Level :  ' +  Math.ceil(bufferLevel/5) * 5 + ' | previous bitrate : ' + prevBitrate);

		var bufferMap = {};
		var initLevel = 10;
		for (let i = 0; i < bitrateList.length && bitrateList.length > 1; i++) {
			const bit_rate_i = bitrateList[i];
			bufferMap[(i * 5) + initLevel] = bit_rate_i.bitrate;
			//console.log('ECE 50863 - Setting buffer level :' + i + ' to : ' + bit_rate_i.bitrate);
		}

		// BBA 0 algorithm begins

		/*
		if Rateprev = Rmax then
			Rate+ = Rmax
		else
			Rate+ = min{Ri : Ri > Rateprev}
		*/
		let ratePlus = 0;
		let rateMinus = 0;

		let rMax = bitrateList[bitrateList.length - 1].bitrate;
		ratePlus = rMax;
		if ( prevBitrate == rMax) {
			ratePlus = rMax;
		} else {
			for (let i = 0; i < bitrateList.length; i++) {
				const bit_rate_i = bitrateList[i];
				if ( bit_rate_i.bitrate > prevBitrate) {
					ratePlus = bit_rate_i.bitrate;
					//console.log('ratePlus : ' + bit_rate_i.bitrate);
					break;
				}
			}
		}

		/*
		if Rateprev = Rmin then
			Rate− = Rmin
		else
			Rate− = max{Ri : Ri < Rateprev}
		*/

		let rMin = bitrateList[0].bitrate;
		rateMinus = rMin;
		if ( prevBitrate == rMin) {
			rateMinus = rMin;
		} else {
			for (let i = bitrateList.length - 1; i >= 0 ; i--) {
				const bit_rate_i = bitrateList[i];
				if ( bit_rate_i.bitrate < prevBitrate) {
					rateMinus = bit_rate_i.bitrate;
					//console.log('rateMinus : ' + bit_rate_i.bitrate);
					break;
				}
			}
		}

		let rateNext = prevBitrate;

		/*
		if Bufnow ≤ r then
			Ratenext = Rmin
		else if Bufnow ≥ (r + cu) then
			Ratenext = Rmax
		else if f(Bufnow) ≥ Rate+ then
			Ratenext = max{Ri : Ri < f(Bufnow)};
		else if f(Bufnow) ≤ Rate− then
			Ratenext = min{Ri : Ri > f(Bufnow)};
		else
			Ratenext = Rateprev;
		*/

		let funcBufferLevel = Math.ceil(bufferLevel/5) * 5;
		if (bufferLevel <= reservoir) {
			rateNext = rMin;
		} else if (bufferLevel >= reservoir + cushion) {
			rateNext = rMax;
		} else if (bufferMap[funcBufferLevel] != null && bufferMap[funcBufferLevel] >= ratePlus) {
			rateNext = bufferMap[funcBufferLevel - 5];
        } else if (bufferMap[funcBufferLevel] != null && bufferMap[funcBufferLevel] <= rateMinus ) {
			rateNext = bufferMap[funcBufferLevel + 5];
        } else {
			rateNext =  prevBitrate;
		}
		console.log('ECE 50863 PROJECT - setting next rate to ' + rateNext);
		switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, rateNext, latency);
		prevBitrate = rateNext;

        return switchRequest;

    }

    const instance = {
        getMaxIndex: getMaxIndex
    };
    return instance;
}

BBA0RuleClass.__dashjs_factory_name = 'BBA0Rule';
BBA0Rule = dashjs.FactoryMaker.getClassFactory(BBA0RuleClass);

