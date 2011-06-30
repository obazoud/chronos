package com.chronos.front.netty;

import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;
import org.jboss.netty.util.CharsetUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.chronos.biz.App;
import com.chronos.biz.QuizzApi;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosDispatcher {
    final Logger logger = LoggerFactory.getLogger(ChronosDispatcher.class);
    QuizzApi quizzApi = App.get();
    final String messageBadRequest = "Unknow service";

    public HttpResponse dispatcher(HttpRequest request) throws Exception {
        String service = getService(request);
        if ("user".equals(service)) {
            String json = request.getContent().toString(CharsetUtil.UTF_8);
            Map<String, String> data = new Gson().fromJson(json, new TypeToken<HashMap<String, String>>(){}.getType());
            quizzApi.addUser(data.get("lastname"), data.get("firstname"), data.get("mail"), data.get("password"));
            HttpResponse response = new DefaultHttpResponse(HTTP_1_1, CREATED);
            return response;
        }

        HttpResponse response = new DefaultHttpResponse(HTTP_1_1, BAD_REQUEST);
        response.setContent(ChannelBuffers.copiedBuffer(messageBadRequest, CharsetUtil.UTF_8));
        return response;
    }

    protected String getService(HttpRequest request) throws Exception {
        String uri = URLDecoder.decode(request.getUri(), "UTF-8");
        String service = uri.substring(uri.lastIndexOf("/") + 1);
        return service;
    }
}
