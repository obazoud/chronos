package com.chronos.netty;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

import org.jboss.netty.channel.Channel;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.oneone.OneToOneDecoder;
import org.jboss.netty.util.CharsetUtil;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceRequestDecoder extends OneToOneDecoder {

    @Override
    protected Object decode(ChannelHandlerContext ctx, Channel channel, Object msg) throws Exception {
        if (!(msg instanceof HttpRequest)) {
            return msg;
        }

        HttpRequest request = (HttpRequest) msg;
        ServiceResquest serviceResquest = new ServiceResquest();
        serviceResquest.name = getService(request);
        serviceResquest.method = getMethod(request);
        serviceResquest.args = getArgs(request);
        serviceResquest.httpRequest = request;
        return serviceResquest;
    }

    private Map<String, String> getArgs(HttpRequest request) {
        String json = request.getContent().toString(CharsetUtil.UTF_8);
        Map<String, String> map = new Gson().fromJson(json, new TypeToken<HashMap<String, String>>() {
        }.getType());
        return map;
    }

    protected String getService(HttpRequest request) throws Exception {
        // TODO
        return "api";
    }

    protected String getMethod(HttpRequest request) throws Exception {
        String uri = URLDecoder.decode(request.getUri(), "UTF-8");
        String service = uri.substring(uri.lastIndexOf("/") + 1);
        return service;
    }
}
