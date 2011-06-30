package com.chronos.netty;

import static org.jboss.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.CREATED;
import static org.jboss.netty.handler.codec.http.HttpResponseStatus.NOT_FOUND;
import static org.jboss.netty.handler.codec.http.HttpVersion.HTTP_1_1;

import java.util.Map;

import org.jboss.netty.handler.codec.http.DefaultHttpResponse;
import org.jboss.netty.handler.codec.http.HttpResponse;

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

        HttpResponse response = new DefaultHttpResponse(HTTP_1_1, NOT_FOUND);
        ServiceResponse serviceResponse = new ServiceResponse();
        serviceResponse.httpResponse = response;
        return serviceResponse;
    }

    private ServiceResponse user(ServiceResquest serviceResquest) {
        try {
            // TODO : throw exception costs !
            Map<String, String> args = serviceResquest.args;
            quizzApi.addUser(args.get("lastname"), args.get("firstname"), args.get("mail"), args.get("password"));
            HttpResponse response = new DefaultHttpResponse(HTTP_1_1, CREATED);
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponse = response;
            return serviceResponse;
        } catch (Exception e) {
            HttpResponse response = new DefaultHttpResponse(HTTP_1_1, BAD_REQUEST);
            ServiceResponse serviceResponse = new ServiceResponse();
            serviceResponse.httpResponse = response;
            return serviceResponse;
        }
    }

}
