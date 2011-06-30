package com.chronos.netty;

import static org.jboss.netty.handler.codec.http.HttpHeaders.isKeepAlive;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_LENGTH;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_TYPE;

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
            HttpRequest request = (HttpRequest) e.getMessage();
            HttpResponse response = dispatcher.dispatcher(request);
            writeResponse(e, response);
        } else {
            logger.warn("message is not an instance of HttpRequest");
        }
        logger.info("<< exit");
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, ExceptionEvent e) throws Exception {
        logger.warn("exceptionCaught:", e.getCause());
        e.getChannel().close();
    }

    private void writeResponse(MessageEvent e, HttpResponse response) {
        response.setHeader(CONTENT_TYPE, "text/plain; charset=UTF-8");
        boolean keepAlive = isKeepAlive((HttpRequest) e.getMessage());
        if (keepAlive) {
            response.setHeader(CONTENT_LENGTH, response.getContent().readableBytes());
        }
        ChannelFuture future = e.getChannel().write(response);
        if (!keepAlive) {
            future.addListener(ChannelFutureListener.CLOSE);
        }
    }

}
