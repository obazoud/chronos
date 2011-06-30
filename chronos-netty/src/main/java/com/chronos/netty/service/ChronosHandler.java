package com.chronos.netty.service;

import org.jboss.netty.channel.ChannelFuture;
import org.jboss.netty.channel.ChannelFutureListener;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.channel.ExceptionEvent;
import org.jboss.netty.channel.MessageEvent;
import org.jboss.netty.channel.SimpleChannelUpstreamHandler;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.jboss.netty.handler.codec.http.HttpHeaders.isKeepAlive;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_LENGTH;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_TYPE;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosHandler extends SimpleChannelUpstreamHandler {
    final Logger logger = LoggerFactory.getLogger(ChronosHandler.class);
    static ChronosDispatcher dispatcher = new ChronosDispatcher();

    @Override
    public void messageReceived(ChannelHandlerContext ctx, MessageEvent e) throws Exception {
        logger.info(">> enter");
        Object message = e.getMessage();

        if (message instanceof HttpRequest) {
            HttpRequest httpRequest = (HttpRequest) message;
            HttpResponse httpResponse = dispatcher.dispatcher(httpRequest);
            writeResponse(e, httpRequest, httpResponse);
        } else {
            ctx.sendUpstream(e);
            logger.warn("message is not an instance of ServiceResquest: {}", message.getClass());
        }
        logger.info("<< exit");
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, ExceptionEvent e) throws Exception {
        logger.warn("exceptionCaught:", e.getCause());
        e.getChannel().close();
    }

    private void writeResponse(MessageEvent e, HttpRequest httpRequest, HttpResponse httpResponse) {
        httpResponse.setHeader(CONTENT_TYPE, "text/plain; charset=UTF-8");
        boolean keepAlive = isKeepAlive(httpRequest);
        if (keepAlive) {
            httpResponse.setHeader(CONTENT_LENGTH, httpResponse.getContent().readableBytes());
        }

        ChannelFuture future = e.getChannel().write(httpResponse);
        if (!keepAlive) {
            future.addListener(ChannelFutureListener.CLOSE);
        }
    }

}
