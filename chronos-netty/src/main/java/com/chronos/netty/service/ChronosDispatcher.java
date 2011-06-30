package com.chronos.netty.service;

import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.NOT_FOUND;

import java.io.OutputStream;
import java.util.Map;

import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.buffer.ChannelBufferOutputStream;
import org.jboss.netty.buffer.ChannelBuffers;

import com.chronos.biz.App;
import com.chronos.biz.QuizzApi;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosDispatcher {
    QuizzApi quizzApi = App.get();

    public ServiceResponse dispatcher(ServiceResquest serviceResquest) throws Exception {
        // TODO : reflection scale ?
        // TODO : send to a delegate
        if ("user".equals(serviceResquest.method)) {
            return user(serviceResquest);
        }

        if ("audit".equals(serviceResquest.method)) {
            return audit(serviceResquest);
        }

        ServiceResponse serviceResponse = new ServiceResponse();
        serviceResponse.httpResponseStatus = NOT_FOUND;
        return serviceResponse;
    }

    private ServiceResponse user(ServiceResquest serviceResquest) {
        try {
            // TODO : throw exception costs !
            Map<String, String> args = serviceResquest.args;
            quizzApi.addUser(args.get("lastname"), args.get("firstname"), args.get("mail"), args.get("password"));
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponseStatus = CREATED;
            return serviceResponse;
        } catch (Exception e) {
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponseStatus = BAD_REQUEST;
            return serviceResponse;
        }
    }

    private ServiceResponse audit(ServiceResquest serviceResquest) {
        try {
            // TODO : throw exception costs !?
            Map<String, String> args = serviceResquest.args;
            // TODO : size !?
            final ChannelBuffer channelBuffer = ChannelBuffers.dynamicBuffer(512);
            final OutputStream stream = new ChannelBufferOutputStream(channelBuffer);

            quizzApi.audit(stream, args.get("user_mail"), args.get("authentication_key"));

            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponseStatus = CREATED;
            serviceResponse.channelBuffer = channelBuffer;
            return serviceResponse;
        } catch (Exception e) {
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponseStatus = BAD_REQUEST;
            return serviceResponse;
        }
    }

}
