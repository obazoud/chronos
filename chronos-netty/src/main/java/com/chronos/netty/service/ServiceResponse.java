package com.chronos.netty.service;

import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.handler.codec.http.HttpResponseStatus;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceResponse {
    HttpResponseStatus httpResponseStatus;
    ChannelBuffer channelBuffer;
}
