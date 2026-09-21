package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.IntegrationTests;
import com.dcsuibian.atelier.exception.BusinessException;
import com.dcsuibian.atelier.validation.Add;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandlerTests.ThrowingController.class)
public class GlobalExceptionHandlerTests extends IntegrationTests {

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("业务异常返回 HTTP 200，body 带业务码与原文案")
	void businessException() throws Exception {
		mockMvc.perform(get("/exception-tests/business"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(409))
				.andExpect(jsonPath("$.message").value("名称已存在"));
	}

	@Test
	@DisplayName("请求体校验失败返回业务码 400，文案指出字段")
	void validationFailure() throws Exception {
		mockMvc.perform(post("/exception-tests/validation").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value(containsString("name")));
	}

	@Test
	@DisplayName("请求体不是合法 JSON 返回业务码 400")
	void unreadableBody() throws Exception {
		mockMvc.perform(post("/exception-tests/validation").contentType(MediaType.APPLICATION_JSON).content("{"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400));
	}

	@Test
	@DisplayName("缺少必填查询参数返回业务码 400")
	void missingParameter() throws Exception {
		mockMvc.perform(get("/exception-tests/parameter"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value(containsString("pageNumber")));
	}

	@Test
	@DisplayName("查询参数类型错误返回业务码 400")
	void parameterTypeMismatch() throws Exception {
		mockMvc.perform(get("/exception-tests/parameter").param("pageNumber", "abc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value(containsString("pageNumber")));
	}

	@Test
	@DisplayName("数据库约束冲突返回业务码 400 与固定文案，不回显 SQL")
	void dataIntegrityViolation() throws Exception {
		mockMvc.perform(get("/exception-tests/data-integrity"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(400))
				.andExpect(jsonPath("$.message").value("数据冲突或仍被引用，无法完成操作"));
	}

	@Test
	@DisplayName("未知异常返回业务码 500 与通用文案，不回显异常原文")
	void unknownException() throws Exception {
		mockMvc.perform(get("/exception-tests/unknown"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.code").value(500))
				.andExpect(jsonPath("$.message").value(not(containsString("SQL"))));
	}

	@Test
	@DisplayName("请求方法不支持返回真实 HTTP 405")
	void methodNotSupported() throws Exception {
		mockMvc.perform(delete("/exception-tests/business"))
				.andExpect(status().isMethodNotAllowed());
	}

	@Test
	@DisplayName("接口不存在返回真实 HTTP 404")
	void noResource() throws Exception {
		mockMvc.perform(get("/no-such-path"))
				.andExpect(status().isNotFound());
	}

	@RestController
	@RequestMapping("/exception-tests")
	static class ThrowingController {

		@GetMapping("/business")
		void business() {
			throw new BusinessException("名称已存在", 409);
		}

		@PostMapping("/validation")
		void validation(@RequestBody @Validated(Add.class) Item item) {
		}

		@GetMapping("/parameter")
		void parameter(@RequestParam("pageNumber") int pageNumber) {
		}

		@GetMapping("/data-integrity")
		void dataIntegrity() {
			throw new DataIntegrityViolationException("SQL [insert into ...]; duplicate key value");
		}

		@GetMapping("/unknown")
		void unknown() {
			throw new IllegalStateException("SQL [select secret from somewhere]");
		}

	}

	@Getter
	@Setter
	static class Item {

		@NotBlank(groups = Add.class, message = "不能为空")
		private String name;

	}

}
