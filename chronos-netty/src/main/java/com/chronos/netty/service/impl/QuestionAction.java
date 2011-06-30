package com.chronos.netty.service.impl;

import static org.jboss.netty.handler.codec.http.HttpMethod.GET;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.OK;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.io.OutputStream;
import java.net.URLDecoder;

import org.codehaus.jackson.JsonEncoding;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.buffer.ChannelBufferOutputStream;
import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponse;

import com.chronos.netty.service.Action;

/**
 * @author bazoud
 * @version $Id$
 */
public class QuestionAction implements Action {
    JsonFactory jsonFactory = new JsonFactory();

    @Override
    public HttpResponse execute(HttpRequest httpRequest) {
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
}
