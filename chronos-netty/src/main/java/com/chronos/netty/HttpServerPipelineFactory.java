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
    // private static ChannelHandler LOGGER;
    private static final ChannelHandler HTTP_DECODER = new HttpRequestDecoder();
    private static final ChannelHandler HTTP_ENCODER = new HttpResponseEncoder();
    // private static final ChannelHandler HTTP_CHUNKDED_WRITER = new ChunkedWriteHandler();
    private static final ChannelHandler SECURITY = new SecurityHandler();
    private static final ChannelHandler CHRONOS = new ChronosHandler();
    private static final ChannelHandler SERVICEREQUEST_DECODER = new ServiceRequestDecoder();
    private static final ChannelHandler JSON_ENCODER = new JsonEncoder();

    public HttpServerPipelineFactory() {
//        InternalLoggerFactory.setDefaultFactory(new Slf4JLoggerFactory());
//        LOGGER = new LoggingHandler(InternalLogLevel.DEBUG);
    }

    @Override
    public ChannelPipeline getPipeline() throws Exception {
        ChannelPipeline pipeline = pipeline();
//        pipeline.addLast("logger", LOGGER);
        pipeline.addLast("httpDecoder", HTTP_DECODER);
        pipeline.addLast("httpEncoder", HTTP_ENCODER);
        pipeline.addLast("security", SECURITY);
        pipeline.addLast("serviceRequestDecoder", SERVICEREQUEST_DECODER);
        pipeline.addLast("httpJsonEncoder", JSON_ENCODER);
        pipeline.addLast("chronos", CHRONOS);
        return pipeline;
    }

}
