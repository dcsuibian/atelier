package com.dcsuibian.atelier.vo;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 分页结果。页码从 1 开始
 */
@Getter
@Setter
public class PageWrapper<T> {

	private List<T> data; // 页内容
	private long total; // 总记录数
	private int pageNumber; // 当前页码
	private int pageSize; // 每页记录数

	private PageWrapper() {
	}

	public static <T> PageWrapper<T> of(List<T> list, long total, int pageNumber, int pageSize) {
		PageWrapper<T> result = new PageWrapper<>();
		result.setPageNumber(pageNumber);
		result.setPageSize(pageSize);
		result.setTotal(total);
		result.setData(list);
		return result;
	}

}
