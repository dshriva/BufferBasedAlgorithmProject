/*exported formValidationSetup, refreshErrorMessages */
import FactoryMaker from '../../../core/FactoryMaker';
import SwitchRequest from '../SwitchRequest';
import Constants from '../../constants/Constants';

function DemoProjectRule(config) {

    config = config || {};
    const context = this.context;

    const dashMetrics = config.dashMetrics;
    const metricsModel = config.metricsModel;
    const streamProcessor = config.streamProcessor;
    //const mediaPlayerModel = config.mediaPlayerModel;
    //const eventBus = EventBus(context).getInstance();

    console.log('ECE 50863 PROJECT - NEW RULE LOADED');

    function getMaxIndex(rulesContext) {
        console.log('ECE 50863 PROJECT - NEW RULE HITTING');
        const switchRequest = SwitchRequest(context).create();
        const mediaInfo = rulesContext.getMediaInfo();
        const mediaType = rulesContext.getMediaType();
        const abrController = rulesContext.getAbrController();
        const bufferController = streamProcessor.getBufferController();

        const bufferLevel = dashMetrics.getCurrentBufferLevel(metricsModel.getReadOnlyMetricsFor(mediaType));
        const bufferLength = bufferController.getBufferLength(bufferController.getWorkingTime() || 0);

        const maxAllowedBitRate = abrController.getMaxAllowedBitrateFor(Constants.VIDEO);
        const minAllowedBitRate = abrController.getMinAllowedBitrateFor(Constants.VIDEO);
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

        switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
        switchRequest.reason = 'Changing buffer rate';

        if (bufferLength <= reservoir) {
            bitrate = throughput / 2;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            switchRequest.reason = 'ECE 50863 PROJECT - Decreasing buffer rate';
            console.log('ECE 50863 PROJECT - Decreasing bitrate to ' + bitrate);
        } else if (bufferLength >= cushion) {
            bitrate = throughput * 2;
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            switchRequest.reason = 'ECE 50863 PROJECT - Increasing buffer rate';
            console.log('ECE 50863 PROJECT - Increasing bitrate to ' + bitrate);
        } else {
            switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, bitrate, latency);
            switchRequest.reason = 'ECE 50863 PROJECT - No change in buffer rate';
            console.log('ECE 50863 PROJECT - No change in bitrate to ' + bitrate);
        }

        return switchRequest;
    }

    return {
        getMaxIndex: getMaxIndex
    };
}


DemoProjectRule.__dashjs_factory_name = 'DemoProjectRule';
export default FactoryMaker.getClassFactory(DemoProjectRule);
