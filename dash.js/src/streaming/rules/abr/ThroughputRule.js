/*
Logging Throughput Rule for Evaluation procedure
Code Modification by : Divya
*/

import BufferController from '../../controllers/BufferController';
import AbrController from '../../controllers/AbrController';
import FactoryMaker from '../../../core/FactoryMaker';
import Debug from '../../../core/Debug';
import SwitchRequest from '../SwitchRequest';

let startTime = (new Date()).getTime();

function ThroughputRule(config) {

    config = config || {};
    const context = this.context;
    const log = Debug(context).getInstance().log;

    const metricsModel = config.metricsModel;

    function checkConfig() {
        if (!metricsModel || !metricsModel.hasOwnProperty('getReadOnlyMetricsFor')) {
            throw new Error('Missing config parameter(s)');
        }
    }

    function getMaxIndex(rulesContext) {
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getMediaType') || !rulesContext.hasOwnProperty('useBufferOccupancyABR') ||
            !rulesContext.hasOwnProperty('getAbrController') || !rulesContext.hasOwnProperty('getStreamProcessor')) {
            return switchRequest;
        }

        checkConfig();

        const mediaInfo = rulesContext.getMediaInfo();
        const mediaType = rulesContext.getMediaType();
        const metrics = metricsModel.getReadOnlyMetricsFor(mediaType);
        const streamProcessor = rulesContext.getStreamProcessor();
        const abrController = rulesContext.getAbrController();
        const streamInfo = rulesContext.getStreamInfo();
        const isDynamic = streamInfo && streamInfo.manifestInfo ? streamInfo.manifestInfo.isDynamic : null;
        const throughputHistory = abrController.getThroughputHistory();
        const throughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
        const latency = throughputHistory.getAverageLatency(mediaType);
        const bufferStateVO = (metrics.BufferState.length > 0) ? metrics.BufferState[metrics.BufferState.length - 1] : null;
        const useBufferOccupancyABR = rulesContext.useBufferOccupancyABR();
        let curTime = (new Date()).getTime() - startTime;

        if (!metrics || isNaN(throughput) || !bufferStateVO || useBufferOccupancyABR) {
            return switchRequest;
        }

        if (abrController.getAbandonmentStateFor(mediaType) !== AbrController.ABANDON_LOAD) {
            if (bufferStateVO.state === BufferController.BUFFER_LOADED || isDynamic) {
                switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, throughput, latency);
                streamProcessor.getScheduleController().setTimeToLoadDelay(0);
                log('ThroughputRule requesting switch to index: ', switchRequest.quality, 'type: ',mediaType, 'Average throughput', Math.round(throughput), 'kbps');
                switchRequest.reason = {throughput: throughput, latency: latency};
                console.log('ECE 50863 PROJECT - Time : ' + curTime + ' | Average Bitrate selected is : ' + Math.round(throughput));
            }
        }

        return switchRequest;
    }

    function reset() {
        // no persistent information to reset
    }

    const instance = {
        getMaxIndex: getMaxIndex,
        reset: reset
    };

    return instance;
}

ThroughputRule.__dashjs_factory_name = 'ThroughputRule';
export default FactoryMaker.getClassFactory(ThroughputRule);
