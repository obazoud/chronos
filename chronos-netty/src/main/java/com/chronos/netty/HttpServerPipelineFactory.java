package com.chronos.netty;

import static org.jboss.netty.channel.Channels.pipeline;

import org.jboss.netty.channel.ChannelHandler;
import org.jboss.netty.channel.ChannelPipeline;
import org.jboss.netty.channel.ChannelPipelineFactory;
import org.jboss.netty.handler.codec.http.HttpRequestDecoder;
import org.jboss.netty.handler.codec.http.HttpResponseEncoder;

/**
 * @author bazoud
 * @version $Id$
 */
public class HttpServerPipelineFactory implements ChannelPipelineFactory {
    private static ChannelHandler LOGGER;
    private static final ChannelHandler DECODER = new HttpRequestDecoder();
    private static final ChannelHandler ENCODER = new HttpResponseEncoder();
    // private static final ChannelHandler CHUNKDED_WRITER = new ChunkedWriteHandler();
    private static final ChannelHandler CHRONOS = new ChronosHandler();

    public HttpServerPipelineFactory() {
//        InternalLoggerFactory.setDefaultFactory(new Slf4JLoggerFactory());
//        LOGGER = new LoggingHandler(InternalLogLevel.DEBUG);
    }

    @Override
    public ChannelPipeline getPipeline() throws Exception {
        ChannelPipeline pipeline = pipeline();
//        pipeline.addLast("logger", LOGGER);
        pipeline.addLast("decoder", DECODER);
        pipeline.addLast("encoder", ENCODER);
        pipeline.addLast("handler", CHRONOS);
        return pipeline;
    }

}
