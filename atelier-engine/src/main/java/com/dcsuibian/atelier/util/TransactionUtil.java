package com.dcsuibian.atelier.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class TransactionUtil {

	/**
	 * 在当前数据库事务提交后执行，不在事务中则立即执行。
	 * 用于写 Redis 这类事务管不到的副作用：先写再提交，事务一旦回滚，副作用却已经生效；
	 * 清缓存则更糟，提交前被读回去的旧数据会重新写进缓存，一直留到过期。
	 */
	public static void runAfterCommit(Runnable action) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					action.run();
				}
			});
		} else {
			action.run();
		}
	}

	private TransactionUtil() {
	}

}
