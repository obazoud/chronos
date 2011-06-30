package com.chronos.netty.service;

import static org.jboss.netty.handler.codec.http.HttpResponseStatus.NOT_FOUND;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.util.HashMap;
import java.util.Map;

import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;

import com.chronos.netty.service.impl.QuestionAction;
import com.chronos.netty.service.impl.UserAction;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosDispatcher {
    Map<String, Action> mapping = new HashMap<String, Action>();

    public ChronosDispatcher() {
        mapping.put("user", new UserAction());
        mapping.put("question", new QuestionAction());
    }

    public HttpResponse dispatcher(HttpRequest httpRequest) throws Exception {
        String method = ActionUtils.extractMethod(httpRequest);
        Action action = mapping.get(method);
        if (action != null) {
            return action.execute(httpRequest);
        } else {
            HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, NOT_FOUND);
            return httpResponse;
        }
    }

}
