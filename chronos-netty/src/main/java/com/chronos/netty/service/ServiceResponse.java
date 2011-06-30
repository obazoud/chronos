package com.chronos.netty.service;

import java.util.Map;

import org.jboss.netty.handler.codec.http.HttpResponseStatus;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceResponse {
    HttpResponseStatus httpResponseStatus;
    Map<String, String> data;
}
