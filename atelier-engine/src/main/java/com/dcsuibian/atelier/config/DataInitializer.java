package com.dcsuibian.atelier.config;

import com.dcsuibian.atelier.service.PermissionService;
import com.dcsuibian.atelier.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 启动时准备基础数据。它们不放进 Flyway：权限点随代码演进、要能反复同步，超管的初始密码不能进版本库
 */
@Component
public class DataInitializer implements ApplicationRunner {

	private final PermissionService permissionService;
	private final UserService userService;
	private final String superAdminInitialPassword;

	@Autowired
	public DataInitializer(
			PermissionService permissionService,
			UserService userService,
			@Value("${atelier.super-admin.initial-password:}") String superAdminInitialPassword
	) {
		this.permissionService = permissionService;
		this.userService = userService;
		this.superAdminInitialPassword = superAdminInitialPassword;
	}

	@Override
	public void run(ApplicationArguments args) {
		permissionService.sync();
		userService.ensureSuperAdmin(superAdminInitialPassword);
	}

}
