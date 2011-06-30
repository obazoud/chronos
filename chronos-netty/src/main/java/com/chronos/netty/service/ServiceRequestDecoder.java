package com.chronos.netty.service;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.jboss.netty.channel.Channel;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.oneone.OneToOneDecoder;
import org.jboss.netty.util.CharsetUtil;

/**
 * @author bazoud
 * @version $Id$
 */
public class ServiceRequestDecoder extends OneToOneDecoder {
    JsonFactory f = new JsonFactory();

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

    public Map<String, String> getArgs(HttpRequest request) throws Exception {
        Map<String, String> map = new HashMap<String, String>();

        String json = request.getContent().toString(CharsetUtil.UTF_8);

        // using "raw" Jackson Streaming API
        // basic implementation
        // only key/value input here
        JsonParser jp = f.createJsonParser(json);
        jp.nextToken();
        while (jp.nextToken() != JsonToken.END_OBJECT) {
            jp.nextToken();
            map.put(jp.getCurrentName(), jp.getText());
        }

        return map;
    }

    public String getService(HttpRequest request) throws Exception {
        // TODO
        return "api";
    }

    public String getMethod(HttpRequest request) throws Exception {
        String uri = URLDecoder.decode(request.getUri(), "UTF-8");
        String service = uri.substring(uri.lastIndexOf("/") + 1);
        return service;
    }
}
