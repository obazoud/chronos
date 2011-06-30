package com.chronos.netty.pipeline;

import static org.jboss.netty.channel.Channels.pipeline;

import org.jboss.netty.channel.ChannelPipeline;
import org.jboss.netty.channel.ChannelPipelineFactory;
import org.jboss.netty.handler.codec.http.HttpRequestDecoder;
import org.jboss.netty.handler.codec.http.HttpResponseEncoder;
import org.jboss.netty.handler.execution.ExecutionHandler;
import org.jboss.netty.handler.execution.OrderedMemoryAwareThreadPoolExecutor;

import com.chronos.netty.server.NettyServer;
import com.chronos.netty.service.ChronosHandler;

/**
 * @author bazoud
 * @version $Id$
 */
public class HttpServerPipelineFactory implements ChannelPipelineFactory {
    static ChronosHandler chronosHandler = new ChronosHandler();
    static ExecutionHandler executionHandler = new ExecutionHandler(new OrderedMemoryAwareThreadPoolExecutor(NettyServer.executionHandlerCount, 0, 0));

    @Override
    public ChannelPipeline getPipeline() throws Exception {
        ChannelPipeline pipeline = pipeline();
        pipeline.addLast("httpDecoder", new HttpRequestDecoder());
        // pipeline.addLast("aggregator", new HttpChunkAggregator(1048576));
        pipeline.addLast("httpEncoder", new HttpResponseEncoder());
        pipeline.addLast("executionHandler", executionHandler);
        pipeline.addLast("chronos", chronosHandler);
        return pipeline;
    }

}
