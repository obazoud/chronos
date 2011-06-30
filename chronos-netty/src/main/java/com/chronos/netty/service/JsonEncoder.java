package com.chronos.netty.service;

import org.jboss.netty.channel.ChannelDownstreamHandler;
import org.jboss.netty.channel.ChannelEvent;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.channel.MessageEvent;

;

/**
 * @author bazoud
 * @version $Id$
 */
public class JsonEncoder implements ChannelDownstreamHandler {

    @Override
    public void handleDownstream(ChannelHandlerContext ctx, ChannelEvent e) throws Exception {
        if (!(e instanceof MessageEvent)) {
            ctx.sendDownstream(e);
            return;
        }

        // MessageEvent msg = (MessageEvent) e;
        // Object originalMessage = msg.getMessage();
        // String json = new Gson().toJson(xxx);
        // Channels.write(ctx, e.getFuture(), json, msg.getRemoteAddress());
        ctx.sendDownstream(e);
    }
}
