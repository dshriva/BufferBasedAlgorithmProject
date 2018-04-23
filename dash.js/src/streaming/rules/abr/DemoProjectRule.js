/*global dashjs*/

let BBA0Rule;

function BBA0RuleClass() {

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
        //const mediaInfo = rulesContext.getMediaInfo();
       // const mediaType = rulesContext.getMediaType();
        //const bufferController = streamProcessor.getBufferController();

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
        console.log("currentBufferLevel");
        console.log(bufferLevel);

        let requests = dashMetrics.getHttpRequests(metrics),
            lastRequest = null,
            currentRequest = null,
            downloadTime,
            totalTime,
            calculatedBandwidth,
            currentBandwidth,
            latencyInBandwidth,
            switchUpRatioSafetyFactor,
            currentRepresentation,
            count,
            bandwidths = [],
            i,
            q = SwitchRequest.NO_CHANGE,
            p = SwitchRequest.PRIORITY.DEFAULT,
            totalBytesLength = 0;
        console.log(requests);

        const maxAllowedBitRate = abrController.getMaxAllowedBitrateFor('video');
        const minAllowedBitRate = abrController.getMinAllowedBitrateFor('video');
        const reservoir = (0.1 * bufferLength);
        const cushion = 0.9 * bufferLength;

        console.log('ECE 50863 PROJECT - bufferLevel: ' + bufferLevel);
        console.log('ECE 50863 PROJECT - bufferLength: ' + bufferLength);
        console.log('ECE 50863 PROJECT - maxAllowedBitRate: ' + maxAllowedBitRate);
        console.log('ECE 50863 PROJECT - minAllowedBitRate: ' + minAllowedBitRate);
        console.log('ECE 50863 PROJECT - reservoir: ' + reservoir);
        console.log('ECE 50863 PROJECT - cushion: ' + cushion);

        const throughputHistory = abrController.getThroughputHistory();
        const throughput = throughputHistory.getAverageThroughput(mediaType);
        const latency = throughputHistory.getAverageLatency(mediaType);
        let bitrate = throughput * 2;


        /*let requests = dashMetrics.getHttpRequests(metrics),
            lastRequest = null,
            currentRequest = null,
            downloadTime,
            totalTime,
            calculatedBandwidth,
            currentBandwidth,
            latencyInBandwidth,
            switchUpRatioSafetyFactor,
            currentRepresentation,
            count,
            bandwidths = [],
            i,
            q = SwitchRequest.NO_CHANGE,
            p = SwitchRequest.PRIORITY.DEFAULT,
            totalBytesLength = 0;

        //latencyInBandwidth = true;
        //switchUpRatioSafetyFactor = 1.5;*/
/*
        if (currentBufferLevel < bufferLength/5) {
            console.log("working at minimum bandwidth")
        }
        else {
            console.log("working at max bandwidth")
        }


*/

        return SwitchRequest(context).create();
        /*
        if (!metrics) {
            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] No metrics, bailing.");
            return SwitchRequest(context).create();
        }

        // Get last valid request
        i = requests.length - 1;
        while (i >= 0 && lastRequest === null) {
            currentRequest = requests[i];
            if (currentRequest._tfinish && currentRequest.trequest && currentRequest.tresponse && currentRequest.trace && currentRequest.trace.length > 0) {
                lastRequest = requests[i];
            }
            i--;
        }

        if (lastRequest === null) {
            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] No valid requests made for this stream yet, bailing.");
            return SwitchRequest(context).create();
        }

        if(lastRequest.type !== 'MediaSegment' ) {
            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] Last request is not a media segment, bailing.");
            return SwitchRequest(context).create();
        }

        totalTime = (lastRequest._tfinish.getTime() - lastRequest.trequest.getTime()) / 1000;
        downloadTime = (lastRequest._tfinish.getTime() - lastRequest.tresponse.getTime()) / 1000;

        if (totalTime <= 0) {
            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] Don't know how long the download of the last fragment took, bailing.");
            return SwitchRequest(context).create();
        }

        totalBytesLength = getBytesLength(lastRequest);

        debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] DL: " + Number(downloadTime.toFixed(3)) + "s, Total: " + Number(totalTime.toFixed(3)) + "s, Length: " + totalBytesLength);

        // Take average bandwidth over 3 requests
        count = 1;
        while (i >= 0 && count < 3) {
            currentRequest = requests[i];

            if (currentRequest.type !== 'MediaSegment' && currentRequest._tfinish && currentRequest.trequest && currentRequest.tresponse && currentRequest.trace && currentRequest.trace.length > 0) {

                let _totalTime = (currentRequest._tfinish.getTime() - currentRequest.trequest.getTime()) / 1000;
                let _downloadTime = (currentRequest._tfinish.getTime() - currentRequest.tresponse.getTime()) / 1000;
                debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] DL: " + Number(_downloadTime.toFixed(3)) + "s, Total: " + Number(_totalTime.toFixed(3)) + "s, Length: " + getBytesLength(currentRequest));

                totalTime += _totalTime;
                downloadTime += _downloadTime;
                totalBytesLength += getBytesLength(currentRequest);
                count += 1;
            }
            i--;
        }

        // Set length in bits
        totalBytesLength *= 8;

        calculatedBandwidth = latencyInBandwidth ? (totalBytesLength / totalTime) : (totalBytesLength / downloadTime);

        debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] BW = " + Math.round(calculatedBandwidth / 1000) + " kb/s");

        if (isNaN(calculatedBandwidth)) {
            return SwitchRequest(context).create();
        }

        count = rulesContext.getMediaInfo().representationCount;
        currentRepresentation = rulesContext.getRepresentationInfo();
        currentBandwidth = dashManifest.getBandwidth(currentRepresentation);
        for (i = 0; i < count; i += 1) {
            bandwidths.push(rulesContext.getMediaInfo().bitrateList[i].bandwidth);
        }
        if (calculatedBandwidth <= currentBandwidth) {
            for (i = current - 1; i > 0; i -= 1) {
                if (bandwidths[i] <= calculatedBandwidth) {
                    break;
                }
            }
            q = i;
            p = SwitchRequest.PRIORITY.WEAK;

            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] SwitchRequest: q=" + q + "/" + (count - 1) + " (" + bandwidths[q] + ")"/* + ", p=" + p);
            return SwitchRequest(context).create(q, {name : DownloadRatioRuleClass.__dashjs_factory_name},  p);
        } else {
            for (i = count - 1; i > current; i -= 1) {
                if (calculatedBandwidth > (bandwidths[i] * switchUpRatioSafetyFactor)) {
                    // debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] bw = " + calculatedBandwidth + " results[i] * switchUpRatioSafetyFactor =" + (bandwidths[i] * switchUpRatioSafetyFactor) + " with i=" + i);
                    break;
                }
            }

            q = i;
            p = SwitchRequest.PRIORITY.STRONG;

            debug.log("[CustomRules][" + mediaType + "][DownloadRatioRule] SwitchRequest: q=" + q + "/" + (count - 1) + " (" + bandwidths[q] + ")"/* + ", p=" + p);
            return SwitchRequest(context).create(q, {name : DownloadRatioRuleClass.__dashjs_factory_name},  p);
        }
        */
    }

    const instance = {
        getMaxIndex: getMaxIndex
    };
    return instance;
}

BBA0RuleClass.__dashjs_factory_name = 'BBA0Rule';
BBA0Rule = dashjs.FactoryMaker.getClassFactory(BBA0RuleClass);

