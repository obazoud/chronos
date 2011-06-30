package com.chronos.netty.service;

import java.util.Map;

import org.jboss.netty.handler.codec.http.HttpRequest;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceResquest {
    String name;
    String method;
    Map<String, String> args;
    HttpRequest httpRequest;
}
