package com.chronos.biz.defaultimpl;

import java.io.IOException;
import java.io.OutputStream;

import org.codehaus.jackson.JsonEncoding;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.chronos.biz.QuizzApi;

public class SimpleQuizz implements QuizzApi {
  final Logger logger = LoggerFactory.getLogger(SimpleQuizz.class);
  JsonFactory jsonFactory = new JsonFactory();

  @Override
  public long addUser(String lastName, String firstName, String email, String password) throws Exception {
    // TODO Auto-generated method stub
    return 0;
  }

  @Override
  public void createQuizz(String authenticationKey, String parameters) {
    // TODO Auto-generated method stub
  }

  @Override
  public String answerQuestion(int number, int answerNumber, String sessionKey) {
    // TODO Auto-generated method stub
    return null;
  }

  @Override
  public String getQuestion(int number, String sessionKey) {
    // TODO Auto-generated method stub
    return null;
  }

  @Override
  public String getRank(String sessionKey) {
    // TODO Auto-generated method stub
    return null;
  }

  @Override
  public boolean login(String login, String password) {
    // TODO Auto-generated method stub
    return false;
  }

  @Override
  public void audit(OutputStream stream, String mail, String session_key) {
    try {
      JsonGenerator generator = jsonFactory.createJsonGenerator(stream, JsonEncoding.UTF8);
      generator.disable(JsonGenerator.Feature.AUTO_CLOSE_TARGET);
      generator.disable(JsonGenerator.Feature.AUTO_CLOSE_JSON_CONTENT);
      generator.writeStartObject();
      generator.writeStringField("user_answers", "xxx");
      generator.writeStringField("good_answers", "xxx");
      generator.writeEndObject();
      generator.close();
    } catch (IOException e) {
      logger.warn("Json expection in audit", e);
    }
  }

}
