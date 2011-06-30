package com.chronos.netty.service;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.jboss.netty.handler.codec.http.HttpRequest;

/**
 * @author bazoud
 * @version $Id$
 */
public class ActionUtils {
    static JsonFactory jsonFactory = new JsonFactory();

    public static Map<String, String> extractArgs(HttpRequest request) throws Exception {
        Map<String, String> map = new HashMap<String, String>();
        // using "raw" Jackson Streaming API
        // basic implementation
        // only key/value input here
        JsonParser jp = jsonFactory.createJsonParser(request.getContent().array());
        jp.nextToken();
        while (jp.nextToken() != JsonToken.END_OBJECT) {
            jp.nextToken();
            map.put(jp.getCurrentName(), jp.getText());
        }
        return map;
    }

    public static String extractMethod(HttpRequest request) throws Exception {
        String delimiter = "/";
        String uri = URLDecoder.decode(request.getUri(), "UTF-8");
        int offset = uri.indexOf(delimiter);
        if (offset < 0) {
            return null;
        }

        String next = uri.substring(offset + 1, uri.length());
        offset = next.indexOf(delimiter);
        if (offset < 0) {
            return null;
        }

        String service = next.substring(offset + 1, next.length());
        offset = service.indexOf(delimiter);
        if (offset < 0) {
            return service;
        } else {
            return service.substring(0, offset);
        }

    }

}
