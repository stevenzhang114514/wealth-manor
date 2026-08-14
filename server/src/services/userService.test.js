/**
 * 用户域纯函数单元测试
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidPhone } from './userService.js'

test('手机号校验：合法 11 位手机号', () => {
  assert.equal(isValidPhone('13800138000'), true)
  assert.equal(isValidPhone('19912345678'), true)
})

test('手机号校验：非法输入拒绝', () => {
  assert.equal(isValidPhone('12345'), false)
  assert.equal(isValidPhone('23800138000'), false) // 非1开头
  assert.equal(isValidPhone('1380013800'), false) // 10位
  assert.equal(isValidPhone('138001380001'), false) // 12位
  assert.equal(isValidPhone(''), false)
  assert.equal(isValidPhone(null), false)
})
