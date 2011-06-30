package com.chronos.biz.defaultimpl;

import com.chronos.biz.QuizzApi;

public class SimpleQuizz implements QuizzApi {

	public long addUser(String lastName, String firstName, String email, String password) throws Exception {
		// TODO Auto-generated method stub
		return 0;
	}

	public void createQuizz(String authenticationKey, String parameters) {
		// TODO Auto-generated method stub
	}

	public String answerQuestion(int number, int answerNumber, String sessionKey) {
		// TODO Auto-generated method stub
		return null;
	}

	public String getQuestion(int number, String sessionKey) {
		// TODO Auto-generated method stub
		return null;
	}

	public String getRank(String sessionKey) {
		// TODO Auto-generated method stub
		return null;
	}

	public boolean login(String login, String password) {
		// TODO Auto-generated method stub
		return false;
	}

}
