package com.dcsuibian.atelier.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IdDto {

	@NotNull(message = "ID不能为空")
	private Long id;

}
