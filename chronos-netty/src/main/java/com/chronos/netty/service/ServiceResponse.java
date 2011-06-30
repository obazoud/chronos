package com.chronos.netty.service;

import java.util.Map;

import org.jboss.netty.handler.codec.http.HttpResponse;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceResponse {
    HttpResponse httpResponse;
    Map<String, String> data;
}
