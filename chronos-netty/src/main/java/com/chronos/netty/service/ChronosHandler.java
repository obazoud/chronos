package com.chronos.netty.service;

import java.util.Set;

import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.channel.ChannelFuture;
import org.jboss.netty.channel.ChannelFutureListener;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.channel.ExceptionEvent;
import org.jboss.netty.channel.MessageEvent;
import org.jboss.netty.channel.SimpleChannelUpstreamHandler;
import org.jboss.netty.handler.codec.http.Cookie;
import org.jboss.netty.handler.codec.http.CookieDecoder;
import org.jboss.netty.handler.codec.http.CookieEncoder;
import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.jboss.netty.handler.codec.http.HttpHeaders.isKeepAlive;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_LENGTH;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.CONTENT_TYPE;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.COOKIE;
import static org.jboss.netty.handler.codec.http.HttpHeaders.Names.SET_COOKIE;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

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

        if (message instanceof ServiceResquest) {
            ServiceResquest serviceResquest = (ServiceResquest) message;
            ServiceResponse serviceResponse = dispatcher.dispatcher(serviceResquest);
            writeResponse(e, serviceResquest, serviceResponse);
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

    private void writeResponse(MessageEvent e, ServiceResquest serviceRequest, ServiceResponse serviceResponse) {
        HttpResponse response = new DefaultHttpResponse(HTTP_1_1, serviceResponse.httpResponseStatus);
        if (serviceResponse.channelBuffer != null) {
            response.setContent(ChannelBuffers.wrappedBuffer(serviceResponse.channelBuffer));
        }
        response.setHeader(CONTENT_TYPE, "text/plain; charset=UTF-8");
        boolean keepAlive = isKeepAlive(serviceRequest.httpRequest);
        if (keepAlive) {
            response.setHeader(CONTENT_LENGTH, response.getContent().readableBytes());
        }
        
        String cookieString = serviceRequest.httpRequest.getHeader(COOKIE);
        if (cookieString != null) {
            CookieDecoder cookieDecoder = new CookieDecoder();
            Set<Cookie> cookies = cookieDecoder.decode(cookieString);
            if(!cookies.isEmpty()) {
                CookieEncoder cookieEncoder = new CookieEncoder(true);
                for (Cookie cookie : cookies) {
                    cookieEncoder.addCookie(cookie);
                }
                response.addHeader(SET_COOKIE, cookieEncoder.encode());
            }
        }
        ChannelFuture future = e.getChannel().write(response);
        if (!keepAlive) {
            future.addListener(ChannelFutureListener.CLOSE);
        }
    }

}
