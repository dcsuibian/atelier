package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.domain.Permission;
import com.dcsuibian.atelier.domain.Role;
import com.dcsuibian.atelier.dto.IdDto;
import com.dcsuibian.atelier.qo.RoleQo;
import com.dcsuibian.atelier.service.RbacService;
import com.dcsuibian.atelier.service.RoleService;
import com.dcsuibian.atelier.validation.Add;
import com.dcsuibian.atelier.validation.EditPartially;
import com.dcsuibian.atelier.vo.PageWrapper;
import com.dcsuibian.atelier.vo.ResponseWrapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/roles")
public class RoleController {

	private final RoleService service;
	private final RbacService rbacService;

	@Autowired
	public RoleController(RoleService service, RbacService rbacService) {
		this.service = service;
		this.rbacService = rbacService;
	}

	@GetMapping
	public ResponseWrapper<PageWrapper<Role>> get(
			RoleQo qo,
			@RequestParam("pageNumber") @Min(value = 1, message = "页码从1开始") int pageNumber,
			@RequestParam("pageSize") @Min(value = 1, message = "每页数量至少为1") int pageSize
	) {
		return ResponseWrapper.success(service.get(qo, pageNumber, pageSize));
	}

	@GetMapping("/{id}")
	public ResponseWrapper<Role> getById(@PathVariable("id") long id) {
		return ResponseWrapper.success(service.getById(id));
	}

	@PostMapping
	public ResponseWrapper<Role> add(@RequestBody @Validated(Add.class) Role role) {
		return ResponseWrapper.success(service.add(role));
	}

	@PatchMapping("/{id}")
	public ResponseWrapper<Role> editPartially(
			@PathVariable("id") long id,
			@RequestBody @Validated(EditPartially.class) Role role
	) {
		role.setId(id);
		return ResponseWrapper.success(service.editPartially(role));
	}

	@DeleteMapping("/{id}")
	public ResponseWrapper<Void> deleteById(@PathVariable("id") long id) {
		service.deleteById(id);
		return ResponseWrapper.success();
	}

	@GetMapping("/{id}/permissions")
	public ResponseWrapper<List<Permission>> getPermissions(@PathVariable("id") long id) {
		return ResponseWrapper.success(rbacService.getPermissionsByRoleId(id));
	}

	@PutMapping("/{id}/permissions")
	public ResponseWrapper<List<IdDto>> setPermissions(
			@PathVariable("id") long id,
			@RequestBody List<@Valid IdDto> dtos
	) {
		rbacService.setPermissionsToRole(id, dtos.stream().map(IdDto::getId).toList());
		return ResponseWrapper.success(dtos);
	}

}
