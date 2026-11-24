/** 任意维度的数值：标量、向量、矩阵…… */
export type Tensor = number | Tensor[]

export interface Extent {
  min: number
  max: number
}
