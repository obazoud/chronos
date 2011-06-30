package com.chronos.netty.pipeline;

import org.jboss.netty.channel.ChannelPipeline;
import org.jboss.netty.channel.ChannelPipelineFactory;
import org.jboss.netty.handler.codec.http.HttpRequestDecoder;
import org.jboss.netty.handler.codec.http.HttpResponseEncoder;

import com.chronos.netty.service.ChronosHandler;

import static org.jboss.netty.channel.Channels.pipeline;

/**
 * @author bazoud
 * @version $Id$
 */
public class HttpServerPipelineFactory implements ChannelPipelineFactory {
    static ChronosHandler chronosHandler = new ChronosHandler();
    @Override
    public ChannelPipeline getPipeline() throws Exception {
        ChannelPipeline pipeline = pipeline();
        pipeline.addLast("httpDecoder", new HttpRequestDecoder());
        // pipeline.addLast("aggregator", new HttpChunkAggregator(1048576));
        pipeline.addLast("httpEncoder", new HttpResponseEncoder());
        pipeline.addLast("chronos", chronosHandler);
        return pipeline;
    }

}
