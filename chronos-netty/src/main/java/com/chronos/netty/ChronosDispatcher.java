package com.chronos.netty;

import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.util.Map;

import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpResponse;
import org.jboss.netty.util.CharsetUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.chronos.biz.App;
import com.chronos.biz.QuizzApi;

/**
 * @author bazoud
 * @version $Id$
 */
public class ChronosDispatcher {
    final Logger logger = LoggerFactory.getLogger(ChronosDispatcher.class);
    QuizzApi quizzApi = App.get();
    final String messageBadRequest = "Unknow service";

    public ServiceResponse dispatcher(ServiceResquest serviceResquest) throws Exception {
        // TODO : reflection scale ?

        if ("user".equals(serviceResquest.method)) {
            Map<String, String> args = serviceResquest.args;
            quizzApi.addUser(args.get("lastname"), args.get("firstname"), args.get("mail"), args.get("password"));
            HttpResponse response = new DefaultHttpResponse(HTTP_1_1, CREATED);
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponse = response;
            return serviceResponse;
        }

        HttpResponse response = new DefaultHttpResponse(HTTP_1_1, BAD_REQUEST);
        response.setContent(ChannelBuffers.copiedBuffer(messageBadRequest, CharsetUtil.UTF_8));
        ServiceResponse serviceResponse = new ServiceResponse();
        serviceResponse.httpResponse = response;
        return serviceResponse;
    }

}
