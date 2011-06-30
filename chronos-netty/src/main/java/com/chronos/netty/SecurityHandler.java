package com.chronos.netty;

import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.channel.MessageEvent;
import org.jboss.netty.channel.SimpleChannelUpstreamHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author bazoud
 * @version $Id$
 */
public class SecurityHandler extends SimpleChannelUpstreamHandler {
    final Logger logger = LoggerFactory.getLogger(SecurityHandler.class);

    @Override
    public void messageReceived(ChannelHandlerContext ctx, MessageEvent e) throws Exception {
        super.messageReceived(ctx, e);
    }

}
