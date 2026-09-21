package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.qo.PermissionQo;
import com.dcsuibian.atelier.service.PermissionService;
import com.dcsuibian.atelier.vo.PageWrapper;
import com.dcsuibian.atelier.vo.ResponseWrapper;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 权限点由 permissions.yml 定义，这里只读
 */
@RestController
@RequestMapping("/permissions")
public class PermissionController {

	private final PermissionService service;

	@Autowired
	public PermissionController(PermissionService service) {
		this.service = service;
	}

	@GetMapping
	public ResponseWrapper<PageWrapper<Permission>> get(
			PermissionQo qo,
			@RequestParam("pageNumber") @Min(value = 1, message = "页码从1开始") int pageNumber,
			@RequestParam("pageSize") @Min(value = 1, message = "每页数量至少为1") int pageSize
	) {
		return ResponseWrapper.success(service.get(qo, pageNumber, pageSize));
	}

}
