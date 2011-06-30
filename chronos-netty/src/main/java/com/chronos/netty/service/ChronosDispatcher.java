package com.chronos.netty.service;

import java.io.OutputStream;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;

import org.codehaus.jackson.JsonEncoding;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.buffer.ChannelBufferOutputStream;
import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;

import static org.jboss.netty.handler.codec.http.HttpMethod.GET;
import static org.jboss.netty.handler.codec.http.HttpMethod.POST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.NOT_FOUND;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.OK;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosDispatcher {
    JsonFactory jsonFactory = new JsonFactory();

    public HttpResponse dispatcher(HttpRequest httpRequest) throws Exception {
        // TODO : reflection scale ?
        // TODO : send to a delegate
        String method = getMethod(httpRequest);
        if ("question".equals(method)) {
            return question(httpRequest);
        }

        if ("user".equals(method)) {
            return user(httpRequest);
        }

        HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, NOT_FOUND);
        return httpResponse;
    }

    private HttpResponse question(HttpRequest httpRequest) {
        try {
            if (httpRequest.getMethod().equals(GET)) {
                String uri = URLDecoder.decode(httpRequest.getUri(), "UTF-8");
                String question = uri.substring(uri.lastIndexOf("/") + 1);

                // TODO: Business stuff!

                final ChannelBuffer channelBuffer = ChannelBuffers.dynamicBuffer(128);
                final OutputStream stream = new ChannelBufferOutputStream(channelBuffer);

                JsonGenerator generator = jsonFactory.createJsonGenerator(stream, JsonEncoding.UTF8);
                generator.disable(JsonGenerator.Feature.AUTO_CLOSE_TARGET);
                generator.disable(JsonGenerator.Feature.AUTO_CLOSE_JSON_CONTENT);
                generator.writeStartObject();
                generator.writeStringField("question", question);
                generator.writeStringField("answer_1", "string");
                generator.writeStringField("answer_2", "string");
                generator.writeStringField("answer_3", "string");
                generator.writeStringField("answer_4", "string");
                generator.writeNumberField("score", 100);
                generator.writeEndObject();
                generator.close();

                HttpResponse httpResponse = new DefaultHttpResponse(HTTP_1_1, OK);
                httpResponse.setContent(ChannelBuffers.wrappedBuffer(channelBuffer));
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

    private HttpResponse user(HttpRequest httpRequest) {
        try {
            if (httpRequest.getMethod().equals(POST)) {
                Map<String, String> args = getArgs(httpRequest);
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

    private Map<String, String> getArgs(HttpRequest request) throws Exception {
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

    private String getMethod(HttpRequest request) throws Exception {
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
