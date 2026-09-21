package com.dcsuibian.atelier.exception;

import lombok.Getter;

/**
 * 业务异常，message 会原样返回给调用方，不要放内部细节
 */
@Getter
public class BusinessException extends RuntimeException {

	private int code = 400;

	public BusinessException(String message) {
		super(message);
	}

	public BusinessException(String message, int code) {
		super(message);
		this.code = code;
	}

}
