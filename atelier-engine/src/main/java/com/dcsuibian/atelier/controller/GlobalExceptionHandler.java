package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.vo.ResponseWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

/**
 * 全局异常处理。
 * <p>
 * body 里的 code 是业务码，借鉴 HTTP 状态码的语义：被这里捕获的异常都算已处理，返回 HTTP 200 + 业务码；
 * 没匹配上接口（404 / 405）不是业务响应，只返回真实 HTTP 状态码。
 * 返回给调用方的 message 不回显异常原文（可能带 SQL），原文只进日志。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BusinessException.class)
	public ResponseWrapper<Void> handleBusinessException(BusinessException e) {
		log.debug("业务异常：{}", e.getMessage());
		return ResponseWrapper.fail(e.getMessage(), e.getCode());
	}

	/**
	 * 请求体校验失败，或查询参数绑定到对象时校验、类型转换失败。
	 * 类型转换失败的默认消息是 Spring 原文，带完整类名，只进日志，返回给调用方的只说取值无效
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseWrapper<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
		StringBuilder message = new StringBuilder("参数校验失败：");
		for (FieldError error : e.getBindingResult().getFieldErrors()) {
			String reason = error.isBindingFailure() ? "取值无效" : error.getDefaultMessage();
			message.append(error.getField()).append("：").append(reason).append("；");
		}
		log.warn("{}（原文：{}）", message, e.getMessage());
		return ResponseWrapper.fail(message.toString(), 400);
	}

	/**
	 * 直接写在方法参数上的约束（如查询参数上的 @Min）校验失败
	 */
	@ExceptionHandler(HandlerMethodValidationException.class)
	public ResponseWrapper<Void> handleHandlerMethodValidationException(HandlerMethodValidationException e) {
		String message = "参数校验失败：" + e.getAllErrors().stream()
				.map(MessageSourceResolvable::getDefaultMessage)
				.collect(Collectors.joining("；"));
		log.warn("{}", message);
		return ResponseWrapper.fail(message, 400);
	}

	/**
	 * 请求体不是合法 JSON，或字段类型对不上（比如枚举取值不存在）
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseWrapper<Void> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
		log.warn("请求体无法解析：{}", e.getMessage());
		return ResponseWrapper.fail("请求体格式错误", 400);
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseWrapper<Void> handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {
		return ResponseWrapper.fail("缺少参数：" + e.getParameterName(), 400);
	}

	@ExceptionHandler(MissingRequestHeaderException.class)
	public ResponseWrapper<Void> handleMissingRequestHeaderException(MissingRequestHeaderException e) {
		return ResponseWrapper.fail("缺少请求头：" + e.getHeaderName(), 400);
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseWrapper<Void> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
		return ResponseWrapper.fail("参数类型错误：" + e.getName(), 400);
	}

	/**
	 * 没匹配上接口，不是业务响应，只给真实 HTTP 状态码。必须显式声明，否则会被下面的兜底吞成业务码 500
	 */
	@ExceptionHandler(NoResourceFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public void handleNoResourceFoundException() {
	}

	/**
	 * 同上
	 */
	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	@ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
	public void handleHttpRequestMethodNotSupportedException() {
	}

	/**
	 * 数据库约束兜底（唯一约束、外键等），不回显 SQL。业务层能预判的冲突应自行抛 BusinessException 给出具体文案
	 */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseWrapper<Void> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
		log.warn("数据完整性冲突：{}", e.getMostSpecificCause().getMessage());
		return ResponseWrapper.fail("数据冲突或仍被引用，无法完成操作", 400);
	}

	@ExceptionHandler(Exception.class)
	public ResponseWrapper<Void> handleException(Exception e) {
		log.error("未处理的异常", e);
		return ResponseWrapper.fail("服务器内部错误", 500);
	}

}
