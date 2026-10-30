import { describe, it, expect } from 'vitest'
import { pageRange } from './Pagination'

describe('pageRange', () => {
  it('shows all pages when few', () => expect(pageRange(2, 5)).toEqual([1, 2, 3, 4, 5]))
  it('adds ellipses around the current page', () => {
    expect(pageRange(6, 50, 2, 1)).toEqual([1, 'start-ellipsis', 4, 5, 6, 7, 8, 'end-ellipsis', 50])
  })
  it('handles the first and last pages', () => {
    expect(pageRange(1, 50)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 50])
    expect(pageRange(50, 50)).toEqual([1, 'start-ellipsis', 46, 47, 48, 49, 50])
  })
})
