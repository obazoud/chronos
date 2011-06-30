package com.chronos.cluster.couchdb.replicator;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.StringRequestEntity;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Il  s agit de manager la replication entre les noeuds de couch
 */
public class Replicator {
    private final static HttpClient httpclient = new HttpClient();



    public static void main(String...args){

        final String database = "thechallenge";
        // charger l ensemble des noueuds declarer dans la config
        final Ring ring = loadRingNodes();
        // initie la replication continue sur tous les noeuds du ring
        for(int i=0;i<ring.size();i++){

            boolean replicated = replicate(ring.node(i),ring.next(i),database);
            System.out.println(ring.node(i) + " -> " + ring.next(i) + " : "+ replicated);
            // TODO si probleme ?!
        }

        TimerTask heartbeat = new TimerTask(){
            @Override
            public void run() {
                if(ring.size()<=1){
                    return;
                }
                for(int position=0;position<ring.size();position++){
                  boolean up=true;
                  try {
                      GetMethod ping = new GetMethod("http://"+ring.node(position));
                      httpclient.executeMethod(ping);
                      ping.releaseConnection();
                  } catch (IOException e) {
                      up = false;
                  }
                  finally {

                      if(!up && ring.size()>1 ){ 
                          cancelReplication(ring.previous(position),ring.node(position),database);
                          replicate(ring.previous(position),ring.next(position),database);
                          ring.remove(position);
                          System.out.println("node : " + ring.node(position) + " : down");

                      }
                      System.out.println("node : " + ring.node(position) + " : up");
                  }

              }
            }
        };

        new Timer().scheduleAtFixedRate(heartbeat,1000l,3000l);
    }

    public static Ring loadRingNodes(){
        return new Ring(new String[]{"slim:secret@localhost:5001","slim:secret@localhost:5002","slim:secret@localhost:5984"});
    }


    public static boolean replicate(String source, String target,String database){

        PostMethod replicate = new PostMethod("http://"+source+"/_replicate");
        try {
            replicate.setRequestEntity(new StringRequestEntity("{\"source\":\"http://"+source+"/"+database+"\",\"target\":\"http://"+target+"/"+database+"\", \"continuous\":true}","application/json","UTF8"));
            replicate.addRequestHeader("referer","http://localhost");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        try {
            int responseCode = httpclient.executeMethod(replicate);
            System.out.println( responseCode );
            return  (responseCode-200) >= 0 && (responseCode-200) < 100;
        } catch (IOException e) {
            e.printStackTrace();  
        }finally {
            replicate.releaseConnection();
        }
        return false;
    }

    public static boolean cancelReplication(String source, String target,String database){
        PostMethod cancel = new PostMethod("http://"+source+"/_replicate");
        try {
            cancel.setRequestEntity(new StringRequestEntity("{\"source\":\"http://"+source+"/"+database+"\",\"target\":\"http://"+target+"/"+database+"\", \"continuous\":true, \"cancel\":true}","application/json","UTF8"));
            cancel.addRequestHeader("referer","http://localhost");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        try {
            int responseCode = httpclient.executeMethod(cancel);
            System.out.println( responseCode );
            return  (responseCode-200) >= 0 && (responseCode-200) < 100;
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            cancel.releaseConnection();
        }
        return false;

    }

    public static class Ring{

        private String[] nodes;
        private String[] downNodes;  // TODO remettre un noeud de nouveau actif
        private int numDownNodes = 0;

        public Ring(String[] nodes) {
            this.nodes = nodes;
            this.downNodes = new String[nodes.length-1];
        }


        public String node(int position){
            return nodes[position];
        }

        public String next(int position){
            if(position==nodes.length-1){
                return nodes[0];
            }
            return nodes[position+1];
        }

        public String previous(int position){
            if(position==0){
                return nodes[nodes.length-1];
            }
            return nodes[position-1];
        }

        public void remove(int position){
            String[] newRingNodes = new String[nodes.length-1];
            int p = 0;
            for(int i=0;i<nodes.length;i++){
                if(i!=position){newRingNodes[p++]=nodes[i];}
                else { downNodes[numDownNodes++]=node(i); }
            }
            this.nodes = newRingNodes;
        }

        public int size(){
            return nodes.length;
        }

    }

}

