/*global dashjs*/

let BBA0Rule;
/*
import FactoryMaker from '../../../core/FactoryMaker'; 
import SwitchRequest from '../SwitchRequest';

import Constants from '../../constants/Constants';
*/

let prevBitrate = 0;

function BBA0RuleClass() {
    console.log('BBA RULE HITTING');
    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    //let MediaPlayer = factory.getSingletonFactoryByName('MediaPlayer');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let Debug = factory.getSingletonFactoryByName('Debug');

    let context = this.context;
    let debug = Debug(context).getInstance();

    function getBytesLength(request) {
        return request.trace.reduce((a, b) => a + b.b[0], 0);
    }

    function getMaxIndex(rulesContext) {
        
        //const switchRequest = SwitchRequest(context).create();
        const mediaInfo = rulesContext.getMediaInfo();
       // const mediaType = rulesContext.getMediaType();
        //const bufferController = streamProcessor.getBufferController();
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
        //let currentBufferLength = MediaPlayer.getCurrentBufferLength("video");
        const bufferLength = 60;
        //console.log("currentBufferLevel");
        console.log('ECE 50863 PROJECT - buffer level  : ' + bufferLevel);
        
        //const maxAllowedBitRate = abrController.getMaxAllowedBitrateFor(mediaType);
		//console.log(maxAllowedBitRate);
        //const minAllowedBitRate = abrController.getMinAllowedBitrateFor(mediaType);
		//const maxAllowedBitRate = abrController.getMaxAllowedBitrateFor(mediaType);
        const reservoir = (0.1 * bufferLength);
        const cushion = 0.9 * bufferLength;
		const maxAllowedBitRate = abrController.setMaxAllowedBitrateFor('video',14932);
		const minAllowedBitrate = abrController.setMinAllowedBitrateFor('video',254);
        //console.log('ECE 50863 PROJECT - bufferLevel: ' + bufferLevel);
        //console.log('ECE 50863 PROJECT - bufferLength: ' + bufferLength);
        //console.log('ECE 50863 PROJECT - maxAllowedBitRate: ' + abrController.getMaxAllowedBitrateFor(mediaType));
        //console.log('ECE 50863 PROJECT - minAllowedBitRate: ' + abrController.getMinAllowedBitrateFor(mediaType));
        //console.log('ECE 50863 PROJECT - reservoir: ' + reservoir);
        //console.log('ECE 50863 PROJECT - cushion: ' + cushion);

        const throughputHistory = abrController.getThroughputHistory();
        const throughput = throughputHistory.getAverageThroughput(mediaType);
        const latency = throughputHistory.getAverageLatency(mediaType);
        let bitrate = 254;
		
		const bitrateList = abrController.getBitrateList(mediaInfo);
		//console.log('Bitrate List is: ' + bitrateList);
		 for (let i = bitrateList.length - 1; i >= 0; i--) {
            const bit_rate = bitrateList[i];
			//console.log('Bitrate : ' + bit_rate.bitrate);
        }
		
		//switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
        switchRequest.reason = 'Changing buffer rate';
		
		/*if(prevBitrate == 0) {
			prevBitrate = bitrateList[0].bitrate;
		}*/
		console.log('ECE 50863 PROJECT - Prev Bitrate : ' + prevBitrate);
		
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
		
		// construct a map of bufferLevel and Rate
		
		var bufferMap = {};
		bufferMap['10'] = 67071;
		bufferMap['15'] = 254320;
		bufferMap['20'] = 507246;
		bufferMap['25'] = 759798;
		bufferMap['30'] = 1013310;
		bufferMap['35'] = 1254758;
		bufferMap['40'] = 1883700;
		bufferMap['45'] = 3134488;
		bufferMap['50'] = 4952892;
		bufferMap['55'] = 9914554;
		bufferMap['60'] = 14931538;
		bufferMap['65'] = 14931538;
		bufferMap['70'] = 14931538;
		
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
		} else if (bufferMap[funcBufferLevel] >= ratePlus) {
			rateNext = bufferMap[funcBufferLevel - 5];
        } else if (bufferMap[funcBufferLevel] <= rateMinus ) {
			rateNext = bufferMap[funcBufferLevel + 5];
        } else {
			rateNext =  prevBitrate;
		}
		console.log('ECE 50863 PROJECT - setting next rate to ' + rateNext);
		switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, rateNext, latency);
		prevBitrate = rateNext;
		
		/*
        if (bufferLevel <= 5 || bitrateList.length < 2) {
			bitrate = bitrateList[0].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Decreasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 5 with bitrate : ' + bitrate);
        
        } else if (bufferLevel <= 10  || bitrateList.length < 3) {
            //bitrate = 760;
			bitrate = bitrateList[1].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 10 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 15  || bitrateList.length < 4 ) {
            //bitrate = 3134;
			bitrate = bitrateList[2].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 15 with bitrate : ' + bitrate);
            
        } else if (bufferLevel <= 20 || bitrateList.length < 5) {
            //bitrate = 4953;
			bitrate = bitrateList[3].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 20 with bitrate : ' + bitrate);
            
        } else if (bufferLevel <= 25|| bitrateList.length < 6) {
            //bitrate = 8892;
			bitrate = bitrateList[4].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 25 with bitrate : ' + bitrate);
            
        } else if (bufferLevel <= 30 || bitrateList.length < 7) {
            //bitrate = 9915;
			bitrate = bitrateList[5].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 40 || bitrateList.length < 8) {
            //bitrate = 9915;
			bitrate = bitrateList[6].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 45 || bitrateList.length < 9) {
            //bitrate = 9915;
			bitrate = bitrateList[7].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 50 || bitrateList.length < 10) {
            //bitrate = 9915;
			bitrate = bitrateList[8].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 55 || bitrateList.length < 11) {
            //bitrate = 9915;
			bitrate = bitrateList[9].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else if (bufferLevel <= 60 || bitrateList.length < 12) {
            //bitrate = 9915;
			bitrate = bitrateList[10].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        } else  {
            //bitrate = 9915;
			bitrate = bitrateList[bitrateList.length - 1].bitrate;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            //switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Buffer level less than 30 with bitrate : ' + bitrate);

        }
		
		*/
		
        return switchRequest;

    }

    const instance = {
        getMaxIndex: getMaxIndex
    };
    return instance;
}

BBA0RuleClass.__dashjs_factory_name = 'BBA0Rule';
BBA0Rule = dashjs.FactoryMaker.getClassFactory(BBA0RuleClass);

