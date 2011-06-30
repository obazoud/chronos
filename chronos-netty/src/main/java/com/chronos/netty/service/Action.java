package com.chronos.netty.service;

import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;

/**
 * @author bazoud
 * @version $Id$
 */
public interface Action {
    HttpResponse execute(HttpRequest httpRequest);
}
