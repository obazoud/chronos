package com.chronos.netty.server;

import java.net.InetSocketAddress;
import java.util.concurrent.Executor;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.jboss.netty.bootstrap.ServerBootstrap;
import org.jboss.netty.channel.Channel;
import org.jboss.netty.channel.group.ChannelGroup;
import org.jboss.netty.channel.group.ChannelGroupFuture;
import org.jboss.netty.channel.group.DefaultChannelGroup;
import org.jboss.netty.channel.socket.nio.NioServerSocketChannelFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.chronos.netty.pipeline.HttpServerPipelineFactory;

/**
 * @author bazoud
 * @version $Id$
 */
public class NettyServer {
    final Logger logger = LoggerFactory.getLogger(NettyServer.class);
    ServerBootstrap bootstrap;
    ChannelGroup channels;
    int port = 8080;

    public void start() {
        logger.info("HTTP-Netty-Server: starting on port {}.", port);

        bootstrap = new ServerBootstrap(new NioServerSocketChannelFactory(bossExecutor(), workerExecutor()));
        bootstrap.setPipelineFactory(new HttpServerPipelineFactory());
        bootstrap.setOption("child.tcpNoDelay", true);
        bootstrap.setOption("child.keepAlive", true);
        Channel channel = bootstrap.bind(new InetSocketAddress(port));
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
            future.awaitUninterruptibly(10 * 1000);
            bootstrap.releaseExternalResources();
        } finally {
            logger.info("HTTP-Netty-Server: stopped.");
        }
    }

    public static void main(String[] args) throws Exception {
        final NettyServer netty = new NettyServer();
        netty.initialize();
        netty.start();
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            @Override
            public void run() {
                netty.stop();
            }
        }));
    }

    public void initialize() throws Exception {
        // parse json sample
        // to force classloading
        JsonFactory jsonFactory = new JsonFactory();
        byte[] json = "{\"user_mail\" : \"string\", \"authentication_key\" : \"string\"}".getBytes();
        JsonParser jp = jsonFactory.createJsonParser(json);
        jp.nextToken();
        while (jp.nextToken() != JsonToken.END_OBJECT) {
            jp.nextToken();
            jp.getCurrentName();
            jp.getText();
        }
    }

    private Executor bossExecutor() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS, new SynchronousQueue<Runnable>());
    }

    private Executor workerExecutor() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS, new SynchronousQueue<Runnable>());
    }
}
