package com.chronos.front.netty;

import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

import org.jboss.netty.bootstrap.ServerBootstrap;
import org.jboss.netty.channel.Channel;
import org.jboss.netty.channel.group.ChannelGroup;
import org.jboss.netty.channel.group.ChannelGroupFuture;
import org.jboss.netty.channel.group.DefaultChannelGroup;
import org.jboss.netty.channel.socket.nio.NioServerSocketChannelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author bazoud
 * @version $Id$
 */
public class NettyServer {
    final Logger logger = LoggerFactory.getLogger(NettyServer.class);
    ServerBootstrap bootstrap;
    ChannelGroup channels;

    public void start() {
        logger.info("HTTP-Netty-Server: starting.");
        ServerBootstrap bootstrap = new ServerBootstrap(new NioServerSocketChannelFactory(Executors.newCachedThreadPool(),
                Executors.newCachedThreadPool()));
        bootstrap.setPipelineFactory(new HttpServerPipelineFactory());
        bootstrap.setOption("child.tcpNoDelay", true);
        bootstrap.setOption("child.keepAlive", true);
        Channel channel = bootstrap.bind(new InetSocketAddress(8080));
        channels = new DefaultChannelGroup("HTTP-Netty-Server");
        channels.add(channel);

        logger.info("HTTP-Netty-Server: started.");
    }

    public void stop() {
        try {
            logger.info("");
            logger.info("HTTP-Netty-Server: stopping.");
            for (Channel channel : channels) {
                channel.unbind();
            }
            final ChannelGroupFuture future = channels.close();
            future.awaitUninterruptibly(120 * 1000);
            bootstrap.releaseExternalResources();
        } finally {
            logger.info("HTTP-Netty-Server: stopped.");
        }
    }

    public static void main(String[] args) {
        final NettyServer netty = new NettyServer();
        netty.start();
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            @Override
            public void run() {
                netty.stop();
            }
        }));
    }
}
