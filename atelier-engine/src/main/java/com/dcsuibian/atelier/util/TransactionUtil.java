package com.dcsuibian.atelier.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
public class TransactionUtil {

	/**
	 * 在当前数据库事务提交后执行，不在事务中则立即执行。
	 * 用于写 Redis 这类事务管不到的副作用：先写再提交，事务一旦回滚，副作用却已经生效；
	 * 清缓存则更糟，提交前被读回去的旧数据会重新写进缓存，一直留到过期。
	 * <p>
	 * 提交后执行时出的错只记日志：数据已经落库，再往上抛只会让调用方误以为操作失败
	 */
	public static void runAfterCommit(Runnable action) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					try {
						action.run();
					} catch (RuntimeException e) {
						log.error("事务提交后的操作失败", e);
					}
				}
			});
		} else {
			action.run();
		}
	}

	private TransactionUtil() {
	}

}
