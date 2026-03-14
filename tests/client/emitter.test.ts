import { describe, it, expect, vi } from 'vitest';
import { GamiforgeEventEmitter } from '../../src/events/emitter';

describe('GamiforgeEventEmitter', () => {
  it('calls registered listeners with correct payload', () => {
    const emitter = new GamiforgeEventEmitter();
    const handler = vi.fn();

    emitter.on('xp', handler);
    emitter.emit('xp', { amount: 25, totalXp: 100, ruleId: 'r1', reason: 'test' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      amount: 25,
      totalXp: 100,
      ruleId: 'r1',
      reason: 'test',
    });
  });

  it('supports multiple listeners on the same event', () => {
    const emitter = new GamiforgeEventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('achievement', handler1);
    emitter.on('achievement', handler2);
    emitter.emit('achievement', { achievementKey: 'xp_500', reason: 'test' });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('unsubscribe function removes the listener', () => {
    const emitter = new GamiforgeEventEmitter();
    const handler = vi.fn();

    const unsubscribe = emitter.on('levelUp', handler);
    unsubscribe();
    emitter.emit('levelUp', { newLevel: 3, reason: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('removeAll clears all listeners', () => {
    const emitter = new GamiforgeEventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('xp', handler1);
    emitter.on('achievement', handler2);
    emitter.removeAll();

    emitter.emit('xp', { amount: 10, totalXp: 10, ruleId: 'r1', reason: 'test' });
    emitter.emit('achievement', { achievementKey: 'a1', reason: 'test' });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('does not throw when emitting to non-existent events', () => {
    const emitter = new GamiforgeEventEmitter();
    expect(() =>
      emitter.emit('xp', { amount: 10, totalXp: 10, ruleId: 'r1', reason: 'test' })
    ).not.toThrow();
  });

  it('swallows listener errors without breaking other listeners', () => {
    const emitter = new GamiforgeEventEmitter();
    const badHandler = vi.fn(() => {
      throw new Error('boom');
    });
    const goodHandler = vi.fn();

    emitter.on('xp', badHandler);
    emitter.on('xp', goodHandler);

    emitter.emit('xp', { amount: 10, totalXp: 10, ruleId: 'r1', reason: 'test' });

    expect(badHandler).toHaveBeenCalledOnce();
    expect(goodHandler).toHaveBeenCalledOnce();
  });
});
