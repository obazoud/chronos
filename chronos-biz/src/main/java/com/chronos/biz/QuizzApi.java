package com.chronos.biz;

public interface QuizzApi {

	/**
	 * @param lastName
	 * @param firstName
	 * @param email
	 * @param password
	 * @return un identifiant unique  de l'utilisateur généré par l'application 
	 * @throws Exception Si l'utilisateur ne peut pas être créer (email déjà existant par exemple)
	 */
	public long addUser(String lastName, String firstName, String email, String password) throws Exception;

	/**
	 * @param authentication_key 
	 * @param parameters
	 * @return
	 */
	public void createQuizz(String authentication_key, String parameters);
	
	public boolean login(String login, String password);
	
	/**
	 * @param number id of the question
	 * @param session_key id of the user
	 * @return json
	  { 
"question" : "string", 
"answer_1" : "string", 
"answer_2" : "string",
"answer_3" : "string", 
"answer_4" : "string", 
"score" : number 
}
	 */
	public String getQuestion(int number, String session_key);

	/**
	 * @param number Id of the question
	 * @param answerNumber selected answer
	 * @param session_key id of the user
	 * @return json
	  { 
"are_u_right" : "boolean",
"good_answer" : "string",
"score" : number
}
	 */
	public String answerQuestion(int number, int answerNumber, String session_key);

	/**
	 * @param session_key id of the user
	 * @return json
	  {
"top_scores" : { 
"mail" : [ "string", "string", ...],
"scores" : [ number, number, ...]
}
"before_me" : { 
"mail" : ["string", "string", ...],
"scores" : [number, number, ...]
}
"after_me" : { 
"mail" : ["string", "string", ...],
"scores" : [number, number, ...]
}
}
	 */
	public String getRank(String session_key);
	
}
