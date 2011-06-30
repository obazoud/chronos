package com.chronos.biz;

import com.chronos.biz.defaultimpl.SimpleQuizz;

public class App {

	public static QuizzApi get() {
		return new SimpleQuizz();
	}
	
}
