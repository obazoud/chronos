package com.chronos.netty.service.impl;

import static org.jboss.netty.handler.codec.http.HttpMethod.POST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.util.Map;

import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;

import com.chronos.netty.service.Action;
import com.chronos.netty.service.ActionUtils;

/**
 * @author bazoud
 * @version $Id$
 */
public class UserAction implements Action {
    @Override
    public HttpResponse execute(HttpRequest httpRequest) {
        try {
            if (httpRequest.getMethod().equals(POST)) {
                Map<String, String> args = ActionUtils.extractArgs(httpRequest);
                // TODO: Business stuff!
                HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, CREATED);
                return httpResponse;
            } else {
                HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, BAD_REQUEST);
                return httpResponse;
            }
        } catch (Exception e) {
            HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, BAD_REQUEST);
            return httpResponse;
        }
    }
}
