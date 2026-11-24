package com.dcsuibian.atelier.controller;

import com.dcsuibian.atelier.domain.Project;
import com.dcsuibian.atelier.qo.ProjectQo;
import com.dcsuibian.atelier.service.ProjectService;
import com.dcsuibian.atelier.validation.Add;
import com.dcsuibian.atelier.validation.EditPartially;
import com.dcsuibian.atelier.vo.PageWrapper;
import com.dcsuibian.atelier.vo.ResponseWrapper;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projects")
public class ProjectController {

	private final ProjectService service;

	@Autowired
	public ProjectController(ProjectService service) {
		this.service = service;
	}

	@GetMapping
	public ResponseWrapper<PageWrapper<Project>> get(
			ProjectQo qo,
			@RequestParam("pageNumber") @Min(value = 1, message = "页码从1开始") int pageNumber,
			@RequestParam("pageSize") @Min(value = 1, message = "每页数量至少为1") int pageSize
	) {
		return ResponseWrapper.success(service.get(qo, pageNumber, pageSize));
	}

	@GetMapping("/{id}")
	public ResponseWrapper<Project> getById(@PathVariable("id") long id) {
		return ResponseWrapper.success(service.getById(id));
	}

	@PostMapping
	public ResponseWrapper<Project> add(@RequestBody @Validated(Add.class) Project project) {
		return ResponseWrapper.success(service.add(project));
	}

	@PatchMapping("/{id}")
	public ResponseWrapper<Project> editPartially(
			@PathVariable("id") long id,
			@RequestBody @Validated(EditPartially.class) Project project
	) {
		project.setId(id);
		return ResponseWrapper.success(service.editPartially(project));
	}

	@DeleteMapping("/{id}")
	public ResponseWrapper<Void> deleteById(@PathVariable("id") long id) {
		service.deleteById(id);
		return ResponseWrapper.success();
	}

}
