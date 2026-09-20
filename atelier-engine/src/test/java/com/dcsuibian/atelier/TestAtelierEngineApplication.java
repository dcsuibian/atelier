package com.dcsuibian.atelier;

import org.springframework.boot.SpringApplication;

public class TestAtelierEngineApplication {

	public static void main(String[] args) {
		SpringApplication.from(AtelierEngineApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
